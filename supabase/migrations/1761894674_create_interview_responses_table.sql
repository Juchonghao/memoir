-- Migration: create_interview_responses_table
-- Created at: 1761894674

CREATE TABLE IF NOT EXISTS interview_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    question TEXT NOT NULL,
    answer TEXT,
    emotion_tag VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);;