-- 完整修复脚本 - 一次性解决所有问题
-- 在 Supabase Dashboard 的 SQL Editor 中执行

-- ============================================
-- 步骤1：修复 users 表的 RLS 策略
-- ============================================
-- 为 Service Role 添加 RLS 策略（允许插入、查询、更新）
DROP POLICY IF EXISTS "Service role can insert users" ON users;
DROP POLICY IF EXISTS "Service role can select users" ON users;
DROP POLICY IF EXISTS "Service role can update users" ON users;

CREATE POLICY "Service role can insert users"
ON users
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can select users"
ON users
FOR SELECT
TO service_role
USING (true);

CREATE POLICY "Service role can update users"
ON users
FOR UPDATE
TO service_role
USING (true);

-- ============================================
-- 步骤2：修复 conversation_history 表的 RLS 策略
-- ============================================
DROP POLICY IF EXISTS "Service role can insert conversation history" ON conversation_history;
DROP POLICY IF EXISTS "Service role can select conversation history" ON conversation_history;
DROP POLICY IF EXISTS "Service role can update conversation history" ON conversation_history;

CREATE POLICY "Service role can insert conversation history"
ON conversation_history
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can select conversation history"
ON conversation_history
FOR SELECT
TO service_role
USING (true);

CREATE POLICY "Service role can update conversation history"
ON conversation_history
FOR UPDATE
TO service_role
USING (true);

-- ============================================
-- 步骤3：创建外键约束（如果不存在）
-- ============================================
-- 先删除可能存在的旧约束
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid::regclass::text = 'conversation_history'
          AND contype = 'f'
          AND confrelid::regclass::text = 'users'
    LOOP
        EXECUTE format('ALTER TABLE conversation_history DROP CONSTRAINT IF EXISTS %I', r.conname);
        RAISE NOTICE 'Dropped constraint: %', r.conname;
    END LOOP;
END $$;

-- 创建外键约束
ALTER TABLE conversation_history 
DROP CONSTRAINT IF EXISTS fk_user;

ALTER TABLE conversation_history 
ADD CONSTRAINT fk_user 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE CASCADE;

-- ============================================
-- 步骤4：确保测试用户存在
-- ============================================
INSERT INTO users (id, email, full_name, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'test-user@example.com',
  'Test User',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET updated_at = NOW()
RETURNING id, email, full_name;

-- ============================================
-- 步骤5：验证所有配置
-- ============================================
-- 验证用户存在
SELECT 
    'User exists' AS check_item,
    CASE 
        WHEN EXISTS (SELECT 1 FROM users WHERE id = '550e8400-e29b-41d4-a716-446655440000')
        THEN '✓'
        ELSE '✗'
    END AS status;

-- 验证 users 表的 RLS 策略
SELECT 
    'Users table RLS for service_role' AS check_item,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'users' 
            AND 'service_role' = ANY(roles)
            AND cmd = 'INSERT'
        )
        THEN '✓'
        ELSE '✗'
    END AS status;

-- 验证 conversation_history 表的 RLS 策略
SELECT 
    'Conversation_history RLS for service_role' AS check_item,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'conversation_history' 
            AND 'service_role' = ANY(roles)
            AND cmd = 'INSERT'
        )
        THEN '✓'
        ELSE '✗'
    END AS status;

-- 验证外键约束
SELECT 
    'Foreign key constraint exists' AS check_item,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'fk_user' 
            AND conrelid::regclass::text = 'conversation_history'
            AND confrelid::regclass::text = 'users'
        )
        THEN '✓'
        ELSE '✗'
    END AS status;

