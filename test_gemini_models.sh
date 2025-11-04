#!/bin/bash
# ⚠️ 安全警告：此脚本不再包含硬编码的 API 密钥
# 请使用环境变量或从 Supabase Secrets 获取密钥

# 从环境变量获取 API 密钥
GEMINI_API_KEY="${GEMINI_API_KEY:-}"

if [ -z "$GEMINI_API_KEY" ]; then
  echo "⚠️  错误: GEMINI_API_KEY 环境变量未设置"
  echo "请设置环境变量: export GEMINI_API_KEY=your_api_key"
  echo "或从 Supabase Secrets 获取密钥"
  exit 1
fi

echo "API Key length: ${#GEMINI_API_KEY}"

# 尝试列出v1版本的模型
echo "=== Testing v1 API ==="
curl -s "https://generativelanguage.googleapis.com/v1/models?key=${GEMINI_API_KEY}" | head -100

# 尝试列出v1beta版本的模型
echo -e "\n=== Testing v1beta API ==="
curl -s "https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}" | head -100
