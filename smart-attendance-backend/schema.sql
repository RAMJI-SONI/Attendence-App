-- Optional: the Node server automatically creates these tables.
-- Use this file if you prefer to run the schema manually in PostgreSQL/Supabase.

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('student','teacher','admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS classes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  semester INT NOT NULL,
  section VARCHAR(20) NOT NULL,
  department VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  code VARCHAR(30) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  class_id INT REFERENCES classes(id) ON DELETE CASCADE,
  room VARCHAR(80)
);

CREATE TABLE IF NOT EXISTS enrollments (
  student_id INT REFERENCES users(id) ON DELETE CASCADE,
  subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
  PRIMARY KEY(student_id,subject_id)
);

CREATE TABLE IF NOT EXISTS attendance_sessions (
  id SERIAL PRIMARY KEY,
  subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id INT REFERENCES users(id),
  room VARCHAR(80),
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ NOT NULL,
  qr_token TEXT NOT NULL UNIQUE,
  latitude NUMERIC,
  longitude NUMERIC,
  radius_m INT DEFAULT 100
);

CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  session_id INT REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  student_id INT REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'present',
  marked_at TIMESTAMPTZ DEFAULT NOW(),
  latitude NUMERIC,
  longitude NUMERIC,
  UNIQUE(session_id,student_id)
);