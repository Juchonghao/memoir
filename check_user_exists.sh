#!/bin/bash

# 检查用户是否存在
SUPABASE_URL="${SUPABASE_URL:-https://lafpbfjtbupootnpornv.supabase.co}"
API_KEY="${SUPABASE_ANON_KEY:-f0792984a8ea66e257abb9db598a4d4432c08db6a5554fe44aeb2c6b2700775f}"
USER_ID="550e8400-e29b-41d4-a716-446655440000"

echo "检查用户是否存在..."
echo "User ID: $USER_ID"
echo ""

# 尝试查询用户
RESPONSE=$(curl -s -X GET "$SUPABASE_URL/rest/v1/users?id=eq.$USER_ID&select=id,email,full_name" \
    -H "Authorization: Bearer $API_KEY" \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json")

echo "查询结果："
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# 检查是否找到用户
USER_COUNT=$(echo "$RESPONSE" | jq 'length' 2>/dev/null || echo "0")

if [ "$USER_COUNT" = "0" ] || [ -z "$USER_COUNT" ]; then
    echo "❌ 用户不存在！"
    echo ""
    echo "尝试创建用户..."
    
    CREATE_RESPONSE=$(curl -s -X POST "$SUPABASE_URL/rest/v1/users" \
        -H "Authorization: Bearer $API_KEY" \
        -H "apikey: $API_KEY" \
        -H "Content-Type: application/json" \
        -H "Prefer: return=representation" \
        -d "{
            \"id\": \"$USER_ID\",
            \"email\": \"test-user@example.com\",
            \"full_name\": \"Test User\"
        }")
    
    echo "创建结果："
    echo "$CREATE_RESPONSE" | jq '.' 2>/dev/null || echo "$CREATE_RESPONSE"
else
    echo "✅ 用户存在"
    echo "$RESPONSE" | jq '.[0]' 2>/dev/null
fi

