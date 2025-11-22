# 安卓应用API文档 - interviewer_smart

## 重要提示

⚠️ **函数名必须使用下划线 `_`，不是空格或连字符 `-`**

- ✅ 正确：`interviewer_smart`
- ❌ 错误：`interviewer smart`（空格）
- ❌ 错误：`interviewer-smart`（连字符）

## 基础信息

- **Base URL**: `https://lafpbfjtbupootnpornv.supabase.co/functions/v1`
- **函数名**: `interviewer_smart`（注意：使用下划线）
- **完整URL**: `https://lafpbfjtbupootnpornv.supabase.co/functions/v1/interviewer_smart`
- **认证方式**: Bearer Token
- **API Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZnBiZmp0YnVwb290bnBvcm52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MzIxMzgsImV4cCI6MjA3NDAwODEzOH0.NdxDvO17UX2Cya0Uz3ECWkR3g5nEbpIcu5ISXPTvaQ8`

## API端点

### 1. 获取下一个问题 (getNextQuestion)

#### 请求

**URL**: `POST https://lafpbfjtbupootnpornv.supabase.co/functions/v1/interviewer_smart`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer {API_KEY}
```

**请求体**（推荐方式，包含action参数）:
```json
{
  "action": "getNextQuestion",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "chapter": "童年故里",
  "sessionId": "session_1234567890"
}
```

**请求体**（简化方式，不包含action，后端会自动推断）:
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "chapter": "童年故里",
  "sessionId": "session_1234567890"
}
```

**参数说明**:
- `action` (可选): 固定值 `"getNextQuestion"`，如果不传，后端会根据请求内容自动推断
- `userId` (必需): 用户ID，UUID格式
- `chapter` (必需): 章节名称，可选值：
  - `"童年故里"`
  - `"青春之歌"`
  - `"事业征程"`
  - `"家庭港湾"`
  - `"流金岁月"`
- `sessionId` (可选): 会话ID，首次调用可以不传，后续调用使用返回的sessionId

#### 响应

**成功响应** (200):
```json
{
  "question": "您好，我是记者小陈，请问您怎么称呼呀？",
  "roundNumber": 1,
  "usingAI": true,
  "isReturningUser": false
}
```

**字段说明**:
- `question`: AI生成的问题
- `roundNumber`: 当前轮次
- `usingAI`: 是否使用了AI生成
- `isReturningUser`: 是否是返回用户（有历史记录）

### 2. 保存回答并获取下一个问题 (saveAnswer)

#### 请求

**URL**: `POST https://lafpbfjtbupootnpornv.supabase.co/functions/v1/interviewer_smart`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer {API_KEY}
```

**请求体**（推荐方式，包含action参数）:
```json
{
  "action": "saveAnswer",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "chapter": "童年故里",
  "sessionId": "session_1234567890",
  "userAnswer": "我叫张三",
  "roundNumber": 1
}
```

**请求体**（简化方式，不包含action，后端会自动推断）:
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "chapter": "童年故里",
  "sessionId": "session_1234567890",
  "userAnswer": "我叫张三",
  "roundNumber": 1
}
```

**参数说明**:
- `action` (可选): 固定值 `"saveAnswer"`，如果不传，后端会根据请求内容自动推断
- `userId` (必需): 用户ID
- `chapter` (必需): 章节名称
- `sessionId` (必需): 会话ID，从getNextQuestion的响应中获取
- `userAnswer` (必需): 用户的回答
- `roundNumber` (必需): 当前轮次，从getNextQuestion的响应中获取

#### 响应

**成功响应** (200):
```json
{
  "nextQuestion": "张爷爷，很高兴认识您！能告诉我您今年多大年纪吗？",
  "nextRoundNumber": 2,
  "usingAI": true
}
```

**字段说明**:
- `nextQuestion`: 下一个问题
- `nextRoundNumber`: 下一个轮次
- `usingAI`: 是否使用了AI生成

## 错误处理

### 常见错误

#### 1. Missing action parameter

**错误响应** (400):
```json
{
  "error": "Missing action parameter",
  "message": "Please provide an \"action\" parameter. Valid values: \"getNextQuestion\", \"saveAnswer\", \"testGemini\", \"getEnvInfo\", \"classifyContent\"",
  "received": ["userId"],
  "requestData": {
    "userId": "550e8400-e29b-41d4-a716-446655440000"
  },
  "example": {
    "getNextQuestion": {
      "action": "getNextQuestion",
      "userId": "string",
      "chapter": "string",
      "sessionId": "string (optional)"
    },
    "saveAnswer": {
      "action": "saveAnswer",
      "userId": "string",
      "chapter": "string",
      "sessionId": "string",
      "userAnswer": "string",
      "roundNumber": "number"
    }
  }
}
```

**解决方案**:
- 在请求体中添加 `"action"` 参数
- 或者确保请求体包含足够的参数，让后端自动推断（userId + chapter + sessionId 或 userId + chapter + userAnswer）

#### 2. Invalid action

**错误响应** (400):
```json
{
  "error": "Invalid action",
  "received": "wrongAction",
  "available": ["testGemini", "getEnvInfo", "generateUserAnswer", "getNextQuestion", "saveAnswer", "classifyContent"]
}
```

