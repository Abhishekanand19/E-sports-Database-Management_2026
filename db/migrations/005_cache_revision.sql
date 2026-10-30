CREATE TABLE cache_revision(singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton), version bigint NOT NULL DEFAULT 1);
INSERT INTO cache_revision DEFAULT VALUES;
CREATE FUNCTION advance_cache_revision() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN UPDATE cache_revision SET version=version+1; RETURN NULL; END $$;
DO $$ DECLARE entity text; BEGIN
 FOREACH entity IN ARRAY ARRAY['player','team','team_member','game','tournament','participates_in','match','match_team','result','played_by','player_match_stats'] LOOP
  EXECUTE format('CREATE TRIGGER cache_revision AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH STATEMENT EXECUTE FUNCTION advance_cache_revision()',entity);
 END LOOP;
END $$;
