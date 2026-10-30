-- Run after schema.sql on a fresh database (IDs start at 1)
INSERT INTO GAME (title, developer, genre) VALUES
  ('Valorant', 'Riot Games', 'Tactical FPS'),
  ('League of Legends', 'Riot Games', 'MOBA'),
  ('Counter-Strike 2', 'Valve', 'Tactical FPS');

INSERT INTO TEAM (team_name, country, founded_date) VALUES
  ('Phoenix Rising', 'India', '2019-03-01'),
  ('Night Owls', 'Japan', '2020-06-15'),
  ('Iron Wolves', 'Brazil', '2018-11-20'),
  ('Neon Tigers', 'South Korea', '2021-01-10');

INSERT INTO PLAYER (username, country, role, date_of_birth) VALUES
  ('ShadowAce', 'India', 'Carry', '2001-05-12'),
  ('NovaSniper', 'Japan', 'Carry', '2002-08-03'),
  ('Kaze', 'Japan', 'Support', '1999-11-22'),
  ('IronMike', 'Brazil', 'IGL', '1998-02-14'),
  ('Tigra', 'South Korea', 'Flex', '2003-07-30'),
  ('Riptide', 'India', 'Support', '2000-09-09');

INSERT INTO TEAM_MEMBER (player_id, team_id, join_date) VALUES
  (1, 1, '2019-04-01'), (3, 1, '2021-01-15'), (4, 1, '2020-05-20'),
  (6, 2, '2022-02-01'), (5, 3, '2024-03-01'), (2, 4, '2023-06-10');

INSERT INTO TOURNAMENT (name, game_id, start_date, end_date, prize_pool) VALUES
  ('Champions Clash 2026', 1, '2026-08-01', '2026-08-30', 50000),
  ('Winter Showdown', 3, '2026-10-01', '2026-10-15', 20000);

INSERT INTO PARTICIPATES_IN (tournament_id, team_id, final_position) VALUES
  (1, 1, 1), (1, 3, 2), (1, 2, 3),
  (2, 3, 1), (2, 4, 2);

INSERT INTO MATCH (tournament_id, match_date, round) VALUES
  (1, '2026-08-05', 'Quarterfinal'),
  (1, '2026-08-12', 'Semifinal'),
  (2, '2026-10-03', 'Group Stage');

INSERT INTO RESULT (match_id, winning_team_id, losing_team_id, score) VALUES
  (1, 1, 2, '13-7'),
  (2, 1, 3, '13-11'),
  (3, 3, 4, '13-9');

INSERT INTO PLAYED_BY (match_id, team_id, player_id) VALUES
  (1, 1, 1), (1, 1, 3), (1, 1, 4), (1, 2, 6),
  (2, 1, 1), (2, 1, 3), (2, 1, 4), (2, 3, 5),
  (3, 3, 5), (3, 4, 2);

INSERT INTO PLAYER_MATCH_STATS (match_id, player_id, kills, deaths, assists, damage, rating) VALUES
  (1, 1, 22, 10, 5, 2800, 1.35), (1, 3, 15, 12, 6, 2100, 1.02),
  (1, 4, 4, 11, 9, 1500, 0.71),  (1, 6, 8, 13, 3, 1900, 0.88),
  (2, 1, 18, 9, 4, 2450, 1.28),  (2, 3, 12, 10, 7, 1900, 0.96),
  (2, 4, 6, 9, 8, 1200, 0.78),   (2, 5, 20, 11, 4, 2300, 1.10),
  (3, 5, 17, 8, 5, 2050, 1.22),  (3, 2, 9, 10, 3, 1400, 0.85);
