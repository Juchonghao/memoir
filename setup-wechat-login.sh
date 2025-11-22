#!/bin/bash

# 微信小程序登录环境变量设置脚本

echo "🔧 设置微信小程序登录环境变量..."

# 检查是否已登录Supabase
if ! supabase projects list &>/dev/null; then
    echo "❌ 请先登录Supabase: supabase login"
    exit 1
fi

# 设置环境变量
echo "📝 设置 WECHAT_APP_ID..."
supabase secrets set WECHAT_APP_ID=wxec9a529ef50c42a1

echo "📝 设置 WECHAT_APP_SECRET..."
supabase secrets set WECHAT_APP_SECRET=afb5c469d258c06cacdb67d711988f8d

echo "✅ 环境变量设置完成！"
echo ""
echo "📋 下一步："
echo "1. 部署Edge Function: supabase functions deploy wechat-login --no-verify-jwt"
echo "2. 查看配置文档: cat WECHAT_LOGIN_SETUP.md"

