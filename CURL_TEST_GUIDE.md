# 🧪 CURL 测试指南

## 📋 基础信息

- **API地址**: `https://lafpbfjtbupootnpornv.supabase.co/functions/v1/interview-start`
- **API Key**: `f0792984a8ea66e257abb9db598a4d4432c08db6a5554fe44aeb2c6b2700775f`
- **测试用户ID**: `550e8400-e29b-41d4-a716-446655440000`

## ⚠️ 重要更新：chapter 现在是可选的！

**从最新版本开始，`chapter` 参数变为可选**：
- ✅ **不提供 chapter**：进行连续对话，跨章节，对话会一直连下去
- ✅ **提供 chapter**：按章节过滤对话（保持原有行为）

这样前端可以更灵活地控制对话流程！

## 🚀 快速开始

### 第一步：设置环境变量（可选，方便使用）

```bash
export SUPABASE_URL="https://lafpbfjtbupootnpornv.supabase.co"
export API_KEY="f0792984a8ea66e257abb9db598a4d4432c08db6a5554fe44aeb2c6b2700775f"
export USER_ID="550e8400-e29b-41d4-a716-446655440000"
```

### 第二步：第一轮对话（开始对话）

**方式1：不提供 chapter（连续对话，推荐）**
```bash
curl -X POST "https://lafpbfjtbupootnpornv.supabase.co/functions/v1/interview-start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer f0792984a8ea66e257abb9db598a4d4432c08db6a5554fe44aeb2c6b2700775f" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000"
  }' | jq '.'
```

**方式2：提供 chapter（按章节对话）**
```bash
curl -X POST "https://lafpbfjtbupootnpornv.supabase.co/functions/v1/interview-start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer f0792984a8ea66e257abb9db598a4d4432c08db6a5554fe44aeb2c6b2700775f" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "chapter": "童年故里"
  }' | jq '.'
```

**或者使用环境变量（不提供chapter，连续对话）**：
```bash
curl -X POST "$SUPABASE_URL/functions/v1/interview-start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "{
    \"userId\": \"$USER_ID\"
  }" | jq '.'
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "question": "请描述一下您的童年生活环境，比如住在哪里？家里有哪些人？",
    "sessionId": "session_1763476337579_4w2fssp20",
    "roundNumber": 1,
    "totalRounds": 1,
    "missingThemes": ["家庭背景", "童年趣事", "成长环境", "早期教育", "故乡印象"],
    "coverage": 0,
    "suggestions": "建议补充以下内容：家庭背景、童年趣事、成长环境"
  }
}
```

**重要**：保存返回的 `sessionId`，后续对话需要使用！

---

### 第三步：第二轮对话（回答第一个问题）

```bash
# 替换 SESSION_ID 为第一步返回的 sessionId
curl -X POST "https://lafpbfjtbupootnpornv.supabase.co/functions/v1/interview-start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer f0792984a8ea66e257abb9db598a4d4432c08db6a5554fe44aeb2c6b2700775f" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "sessionId": "session_1763517417235_diswv6150",
    "userAnswer": "我爱吃鱼香肉丝",
    "roundNumber": 1
  }' | jq '.'
```

**或者使用环境变量（不提供chapter，连续对话）**：
```bash
# 先设置sessionId
export SESSION_ID="session_1763476337579_4w2fssp20"

curl -X POST "$SUPABASE_URL/functions/v1/interview-start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"sessionId\": \"$SESSION_ID\",
    \"userAnswer\": \"我小时候住在农村，家里有父母和两个兄弟姐妹\",
    \"roundNumber\": 1
  }" | jq '.'
```

---

### 第四步：第三轮及后续对话

每次调用都使用：
- 上次返回的 `sessionId`
- 上次返回的 `roundNumber` 作为本次的 `roundNumber`
- 新的 `userAnswer`
- **不需要提供 `chapter`**（连续对话会自动跨章节）

