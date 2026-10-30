CREATE TABLE app_user (
 user_id serial PRIMARY KEY, username varchar(50) NOT NULL UNIQUE,
 password_hash text NOT NULL, role text NOT NULL CHECK(role IN('admin','viewer')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE app_session (
 token_hash char(64) PRIMARY KEY, user_id integer NOT NULL REFERENCES app_user ON DELETE CASCADE,
 expires_at timestamptz NOT NULL
);
CREATE INDEX session_expiry_idx ON app_session(expires_at);
CREATE TABLE login_attempt (
 username text PRIMARY KEY, attempts integer NOT NULL DEFAULT 1,
 window_start timestamptz NOT NULL DEFAULT now()
);
