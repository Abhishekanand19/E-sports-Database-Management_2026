-- Opponents and registration identities are immutable once created. Administrative
-- changes use explicit cancellation/withdrawal and recreation, with dependency checks.
CREATE FUNCTION protect_opponent_update() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF (NEW.match_id,NEW.team_id) IS DISTINCT FROM (OLD.match_id,OLD.team_id) THEN
  RAISE EXCEPTION 'Cancel and recreate a match to change its opponents' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER immutable_opponents BEFORE UPDATE ON MATCH_TEAM FOR EACH ROW EXECUTE FUNCTION protect_opponent_update();
CREATE FUNCTION protect_registration_identity() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF (NEW.tournament_id,NEW.team_id) IS DISTINCT FROM (OLD.tournament_id,OLD.team_id) THEN
  RAISE EXCEPTION 'Withdraw and register again to change a registration identity' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER immutable_registration BEFORE UPDATE ON PARTICIPATES_IN FOR EACH ROW EXECUTE FUNCTION protect_registration_identity();
