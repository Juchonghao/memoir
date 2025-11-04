CREATE TABLE conversation_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    chapter VARCHAR(100) NOT NULL,
    key_themes TEXT[],
    important_details TEXT,
    question_history TEXT[],
    total_rounds INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);