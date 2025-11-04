#!/bin/bash
# 复制这些命令到终端执行

echo "🚀 开始部署 Gemini API 更新"
echo ""

# 进入项目目录
cd /Users/chonghaoju/memoir-package

# 步骤1：登录（会打开浏览器）
echo "步骤 1/4: 登录 Supabase（将打开浏览器）"
supabase login

# 步骤2：链接项目
echo ""
echo "步骤 2/4: 链接到项目"
supabase link --project-ref lafpbfjtbupootnpornv

# 步骤3：部署第一个函数
echo ""
echo "步骤 3/4: 部署 ai-interviewer-smart"
supabase functions deploy ai-interviewer-smart

# 步骤4：部署第二个函数
echo ""
echo "步骤 4/4: 部署 generate-biography"
supabase functions deploy generate-biography

# 测试
echo ""
echo "🧪 测试部署..."
curl -X POST https://lafpbfjtbupootnpornv.supabase.co/functions/v1/ai-interviewer-smart \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZnBiZmp0YnVwb290bnBvcm52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MzIxMzgsImV4cCI6MjA3NDAwODEzOH0.NdxDvO17UX2Cya0Uz3ECWkR3g5nEbpIcu5ISXPTvaQ8" \
  -d '{"action":"testGemini"}'

echo ""
echo ""
echo "✅ 部署完成！"
echo "现在访问网站测试功能：https://5von3ham77js.space.minimaxi.com"
