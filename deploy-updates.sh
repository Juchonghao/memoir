#!/bin/bash

echo "🚀 部署回忆录系统优化更新"
echo "================================"
echo ""

# 检查是否登录
echo "1️⃣ 检查Supabase登录状态..."
if ! supabase projects list &> /dev/null; then
    echo "❌ 未登录Supabase，正在启动登录流程..."
    supabase login
else
    echo "✅ 已登录Supabase"
fi

echo ""
echo "2️⃣ 部署Edge Functions..."

# 部署ai-interviewer-smart
echo "   📦 部署 ai-interviewer-smart..."
supabase functions deploy ai-interviewer-smart

if [ $? -eq 0 ]; then
    echo "   ✅ ai-interviewer-smart 部署成功"
else
    echo "   ❌ ai-interviewer-smart 部署失败"
    exit 1
fi

# 部署memoir-generate
echo "   📦 部署 memoir-generate..."
supabase functions deploy memoir-generate

if [ $? -eq 0 ]; then
    echo "   ✅ memoir-generate 部署成功"
else
    echo "   ❌ memoir-generate 部署失败"
    exit 1
fi

echo ""
echo "3️⃣ 测试部署..."
echo "   发送测试请求..."

# 测试请求
response=$(curl -s -X POST https://lafpbfjtbupootnpornv.supabase.co/functions/v1/ai-interviewer-smart \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZnBiZmp0YnVwb290bnBvcm52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MzIxMzgsImV4cCI6MjA3NDAwODEzOH0.NdxDvO17UX2Cya0Uz3ECWkR3g5nEbpIcu5ISXPTvaQ8" \
  -d '{"action":"getEnvInfo"}')

echo "   响应: $response"

if echo "$response" | grep -q "usingDeepSeek"; then
    echo "   ✅ API响应正常"
else
    echo "   ⚠️  API响应异常，请检查"
fi

echo ""
echo "================================"
echo "✨ 部署完成！"
echo ""
echo "📋 已完成的优化:"
echo "  ✅ 模型升级到 gemini-2.5-pro"
echo "  ✅ 回忆录流式生成（支持进度显示）"
echo "  ✅ 防止AI幻觉机制"
echo "  ✅ Session连续性（自动总结上次对话）"
echo "  ✅ 智能追问（白岩松式采访风格）"
echo "  ✅ 问题去重机制"
echo "  ✅ 内容完整性判断"
echo ""
echo "📚 查看详细说明: cat IMPLEMENTATION_SUMMARY.md"
echo ""
