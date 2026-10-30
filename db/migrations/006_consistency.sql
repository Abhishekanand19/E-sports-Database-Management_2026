ALTER TABLE RESULT ADD CONSTRAINT winner_scheduled_fk FOREIGN KEY(match_id,winning_team_id) REFERENCES MATCH_TEAM(match_id,team_id);
ALTER TABLE RESULT ADD CONSTRAINT loser_scheduled_fk FOREIGN KEY(match_id,losing_team_id) REFERENCES MATCH_TEAM(match_id,team_id);
ALTER TABLE TEAM_MEMBER ADD CHECK ((status='active') = (leave_date IS NULL));

CREATE FUNCTION complete_match() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE mid integer;
BEGIN
 mid:=coalesce(NEW.match_id,OLD.match_id);
 IF EXISTS(SELECT 1 FROM MATCH WHERE match_id=mid) AND (SELECT count(*) FROM MATCH_TEAM WHERE match_id=mid)<>2 THEN
  RAISE EXCEPTION 'A scheduled match requires exactly two opponents' USING ERRCODE='23514';
 END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER match_complete AFTER INSERT OR UPDATE ON MATCH DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION complete_match();
CREATE CONSTRAINT TRIGGER opponents_complete AFTER INSERT OR UPDATE OR DELETE ON MATCH_TEAM DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION complete_match();

CREATE FUNCTION valid_positions() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE tid integer;
BEGIN
 tid:=coalesce(NEW.tournament_id,OLD.tournament_id);
 IF EXISTS(SELECT 1 FROM PARTICIPATES_IN WHERE tournament_id=tid AND final_position>(SELECT count(*) FROM PARTICIPATES_IN WHERE tournament_id=tid)) THEN
  RAISE EXCEPTION 'Final position exceeds number of registered teams' USING ERRCODE='23514';
 END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER final_positions AFTER INSERT OR UPDATE OR DELETE ON PARTICIPATES_IN DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION valid_positions();

CREATE FUNCTION protect_roster_delete() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM PLAYED_BY p JOIN MATCH m USING(match_id) WHERE p.player_id=OLD.player_id AND p.team_id=OLD.team_id AND m.match_date BETWEEN OLD.join_date AND coalesce(OLD.leave_date,'infinity'::date)) THEN
  RAISE EXCEPTION 'Remove recorded participation before deleting its roster membership' USING ERRCODE='23514';
 END IF;
 RETURN OLD;
END $$;
CREATE TRIGGER preserve_roster_history BEFORE DELETE ON TEAM_MEMBER FOR EACH ROW EXECUTE FUNCTION protect_roster_delete();
