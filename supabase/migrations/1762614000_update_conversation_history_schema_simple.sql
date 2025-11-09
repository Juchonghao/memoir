-- Migration: update_conversation_history_schema_simple
-- 简化版本：只添加缺失的列，不尝试复制数据

-- 添加 session_id 列（如果不存在）
ALTER TABLE conversation_history 
ADD COLUMN IF NOT EXISTS session_id VARCHAR(100);

-- 添加 ai_question 列（如果不存在）
ALTER TABLE conversation_history 
ADD COLUMN IF NOT EXISTS ai_question TEXT;

-- 添加 user_answer 列（如果不存在）
ALTER TABLE conversation_history 
ADD COLUMN IF NOT EXISTS user_answer TEXT;

-- 为 session_id 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_conversation_history_session_id 
ON conversation_history(session_id);

