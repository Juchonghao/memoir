-- Migration: add_indexes_for_conversation_tables
-- Created at: 1761924005

-- 为 conversation_history 表创建索引
CREATE INDEX idx_conversation_history_user_id ON conversation_history(user_id);
CREATE INDEX idx_conversation_history_chapter ON conversation_history(chapter);
CREATE INDEX idx_conversation_history_session_id ON conversation_history(session_id);
CREATE INDEX idx_conversation_history_created_at ON conversation_history(created_at DESC);
CREATE INDEX idx_conversation_history_user_chapter ON conversation_history(user_id, chapter);

-- 为 conversation_summary 表创建索引
CREATE INDEX idx_conversation_summary_user_id ON conversation_summary(user_id);
CREATE INDEX idx_conversation_summary_chapter ON conversation_summary(chapter);
CREATE INDEX idx_conversation_summary_user_chapter ON conversation_summary(user_id, chapter);;