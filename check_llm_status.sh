#!/bin/bash

# 检查 LLM 分析状态
SUPABASE_URL="${SUPABASE_URL:-https://lafpbfjtbupootnpornv.supabase.co}"
API_KEY="${SUPABASE_ANON_KEY:-f0792984a8ea66e257abb9db598a4d4432c08db6a5554fe44aeb2c6b2700775f}"
USER_ID="550e8400-e29b-41d4-a716-446655440000"

echo "🔍 检查 LLM 分析状态..."
echo ""

# 调用 API 并查看响应
echo "📤 调用 interview-start API..."
RESPONSE=$(curl -s -X POST "$SUPABASE_URL/functions/v1/interview-start" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $API_KEY" \
    -d "{
        \"userId\": \"$USER_ID\",
        \"chapter\": \"童年故里\"
    }")

echo "📥 响应："
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# 检查覆盖率
COVERAGE=$(echo "$RESPONSE" | jq -r '.data.coverage' 2>/dev/null)
echo "📊 当前覆盖率: ${COVERAGE}%"
echo ""

echo "💡 说明："
echo "1. 如果覆盖率 > 0%，说明主题识别成功"
echo "2. 需要查看 Supabase 日志确认是 LLM 分析还是关键词匹配"
echo ""
echo "📋 查看日志："
echo "https://supabase.com/dashboard/project/lafpbfjtbupootnpornv/logs/edge-functions"
echo ""
echo "🔍 在日志中查找以下关键词："
echo "  - 'LLM API key not configured' - API key 未配置"
echo "  - '✓ LLM主题分析成功' - LLM 分析成功"
echo "  - '使用关键词匹配备用方案' - 使用关键词匹配"
echo "  - 'LLM分析出错' - LLM 调用失败"