**解决方案**: 使用正确的action值

#### 3. Missing required parameters

**错误响应** (400):
```json
{
  "error": "Missing required parameters"
}
```

**解决方案**: 确保传递所有必需的参数（userId, chapter等）

## 完整对话流程示例

### 第1轮：获取第一个问题

**请求**:
```json
{
  "action": "getNextQuestion",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "chapter": "童年故里"
}
```

**响应**:
```json
{
  "question": "您好，我是记者小陈，请问您怎么称呼呀？",
  "roundNumber": 1,
  "usingAI": true,
  "isReturningUser": false
}
```

### 第2轮：保存回答并获取下一个问题

**请求**:
```json
{
  "action": "saveAnswer",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "chapter": "童年故里",
  "sessionId": "session_1234567890",
  "userAnswer": "我叫张三",
  "roundNumber": 1
}
```

**响应**:
```json
{
  "nextQuestion": "张爷爷，很高兴认识您！能告诉我您今年多大年纪吗？",
  "nextRoundNumber": 2,
  "usingAI": true
}
```

### 第3轮：继续对话

**请求**:
```json
{
  "action": "saveAnswer",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "chapter": "童年故里",
  "sessionId": "session_1234567890",
  "userAnswer": "我今年65岁",
  "roundNumber": 2
}
```

**响应**:
```json
{
  "nextQuestion": "张爷爷，您65年生，那属马，我算得对不对？明年就整60了，这年龄保养得真好。",
  "nextRoundNumber": 3,
  "usingAI": true
}
```

## Android代码示例

### Kotlin示例

```kotlin
// 获取下一个问题
fun getNextQuestion(userId: String, chapter: String, sessionId: String? = null) {
    val url = "https://lafpbfjtbupootnpornv.supabase.co/functions/v1/interviewer_smart"
    
    val requestBody = JSONObject().apply {
        put("action", "getNextQuestion")
        put("userId", userId)
        put("chapter", chapter)
        if (sessionId != null) {
            put("sessionId", sessionId)
        }
    }
    
    // 发送POST请求...
}

// 保存回答
fun saveAnswer(
    userId: String, 
    chapter: String, 
    sessionId: String, 
    userAnswer: String, 
    roundNumber: Int
) {
    val url = "https://lafpbfjtbupootnpornv.supabase.co/functions/v1/interviewer_smart"
    
    val requestBody = JSONObject().apply {
        put("action", "saveAnswer")
        put("userId", userId)
        put("chapter", chapter)
        put("sessionId", sessionId)
        put("userAnswer", userAnswer)
        put("roundNumber", roundNumber)
    }
    
    // 发送POST请求...
}
```

### Java示例

```java
// 获取下一个问题
public void getNextQuestion(String userId, String chapter, String sessionId) {
    String url = "https://lafpbfjtbupootnpornv.supabase.co/functions/v1/interviewer_smart";
    
    JSONObject requestBody = new JSONObject();
    try {
        requestBody.put("action", "getNextQuestion");
        requestBody.put("userId", userId);
        requestBody.put("chapter", chapter);
        if (sessionId != null) {
            requestBody.put("sessionId", sessionId);
        }
    } catch (JSONException e) {
        e.printStackTrace();
    }
    
    // 发送POST请求...
}

// 保存回答
public void saveAnswer(
    String userId, 
    String chapter, 
    String sessionId, 
    String userAnswer, 
    int roundNumber
) {
    String url = "https://lafpbfjtbupootnpornv.supabase.co/functions/v1/interviewer_smart";
    
    JSONObject requestBody = new JSONObject();
    try {
        requestBody.put("action", "saveAnswer");
        requestBody.put("userId", userId);
        requestBody.put("chapter", chapter);
        requestBody.put("sessionId", sessionId);
        requestBody.put("userAnswer", userAnswer);
        requestBody.put("roundNumber", roundNumber);
    } catch (JSONException e) {
        e.printStackTrace();
    }
    
    // 发送POST请求...
}
```

## 重要注意事项

1. **函数名必须使用下划线**: `interviewer_smart`，不是 `interviewer smart` 或 `interviewer-smart`
2. **URL编码**: 确保URL中的函数名正确编码，下划线 `_` 不需要编码
3. **action参数**: 虽然现在可以不传（后端会自动推断），但建议传递，更明确
4. **sessionId**: 首次调用可以不传，后续调用必须使用返回的sessionId
5. **roundNumber**: 保存回答时必须传递正确的roundNumber

## 测试

可以使用curl测试：

```bash
# 获取第一个问题
curl -X POST "https://lafpbfjtbupootnpornv.supabase.co/functions/v1/interviewer_smart" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZnBiZmp0YnVwb290bnBvcm52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MzIxMzgsImV4cCI6MjA3NDAwODEzOH0.NdxDvO17UX2Cya0Uz3ECWkR3g5nEbpIcu5ISXPTvaQ8" \
  -d '{
    "action": "getNextQuestion",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "chapter": "童年故里"
  }'
```

