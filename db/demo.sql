-- Execute after migrations and seed, in the same database as the application.
-- All application writes below are rolled back. No live tables are dropped.
BEGIN;
CREATE TEMP TABLE ddl_demo(id integer PRIMARY KEY);
ALTER TABLE ddl_demo ADD COLUMN description text NOT NULL DEFAULT '';
INSERT INTO ddl_demo VALUES(1,'Create and insert');
UPDATE ddl_demo SET description='Updated successfully' WHERE id=1;
SELECT * FROM ddl_demo;
DELETE FROM ddl_demo WHERE id=1;
DROP TABLE ddl_demo;

SELECT t.team_name,coalesce(count(tm.player_id),0) AS roster_size
FROM TEAM t LEFT JOIN TEAM_MEMBER tm USING(team_id)
GROUP BY t.team_id ORDER BY roster_size DESC,t.team_name;

SELECT p.username,sum(s.kills) AS total_kills
FROM PLAYER p INNER JOIN PLAYER_MATCH_STATS s USING(player_id)
WHERE p.player_id IN(SELECT player_id FROM PLAYED_BY)
GROUP BY p.player_id HAVING sum(s.kills)>20 ORDER BY total_kills DESC;

SELECT * FROM tournament_standings WHERE tournament_id=1 ORDER BY points DESC,team_name;
SELECT * FROM player_performance(1);
SELECT schedule_match(1,'2026-08-20','Demo Final',1,2) AS temporary_match;
SELECT entity,operation,changed_at FROM audit_log ORDER BY audit_id DESC LIMIT 10;
EXPLAIN (ANALYZE,BUFFERS) SELECT * FROM PLAYER_MATCH_STATS WHERE player_id=1;
ROLLBACK;
