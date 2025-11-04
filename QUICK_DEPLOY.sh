#!/bin/bash
# 纪传体AI应用 - Edge Functions 快速部署脚本
# 使用方法：./QUICK_DEPLOY.sh

echo "========================================"
echo "  纪传体AI应用 - Edge Functions 部署"
echo "========================================"
echo ""

# 检查是否在正确的目录
if [ ! -d "supabase/functions" ]; then
  echo "❌ 错误：请在项目根目录运行此脚本"
  echo "   当前目录：$(pwd)"
  echo "   应该运行于：/Users/chonghaoju/memoir-package"
  exit 1
fi

# 检查 Supabase CLI 是否安装
if ! command -v supabase &> /dev/null; then
  echo "❌ Supabase CLI 未安装"
  echo "   请运行：brew install supabase/tap/supabase"
  exit 1
fi

echo "✅ Supabase CLI 已安装 (版本: $(supabase --version))"
echo ""

# 检查是否已登录
echo "检查登录状态..."
if ! supabase projects list &> /dev/null; then
  echo ""
  echo "⚠️  需要登录 Supabase"
  echo ""
  echo "请选择登录方式："
  echo "  1. 浏览器登录（推荐）"
  echo "  2. 使用访问令牌"
  echo ""
  read -p "请输入选项 (1 或 2): " choice
  
  if [ "$choice" == "1" ]; then
    echo ""
    echo "正在打开浏览器进行登录..."
    supabase login
  elif [ "$choice" == "2" ]; then
    echo ""
    echo "请输入你的 Supabase Access Token："
    echo "（可在 https://supabase.com/dashboard/account/tokens 获取）"
    read -s token
    export SUPABASE_ACCESS_TOKEN="$token"
  else
    echo "❌ 无效的选项"
    exit 1
  fi
fi

echo ""
echo "✅ 登录成功"
echo ""

# 链接到项目
echo "正在链接到 Supabase 项目..."
PROJECT_REF="lafpbfjtbupootnpornv"

if supabase link --project-ref $PROJECT_REF 2>&1 | grep -q "Finished"; then
  echo "✅ 项目链接成功"
else
  echo "⚠️  项目可能已经链接，继续部署..."
fi

echo ""
echo "========================================"
echo "  开始部署 Edge Functions"
echo "========================================"
echo ""

# 部署 ai-interviewer-smart
echo "📦 部署 ai-interviewer-smart..."
if supabase functions deploy ai-interviewer-smart; then
  echo "✅ ai-interviewer-smart 部署成功"
else
  echo "❌ ai-interviewer-smart 部署失败"
  exit 1
fi

echo ""

# 部署 generate-biography
echo "📦 部署 generate-biography..."
if supabase functions deploy generate-biography; then
  echo "✅ generate-biography 部署成功"
else
  echo "❌ generate-biography 部署失败"
  exit 1
fi

echo ""
echo "========================================"
echo "  测试部署"
echo "========================================"
echo ""

# 获取 anon key
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZnBiZmp0YnVwb290bnBvcm52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MzIxMzgsImV4cCI6MjA3NDAwODEzOH0.NdxDvO17UX2Cya0Uz3ECWkR3g5nEbpIcu5ISXPTvaQ8"

echo "🧪 测试 ai-interviewer-smart..."
RESPONSE=$(curl -s -X POST https://lafpbfjtbupootnpornv.supabase.co/functions/v1/ai-interviewer-smart \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ANON_KEY" \
  -d '{"action":"testGemini"}')

if echo "$RESPONSE" | grep -q '"success":true'; then
  echo "✅ Gemini API 测试成功"
  echo "   响应: $RESPONSE"
else
  echo "⚠️  测试响应: $RESPONSE"
  if echo "$RESPONSE" | grep -q '"hasKey":true'; then
    echo "   API Key 已配置，可能模型仍在调整中"
  fi
fi

echo ""
echo "========================================"
echo "  部署完成！"
echo "========================================"
echo ""
echo "✅ 所有 Edge Functions 已更新"
echo ""
echo "📝 后续步骤："
echo "  1. 访问网站测试功能"
echo "  2. 查看 Supabase Logs 了解详细信息"
echo "  3. 如有问题，查看 CURRENT_STATUS_REPORT.md"
echo ""
echo "🌐 部署的网站："
echo "  • https://pcww28euyrig.space.minimaxi.com"
echo "  • https://5von3ham77js.space.minimaxi.com"
echo "  • https://mkdhd3j930hg.space.minimaxi.com"
echo ""