```bash
curl -X POST "$SUPABASE_URL/functions/v1/interview-start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"sessionId\": \"$SESSION_ID\",
    \"userAnswer\": \"我爸妈都是工程师\",
    \"roundNumber\": 2
  }" | jq '.'
```

---

## 📝 完整测试脚本

创建一个测试脚本 `test-curl.sh`：

```bash
#!/bin/bash

# 设置环境变量
SUPABASE_URL="https://lafpbfjtbupootnpornv.supabase.co"
API_KEY="f0792984a8ea66e257abb9db598a4d4432c08db6a5554fe44aeb2c6b2700775f"
USER_ID="550e8400-e29b-41d4-a716-446655440000"
CHAPTER="童年故里"

echo "=========================================="
echo "第 1 轮：开始对话"
echo "=========================================="

# 第一轮
RESPONSE=$(curl -s -X POST "$SUPABASE_URL/functions/v1/interview-start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"chapter\": \"$CHAPTER\"
  }")

echo "$RESPONSE" | jq '.'
SESSION_ID=$(echo "$RESPONSE" | jq -r '.data.sessionId')
ROUND_NUMBER=$(echo "$RESPONSE" | jq -r '.data.roundNumber')
QUESTION=$(echo "$RESPONSE" | jq -r '.data.question')

echo ""
echo "🤖 AI问题: $QUESTION"
echo "📝 Session ID: $SESSION_ID"
echo ""

# 第二轮
echo "=========================================="
echo "第 2 轮：继续对话"
echo "=========================================="
echo "👤 用户回答: 我小时候住在农村"

RESPONSE=$(curl -s -X POST "$SUPABASE_URL/functions/v1/interview-start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"chapter\": \"$CHAPTER\",
    \"sessionId\": \"$SESSION_ID\",
    \"userAnswer\": \"我小时候住在农村\",
    \"roundNumber\": $ROUND_NUMBER
  }")

echo "$RESPONSE" | jq '.'
ROUND_NUMBER=$(echo "$RESPONSE" | jq -r '.data.roundNumber')
QUESTION=$(echo "$RESPONSE" | jq -r '.data.question')

echo ""
echo "🤖 AI问题: $QUESTION"
echo ""

# 第三轮
echo "=========================================="
echo "第 3 轮：继续对话"
echo "=========================================="
echo "👤 用户回答: 我爸妈都是工程师"

RESPONSE=$(curl -s -X POST "$SUPABASE_URL/functions/v1/interview-start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"chapter\": \"$CHAPTER\",
    \"sessionId\": \"$SESSION_ID\",
    \"userAnswer\": \"我爸妈都是工程师\",
    \"roundNumber\": $ROUND_NUMBER
  }")

echo "$RESPONSE" | jq '.'
QUESTION=$(echo "$RESPONSE" | jq -r '.data.question')

echo ""
echo "🤖 AI问题: $QUESTION"
echo ""
```

**运行脚本**：
```bash
chmod +x test-curl.sh
./test-curl.sh
```

---

## 🔍 查看响应详情

### 只看问题
```bash
curl ... | jq '.data.question'
```

### 只看问题长度
```bash
curl ... | jq -r '.data.question' | wc -c
```

### 查看完整响应
```bash
curl ... | jq '.'
```

### 查看响应时间
```bash
curl -w "\n响应时间: %{time_total}秒\n" ... | jq '.'
```

---

## 📊 测试不同场景

### 测试1: 正常回答
```bash
curl -X POST "$SUPABASE_URL/functions/v1/interview-start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"chapter\": \"童年故里\",
    \"sessionId\": \"$SESSION_ID\",
    \"userAnswer\": \"我小时候住在农村，家里有父母和两个兄弟姐妹\",
    \"roundNumber\": 1
  }" | jq '.data.question'
```

