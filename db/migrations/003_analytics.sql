CREATE VIEW tournament_standings AS
SELECT pi.tournament_id, t.team_id, t.team_name, pi.final_position,
 count(r.match_id)::integer AS played,
 count(r.match_id) FILTER(WHERE r.winning_team_id=t.team_id)::integer AS wins,
 count(r.match_id) FILTER(WHERE r.losing_team_id=t.team_id)::integer AS losses,
 (3*count(r.match_id) FILTER(WHERE r.winning_team_id=t.team_id))::integer AS points
FROM PARTICIPATES_IN pi JOIN TEAM t USING(team_id)
LEFT JOIN MATCH m ON m.tournament_id=pi.tournament_id
LEFT JOIN RESULT r ON r.match_id=m.match_id AND t.team_id IN(r.winning_team_id,r.losing_team_id)
GROUP BY pi.tournament_id,t.team_id,pi.final_position;

CREATE FUNCTION player_performance(tid integer DEFAULT NULL)
RETURNS TABLE(player_id integer,username varchar,matches integer,kills integer,deaths integer,assists integer,kd double precision,avg_rating double precision)
LANGUAGE sql STABLE AS $$
 SELECT p.player_id,p.username,count(*)::int,sum(s.kills)::int,sum(s.deaths)::int,sum(s.assists)::int,
 round(sum(s.kills)::numeric/greatest(sum(s.deaths),1),2)::float,
 round(avg(s.rating),2)::float
 FROM PLAYER p JOIN PLAYER_MATCH_STATS s USING(player_id) JOIN MATCH m USING(match_id)
 WHERE tid IS NULL OR m.tournament_id=tid GROUP BY p.player_id
 ORDER BY round(avg(s.rating),2) DESC NULLS LAST,p.username
$$;

CREATE FUNCTION schedule_match(tid integer,d date,r text,team_a integer,team_b integer)
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE mid integer;
BEGIN
 IF team_a=team_b THEN RAISE EXCEPTION 'Choose two different opponents' USING ERRCODE='23514'; END IF;
 INSERT INTO MATCH(tournament_id,match_date,round) VALUES(tid,d,r) RETURNING match_id INTO mid;
 INSERT INTO MATCH_TEAM VALUES(mid,team_a),(mid,team_b);
 RETURN mid;
END $$;

CREATE TABLE audit_log (
 audit_id bigserial PRIMARY KEY, entity text NOT NULL, operation text NOT NULL,
 changed_at timestamptz NOT NULL DEFAULT now(), old_value jsonb, new_value jsonb
);
CREATE FUNCTION audit_result() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 INSERT INTO audit_log(entity,operation,old_value,new_value) VALUES('result',TG_OP,to_jsonb(OLD),to_jsonb(NEW));
 RETURN coalesce(NEW,OLD);
END $$;
CREATE TRIGGER result_audit AFTER INSERT OR UPDATE OR DELETE ON RESULT FOR EACH ROW EXECUTE FUNCTION audit_result();
