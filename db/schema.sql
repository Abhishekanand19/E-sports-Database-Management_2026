-- Esports Tournament & Player Management System (PostgreSQL)
CREATE TABLE PLAYER (
  player_id     SERIAL PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  country       VARCHAR(60)  NOT NULL,
  role          VARCHAR(30)  NOT NULL,
  date_of_birth DATE         NOT NULL
);

CREATE TABLE TEAM (
  team_id      SERIAL PRIMARY KEY,
  team_name    VARCHAR(80) NOT NULL UNIQUE,
  country      VARCHAR(60) NOT NULL,
  founded_date DATE
);

CREATE TABLE TEAM_MEMBER (
  player_id  INT REFERENCES PLAYER(player_id) ON DELETE CASCADE,
  team_id    INT REFERENCES TEAM(team_id)     ON DELETE CASCADE,
  join_date  DATE NOT NULL,
  leave_date DATE,
  status     VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  PRIMARY KEY (player_id, team_id, join_date),
  CHECK (leave_date IS NULL OR leave_date >= join_date)
);

CREATE TABLE GAME (
  game_id   SERIAL PRIMARY KEY,
  title     VARCHAR(100) NOT NULL UNIQUE,
  developer VARCHAR(100),
  genre     VARCHAR(50)
);

CREATE TABLE TOURNAMENT (
  tournament_id SERIAL PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  game_id       INT NOT NULL REFERENCES GAME(game_id) ON DELETE RESTRICT,
  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL,
  prize_pool    NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (prize_pool >= 0),
  CHECK (end_date >= start_date)
);

CREATE TABLE PARTICIPATES_IN (
  tournament_id  INT REFERENCES TOURNAMENT(tournament_id) ON DELETE CASCADE,
  team_id        INT REFERENCES TEAM(team_id)             ON DELETE CASCADE,
  final_position INT CHECK (final_position IS NULL OR final_position > 0),
  PRIMARY KEY (tournament_id, team_id)
);

CREATE TABLE MATCH (
  match_id      SERIAL PRIMARY KEY,
  tournament_id INT NOT NULL REFERENCES TOURNAMENT(tournament_id) ON DELETE CASCADE,
  match_date    DATE NOT NULL,
  round         VARCHAR(30) NOT NULL
);

CREATE TABLE RESULT (
  match_id         INT PRIMARY KEY REFERENCES MATCH(match_id) ON DELETE CASCADE,
  winning_team_id  INT NOT NULL REFERENCES TEAM(team_id),
  losing_team_id   INT NOT NULL REFERENCES TEAM(team_id),
  score            VARCHAR(20) NOT NULL,
  recorded_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  CHECK (winning_team_id <> losing_team_id)
);

CREATE TABLE PLAYED_BY (
  match_id  INT REFERENCES MATCH(match_id)   ON DELETE CASCADE,
  team_id   INT REFERENCES TEAM(team_id)     ON DELETE CASCADE,
  player_id INT REFERENCES PLAYER(player_id) ON DELETE CASCADE,
  PRIMARY KEY (match_id, team_id, player_id)
);

CREATE TABLE PLAYER_MATCH_STATS (
  match_id  INT REFERENCES MATCH(match_id)   ON DELETE CASCADE,
  player_id INT REFERENCES PLAYER(player_id) ON DELETE CASCADE,
  kills     INT NOT NULL DEFAULT 0 CHECK (kills >= 0),
  deaths    INT NOT NULL DEFAULT 0 CHECK (deaths >= 0),
  assists   INT NOT NULL DEFAULT 0 CHECK (assists >= 0),
  damage    INT NOT NULL DEFAULT 0 CHECK (damage >= 0),
  rating    NUMERIC(3,2) CHECK (rating >= 0),
  PRIMARY KEY (match_id, player_id)
);