### 测试2: 简短回答（测试AI如何处理）
```bash
curl -X POST "$SUPABASE_URL/functions/v1/interview-start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"chapter\": \"童年故里\",
    \"sessionId\": \"$SESSION_ID\",
    \"userAnswer\": \"是的\",
    \"roundNumber\": 2
  }" | jq '.data.question'
```

### 测试3: 不匹配的回答（测试上下文理解）
```bash
curl -X POST "$SUPABASE_URL/functions/v1/interview-start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"chapter\": \"童年故里\",
    \"sessionId\": \"$SESSION_ID\",
    \"userAnswer\": \"我爱吃鱼香肉丝\",
    \"roundNumber\": 3
  }" | jq '.data.question'
```

### 测试4: 新信息（测试深入追问）
```bash
curl -X POST "$SUPABASE_URL/functions/v1/interview-start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"chapter\": \"童年故里\",
    \"sessionId\": \"$SESSION_ID\",
    \"userAnswer\": \"我爸妈都是工程师\",
    \"roundNumber\": 4
  }" | jq '.data.question'
```

---

## 🎯 测试不同章节

### 童年故里
```bash
curl ... -d '{"userId": "...", "chapter": "童年故里"}' | jq '.'
```

### 青春之歌
```bash
curl ... -d '{"userId": "...", "chapter": "青春之歌"}' | jq '.'
```

### 事业征程
```bash
curl ... -d '{"userId": "...", "chapter": "事业征程"}' | jq '.'
```

### 家庭港湾
```bash
curl ... -d '{"userId": "...", "chapter": "家庭港湾"}' | jq '.'
```

### 流金岁月
```bash
curl ... -d '{"userId": "...", "chapter": "流金岁月"}' | jq '.'
```

---

## 💡 实用技巧

### 1. 保存响应到文件
```bash
curl ... | jq '.' > response.json
```

### 2. 只查看问题
```bash
curl ... | jq -r '.data.question'
```

### 3. 查看问题长度
```bash
curl ... | jq -r '.data.question' | wc -c
```

### 4. 查看响应时间
```bash
time curl ... | jq '.'
```

### 5. 格式化输出（如果jq不可用）
```bash
curl ... | python3 -m json.tool
```

---

## ⚠️ 常见问题

### 问题1: jq命令不存在
**解决**：
```bash
# macOS
brew install jq

# 或使用python格式化
curl ... | python3 -m json.tool
```

### 问题2: 返回错误 "userId and chapter are required"
**解决**：检查JSON格式是否正确，确保引号转义

### 问题3: 返回错误 "invalid input syntax for type uuid"
**解决**：确保userId是有效的UUID格式

### 问题4: sessionId丢失
**解决**：每次调用后保存sessionId，下次调用时使用

---

## 📋 快速测试命令模板

```bash
# 设置变量
SUPABASE_URL="https://lafpbfjtbupootnpornv.supabase.co"
API_KEY="f0792984a8ea66e257abb9db598a4d4432c08db6a5554fe44aeb2c6b2700775f"
USER_ID="550e8400-e29b-41d4-a716-446655440000"

# 第一轮
curl -X POST "$SUPABASE_URL/functions/v1/interview-start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "{\"userId\":\"$USER_ID\",\"chapter\":\"童年故里\"}" | jq '.data.question'

# 第二轮（替换SESSION_ID和ROUND_NUMBER）
curl -X POST "$SUPABASE_URL/functions/v1/interview-start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "{\"userId\":\"$USER_ID\",\"chapter\":\"童年故里\",\"sessionId\":\"SESSION_ID\",\"userAnswer\":\"你的回答\",\"roundNumber\":1}" | jq '.data.question'
```

---

## 🔗 查看日志

测试后，可以在Supabase Dashboard查看详细日志：
https://supabase.com/dashboard/project/lafpbfjtbupootnpornv/logs/edge-functions

搜索关键词：
- `[QUESTION]` - 查看问题生成日志
- `[PERFORMANCE]` - 查看性能统计
- `模板检测` - 查看模板检测日志

