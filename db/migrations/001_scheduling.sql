CREATE TABLE MATCH_TEAM (
  match_id integer NOT NULL REFERENCES MATCH ON DELETE CASCADE,
  team_id integer NOT NULL REFERENCES TEAM ON DELETE RESTRICT,
  PRIMARY KEY(match_id, team_id)
);
INSERT INTO MATCH_TEAM SELECT match_id, winning_team_id FROM RESULT
UNION SELECT match_id, losing_team_id FROM RESULT
UNION SELECT match_id, team_id FROM PLAYED_BY;
ALTER TABLE PLAYED_BY ADD CONSTRAINT one_team_per_match UNIQUE(match_id, player_id);
ALTER TABLE PLAYED_BY ADD CONSTRAINT scheduled_team_fk FOREIGN KEY(match_id,team_id)
  REFERENCES MATCH_TEAM(match_id,team_id) ON DELETE RESTRICT;
ALTER TABLE PLAYER_MATCH_STATS ADD CONSTRAINT played_stats_fk FOREIGN KEY(match_id,player_id)
  REFERENCES PLAYED_BY(match_id,player_id) ON DELETE CASCADE;
CREATE INDEX match_tournament_date_idx ON MATCH(tournament_id,match_date);
CREATE INDEX roster_team_idx ON TEAM_MEMBER(team_id);
CREATE INDEX stats_player_idx ON PLAYER_MATCH_STATS(player_id);
CREATE UNIQUE INDEX unique_active_roster_idx ON TEAM_MEMBER(player_id) WHERE status='active';
CREATE UNIQUE INDEX unique_final_position_idx ON PARTICIPATES_IN(tournament_id,final_position) WHERE final_position IS NOT NULL;
