ALTER TABLE PLAYER ADD CHECK (length(trim(username)) > 0 AND length(trim(country)) > 0 AND length(trim(role)) > 0);
ALTER TABLE TEAM ADD CHECK (length(trim(team_name)) > 0 AND length(trim(country)) > 0);
ALTER TABLE TOURNAMENT ADD CHECK (length(trim(name)) > 0);
ALTER TABLE MATCH ADD CHECK (length(trim(round)) > 0);
ALTER TABLE TEAM_MEMBER ADD CHECK (status <> 'active' OR leave_date IS NULL);
ALTER TABLE RESULT ADD CHECK (score ~ '^[0-9]{1,3}-[0-9]{1,3}$' AND split_part(score,'-',1)::int > split_part(score,'-',2)::int);

CREATE FUNCTION validate_match_date() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM 1 FROM TOURNAMENT WHERE tournament_id=NEW.tournament_id
    AND NEW.match_date BETWEEN start_date AND end_date FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Match date must be inside tournament dates' USING ERRCODE='23514'; END IF;
  IF TG_OP='UPDATE' AND (NEW.tournament_id<>OLD.tournament_id OR NEW.match_date<>OLD.match_date) THEN
    IF EXISTS(SELECT 1 FROM MATCH_TEAM WHERE match_id=OLD.match_id) THEN
      RAISE EXCEPTION 'Remove the match before changing a scheduled match date or tournament' USING ERRCODE='23514';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER match_dates BEFORE INSERT OR UPDATE ON MATCH FOR EACH ROW EXECUTE FUNCTION validate_match_date();

CREATE FUNCTION validate_tournament_dates() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS(SELECT 1 FROM MATCH WHERE tournament_id=NEW.tournament_id AND match_date NOT BETWEEN NEW.start_date AND NEW.end_date) THEN
    RAISE EXCEPTION 'Tournament dates exclude an existing match' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER tournament_dates BEFORE UPDATE ON TOURNAMENT FOR EACH ROW EXECUTE FUNCTION validate_tournament_dates();

CREATE FUNCTION validate_scheduled_team() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE tid integer;
BEGIN
  SELECT tournament_id INTO tid FROM MATCH WHERE match_id=NEW.match_id FOR UPDATE;
  PERFORM 1 FROM PARTICIPATES_IN WHERE tournament_id=tid AND team_id=NEW.team_id FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Team must register before scheduling' USING ERRCODE='23514'; END IF;
  IF (SELECT count(*) FROM MATCH_TEAM WHERE match_id=NEW.match_id) >= 2 THEN
    RAISE EXCEPTION 'A match has exactly two opponents' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER scheduled_teams BEFORE INSERT ON MATCH_TEAM FOR EACH ROW EXECUTE FUNCTION validate_scheduled_team();

CREATE FUNCTION validate_result() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM 1 FROM MATCH WHERE match_id=NEW.match_id FOR UPDATE;
  IF (SELECT count(*) FROM MATCH_TEAM WHERE match_id=NEW.match_id AND team_id IN (NEW.winning_team_id,NEW.losing_team_id)) <> 2 THEN
    RAISE EXCEPTION 'Result must use both scheduled opponents' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER valid_result BEFORE INSERT OR UPDATE ON RESULT FOR EACH ROW EXECUTE FUNCTION validate_result();

CREATE FUNCTION validate_roster() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM 1 FROM PLAYER WHERE player_id=NEW.player_id FOR UPDATE;
  IF EXISTS(SELECT 1 FROM TEAM_MEMBER tm WHERE tm.player_id=NEW.player_id
    AND (tm.player_id,tm.team_id,tm.join_date) IS DISTINCT FROM
        (CASE WHEN TG_OP='UPDATE' THEN OLD.player_id END,CASE WHEN TG_OP='UPDATE' THEN OLD.team_id END,CASE WHEN TG_OP='UPDATE' THEN OLD.join_date END)
    AND daterange(tm.join_date,tm.leave_date,'[]') && daterange(NEW.join_date,NEW.leave_date,'[]')) THEN
    RAISE EXCEPTION 'Roster membership periods cannot overlap' USING ERRCODE='23514';
  END IF;
  IF TG_OP='UPDATE' AND EXISTS(SELECT 1 FROM PLAYED_BY p JOIN MATCH m USING(match_id)
    WHERE p.player_id=OLD.player_id AND p.team_id=OLD.team_id
    AND m.match_date BETWEEN OLD.join_date AND coalesce(OLD.leave_date,'infinity'::date)
    AND (NEW.player_id<>OLD.player_id OR NEW.team_id<>OLD.team_id OR m.match_date NOT BETWEEN NEW.join_date AND coalesce(NEW.leave_date,'infinity'::date))) THEN
    RAISE EXCEPTION 'Roster change would invalidate recorded participation' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER roster_integrity BEFORE INSERT OR UPDATE ON TEAM_MEMBER FOR EACH ROW EXECUTE FUNCTION validate_roster();

CREATE FUNCTION validate_played_by() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE d date;
BEGIN
  SELECT match_date INTO d FROM MATCH WHERE match_id=NEW.match_id FOR SHARE;
  PERFORM 1 FROM PLAYER WHERE player_id=NEW.player_id FOR UPDATE;
  PERFORM 1 FROM TEAM_MEMBER WHERE player_id=NEW.player_id AND team_id=NEW.team_id
    AND d BETWEEN join_date AND coalesce(leave_date,'infinity'::date) FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Player must belong to this team on the match date' USING ERRCODE='23514'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER valid_match_player BEFORE INSERT OR UPDATE ON PLAYED_BY FOR EACH ROW EXECUTE FUNCTION validate_played_by();

CREATE FUNCTION protect_registration() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS(SELECT 1 FROM MATCH_TEAM mt JOIN MATCH m USING(match_id) WHERE m.tournament_id=OLD.tournament_id AND mt.team_id=OLD.team_id) THEN
    RAISE EXCEPTION 'Remove scheduled matches before unregistering their team' USING ERRCODE='23514';
  END IF;
  RETURN OLD;
END $$;
CREATE TRIGGER registration_integrity BEFORE DELETE ON PARTICIPATES_IN FOR EACH ROW EXECUTE FUNCTION protect_registration();

CREATE FUNCTION validate_birth_date() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.date_of_birth > current_date THEN RAISE EXCEPTION 'Birth date cannot be in the future' USING ERRCODE='23514'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER birth_date BEFORE INSERT OR UPDATE ON PLAYER FOR EACH ROW EXECUTE FUNCTION validate_birth_date();
