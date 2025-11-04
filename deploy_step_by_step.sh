#!/bin/bash
# 逐步部署脚本 - 请在终端交互式运行

set -e  # 遇到错误就停止

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║      🚀 部署 Gemini API 模型更新                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

cd /Users/chonghaoju/memoir-package

# 步骤1：登录
echo "📝 步骤 1/4: 登录 Supabase"
echo "   这将打开浏览器，请点击 'Authorize' 按钮"
echo ""
read -p "按回车继续，或按 Ctrl+C 取消..."
supabase login

echo ""
echo "✅ 登录成功！"
echo ""

# 步骤2：链接项目
echo "📝 步骤 2/4: 链接到 Supabase 项目"
echo "   项目 ID: lafpbfjtbupootnpornv"
echo ""
read -p "按回车继续..."
supabase link --project-ref lafpbfjtbupootnpornv

echo ""
echo "✅ 项目链接成功！"
echo ""

# 步骤3：部署第一个函数
echo "📝 步骤 3/5: 部署 ai-interviewer-smart"
echo "   更新 Gemini 模型为: gemini-2.0-flash-exp"
echo ""
read -p "按回车开始部署..."
supabase functions deploy ai-interviewer-smart

echo ""
echo "✅ ai-interviewer-smart 部署成功！"
echo ""

# 步骤4：部署第二个函数
echo "📝 步骤 4/5: 部署 generate-biography"
echo "   更新 Gemini 模型为: gemini-2.0-flash-exp"
echo ""
read -p "按回车开始部署..."
supabase functions deploy generate-biography

echo ""
echo "✅ generate-biography 部署成功！"
echo ""

# 步骤5：测试
echo "📝 步骤 5/5: 测试 Gemini API"
echo ""
read -p "按回车开始测试..."
echo ""

RESPONSE=$(curl -s -X POST https://lafpbfjtbupootnpornv.supabase.co/functions/v1/ai-interviewer-smart \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZnBiZmp0YnVwb290bnBvcm52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MzIxMzgsImV4cCI6MjA3NDAwODEzOH0.NdxDvO17UX2Cya0Uz3ECWkR3g5nEbpIcu5ISXPTvaQ8" \
  -d '{"action":"testGemini"}')

echo "测试响应："
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

if echo "$RESPONSE" | grep -q '"success":true'; then
  echo "╔══════════════════════════════════════════════════════════════╗"
  echo "║           ✅ 部署成功！Gemini API 已更新                        ║"
  echo "╚══════════════════════════════════════════════════════════════╝"
  echo ""
  echo "🎉 现在可以访问网站测试新功能："
  echo "   https://5von3ham77js.space.minimaxi.com"
  echo "   https://pcww28euyrig.space.minimaxi.com"
  echo ""
else
  echo "⚠️  测试响应不包含 success:true"
  echo "   可能 Gemini API 仍在调整中，或者需要检查配置"
  echo "   但部署已完成，可以访问网站测试实际功能"
  echo ""
fi



