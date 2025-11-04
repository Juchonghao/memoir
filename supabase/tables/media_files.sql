CREATE TABLE media_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_type VARCHAR(50) NOT NULL,
    file_url TEXT NOT NULL,
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    decade VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);