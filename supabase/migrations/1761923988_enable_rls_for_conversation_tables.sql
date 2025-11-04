-- Migration: enable_rls_for_conversation_tables
-- Created at: 1761923988

-- 启用 conversation_history 表的 RLS
ALTER TABLE conversation_history ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户只能查看自己的对话历史
CREATE POLICY "Users can view their own conversation history"
ON conversation_history
FOR SELECT
USING (auth.uid() = user_id);

-- 创建策略：用户可以插入自己的对话记录
CREATE POLICY "Users can insert their own conversation records"
ON conversation_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 启用 conversation_summary 表的 RLS
ALTER TABLE conversation_summary ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户只能查看自己的对话摘要
CREATE POLICY "Users can view their own conversation summary"
ON conversation_summary
FOR SELECT
USING (auth.uid() = user_id);

-- 创建策略：用户可以插入自己的对话摘要
CREATE POLICY "Users can insert their own conversation summary"
ON conversation_summary
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 创建策略：用户可以更新自己的对话摘要
CREATE POLICY "Users can update their own conversation summary"
ON conversation_summary
FOR UPDATE
USING (auth.uid() = user_id);;