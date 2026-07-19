-- Challenge lifecycle: pause/resume, cancel, restart, kick participants.
ALTER TABLE challenges DROP CONSTRAINT challenges_status_check;
ALTER TABLE challenges ADD CONSTRAINT challenges_status_check
  CHECK (status IN ('active', 'paused', 'completed', 'cancelled'));
