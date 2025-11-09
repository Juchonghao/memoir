-- Migration: update_conversation_history_schema
-- Created at: 1762614000
-- 更新 conversation_history 表结构，添加缺失的列以匹配代码

-- 添加 session_id 列（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversation_history' 
        AND column_name = 'session_id'
    ) THEN
        ALTER TABLE conversation_history 
        ADD COLUMN session_id VARCHAR(100);
    END IF;
END $$;

-- 添加 ai_question 列（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversation_history' 
        AND column_name = 'ai_question'
    ) THEN
        ALTER TABLE conversation_history 
        ADD COLUMN ai_question TEXT;
        
        -- 将现有的 question 数据复制到 ai_question（如果 question 列存在）
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'conversation_history' 
            AND column_name = 'question'
        ) THEN
            UPDATE conversation_history 
            SET ai_question = question 
            WHERE ai_question IS NULL AND question IS NOT NULL;
        END IF;
    END IF;
END $$;

-- 添加 user_answer 列（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversation_history' 
        AND column_name = 'user_answer'
    ) THEN
        ALTER TABLE conversation_history 
        ADD COLUMN user_answer TEXT;
        
        -- 将现有的 answer 数据复制到 user_answer（如果 answer 列存在）
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'conversation_history' 
            AND column_name = 'answer'
        ) THEN
            UPDATE conversation_history 
            SET user_answer = answer 
            WHERE user_answer IS NULL AND answer IS NOT NULL;
        END IF;
    END IF;
END $$;

-- 为 session_id 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_conversation_history_session_id 
ON conversation_history(session_id);

-- 注释：保留原有的 question 和 answer 列以保持向后兼容
-- 代码已经支持两种列名格式：question/answer 和 ai_question/user_answer

