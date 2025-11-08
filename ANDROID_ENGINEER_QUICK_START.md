# 安卓工程师快速开始指南

## 🎯 5分钟快速测试

### 第一步：获取API信息

从后端工程师获取以下信息：

```json
{
  "baseUrl": "https://your-project.supabase.co/functions/v1",
  "apiKey": "your-anon-key-here"
}
```

### 第二步：测试API连接

使用Postman或curl测试：

```bash
curl -X POST "https://your-project.supabase.co/functions/v1/interview-start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-anon-key" \
  -d '{
    "userId": "test-user-123",
    "chapter": "童年故里"
  }'
```

### 第三步：集成到安卓应用

#### Kotlin示例

```kotlin
// 1. 添加依赖 (build.gradle.kts)
dependencies {
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    implementation("com.squareup.okhttp3:okhttp:4.11.0")
}

// 2. 定义API接口
interface MemoirApiService {
    @POST("interview-start")
    suspend fun startInterview(
        @Header("Authorization") token: String,
        @Body request: InterviewRequest
    ): Response<InterviewResponse>
}

// 3. 数据模型
data class InterviewRequest(
    val userId: String,
    val chapter: String,
    val sessionId: String? = null,
    val userAnswer: String? = null,
    val roundNumber: Int? = null
)

data class InterviewResponse(
    val success: Boolean,
    val data: InterviewData
)

data class InterviewData(
    val question: String,
    val sessionId: String,
    val roundNumber: Int,
    val totalRounds: Int,
    val missingThemes: List<String>,
    val coverage: Int,
    val suggestions: String?
)

// 4. 创建Retrofit实例
val apiService = Retrofit.Builder()
    .baseUrl("https://your-project.supabase.co/functions/v1/")
    .addConverterFactory(GsonConverterFactory.create())
    .build()
    .create(MemoirApiService::class.java)

// 5. 使用示例
class InterviewViewModel : ViewModel() {
    private var currentSessionId: String? = null
    private var currentRoundNumber: Int = 0
    
    suspend fun startInterview(userId: String, chapter: String) {
        val request = InterviewRequest(userId = userId, chapter = chapter)
        val response = apiService.startInterview(
            "Bearer your-anon-key",
            request
        )
        
        if (response.isSuccessful) {
            val data = response.body()?.data
            currentSessionId = data?.sessionId
            currentRoundNumber = data?.roundNumber ?: 0
            // 更新UI显示问题
            _question.value = data?.question
        }
    }
    
    suspend fun continueInterview(
        userId: String,
        chapter: String,
        userAnswer: String
    ) {
        val request = InterviewRequest(
            userId = userId,
            chapter = chapter,
            sessionId = currentSessionId,
            userAnswer = userAnswer,
            roundNumber = currentRoundNumber
        )
        
        val response = apiService.startInterview(
            "Bearer your-anon-key",
            request
        )
        
        if (response.isSuccessful) {
            val data = response.body()?.data
            currentRoundNumber = data?.roundNumber ?: 0
            // 更新UI显示新问题
            _question.value = data?.question
        }
    }
}
```

## 📡 API端点

### 1. AI起始对话API

**端点**: `POST /interview-start`

**第一次调用**（开启对话）:
```json
{
  "userId": "user-id",
  "chapter": "童年故里"
}
```

**后续调用**（继续对话）:
```json
{
  "userId": "user-id",
  "chapter": "童年故里",
  "sessionId": "session-id-from-previous-response",
  "userAnswer": "用户的回答",
  "roundNumber": 1
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "question": "AI生成的问题",
    "sessionId": "session-id",
    "roundNumber": 1,
    "totalRounds": 1,
    "missingThemes": ["主题1", "主题2"],
    "coverage": 20,
    "suggestions": "建议补充以下内容：主题1、主题2"
  }
}
```

### 2. 生成回忆录API

**端点**: `POST /memoir-generate`

**请求**:
```json
{
  "userId": "user-id",
  "chapter": "童年故里",
  "writingStyle": "moyan",
  "title": "我的童年回忆",
  "saveToDatabase": true
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "title": "我的童年回忆",
    "content": "回忆录纯文本内容...",
    "html": "<!DOCTYPE html>...完整的HTML",
    "wordCount": 2500,
    "writingStyle": "moyan",
    "chapter": "童年故里",
    "generatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

## 🔑 认证

所有API请求都需要在Header中添加：

```
Authorization: Bearer your-anon-key
```

## 📝 章节列表

- `童年故里` - 童年时期的成长经历
- `青春之歌` - 青少年时期的学习、成长
- `事业征程` - 工作生涯、职业发展
- `家庭港湾` - 家庭生活、婚姻家庭
- `流金岁月` - 退休生活、人生感悟

## 🎨 文风选项

- `moyan` - 莫言风格
- `liucixin` - 刘慈欣风格
- `yiqiuyu` - 余秋雨风格
- `default` - 默认风格

## ⚠️ 注意事项

1. **Session管理**: 每次对话都需要保存`sessionId`，用于后续调用
2. **RoundNumber**: 每次调用后更新`roundNumber`
3. **错误处理**: API可能返回错误，需要处理各种HTTP状态码
4. **网络超时**: 建议设置合理的超时时间（建议30秒）
5. **加载状态**: 生成问题可能需要几秒钟，需要显示加载状态

## 🧪 测试工具

### Postman Collection

```json
{
  "info": {
    "name": "Memoir API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "https://your-project.supabase.co/functions/v1"
    },
    {
      "key": "apiKey",
      "value": "your-anon-key"
    },
    {
      "key": "userId",
      "value": "test-user-123"
    }
  ],
  "item": [
    {
      "name": "Interview Start - First",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{apiKey}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"userId\": \"{{userId}}\",\n  \"chapter\": \"童年故里\"\n}"
        },
        "url": "{{baseUrl}}/interview-start"
      }
    }
  ]
}
```

## 📞 支持

如有问题，请联系后端工程师或查看：
- API文档: `ANDROID_API_DOCUMENTATION.md`
- 对话流程测试: `CONVERSATION_FLOW_TEST.md`

