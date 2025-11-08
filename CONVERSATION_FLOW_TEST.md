# AI记者对话流程测试

## 概述

这个测试展示了**AI起始对话API**的完整使用流程，模拟老人打开APP后与AI记者持续对话的场景。

## 测试脚本

### 1. Bash版本
```bash
bash test-conversation-flow.sh
```

### 2. Node.js版本
```bash
node test-conversation-flow.js
```

## 对话流程示例

### 第1轮：打开APP，开启对话

**请求：**
```json
{
  "userId": "user-123",
  "chapter": "童年故里"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "question": "请描述一下您的童年生活环境，比如住在哪里？家里有哪些人？",
    "sessionId": "session_1234567890",
    "roundNumber": 1,
    "totalRounds": 1,
    "missingThemes": ["家庭背景", "童年趣事", "成长环境", "早期教育", "故乡印象"],
    "coverage": 0,
    "suggestions": "建议补充以下内容：家庭背景、童年趣事、成长环境"
  }
}
```

**对话显示：**
```
[AI记者 - 第1轮] 请描述一下您的童年生活环境，比如住在哪里？家里有哪些人？

[老人回答 - 第1轮] 我小时候住在农村，家里有父母和两个兄弟姐妹。我们家有一个小院子，院子里种了很多花。
```

### 第2轮：老人回答后，AI继续提问

**请求：**
```json
{
  "userId": "user-123",
  "chapter": "童年故里",
  "sessionId": "session_1234567890",
  "userAnswer": "我小时候住在农村，家里有父母和两个兄弟姐妹。我们家有一个小院子，院子里种了很多花。",
  "roundNumber": 1
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "question": "听起来您有一个温馨的家庭！能跟我说说您和兄弟姐妹之间有什么有趣的回忆吗？",
    "sessionId": "session_1234567890",
    "roundNumber": 2,
    "totalRounds": 2,
    "missingThemes": ["童年趣事", "成长环境", "早期教育", "故乡印象", "童年玩伴"],
    "coverage": 20,
    "suggestions": "建议补充以下内容：童年趣事、成长环境、早期教育"
  }
}
```

**对话显示：**
```
[AI记者 - 第2轮] 听起来您有一个温馨的家庭！能跟我说说您和兄弟姐妹之间有什么有趣的回忆吗？

💡 内容检测：覆盖率 20%，建议补充：童年趣事、成长环境、早期教育

[老人回答 - 第2轮] 我父母都是农民，父亲种地，母亲在家做家务。他们很勤劳，每天都很早起床。
```

### 第3轮及以后：持续对话

每次调用都遵循相同的模式：
1. 传入老人的回答和当前轮次
2. AI保存回答，分析对话历史
3. 检测内容缺失，生成个性化问题
4. 返回下一个问题和新的轮次

## 关键特点

### 1. 持续对话
- **第一次调用**：只传 `userId` 和 `chapter`，开启对话
- **后续调用**：每次都传 `userId`, `chapter`, `sessionId`, `userAnswer`, `roundNumber`
- **循环进行**：直到对话结束

### 2. 智能问题生成
- AI根据老人的回答生成个性化问题
- 问题自然流畅，像朋友聊天
- 基于对话历史，避免重复

### 3. 内容缺失检测
- 每个章节有10个主题大类
- API自动检测哪些主题还未讨论
- 返回缺失主题建议和覆盖率

### 4. 会话管理
- 使用 `sessionId` 维护对话上下文
- 每次响应返回新的 `roundNumber`
- 支持多章节、多会话

## 使用说明

### 环境变量设置

```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"
export TEST_USER_ID="your-user-id"
```

### 运行测试

```bash
# Bash版本
bash test-conversation-flow.sh

# Node.js版本
node test-conversation-flow.js
```

## 在安卓应用中的集成

### 1. 初始化对话

```kotlin
// 第一次调用，开启对话
val request = InterviewRequest(
    userId = currentUser.id,
    chapter = selectedChapter
)

val response = apiService.startInterview(request)
val sessionId = response.data.sessionId
val firstQuestion = response.data.question
```

### 2. 持续对话

```kotlin
// 每次用户回答后调用
val request = InterviewRequest(
    userId = currentUser.id,
    chapter = selectedChapter,
    sessionId = currentSessionId,
    userAnswer = userAnswer,
    roundNumber = currentRoundNumber
)

val response = apiService.startInterview(request)
val nextQuestion = response.data.question
val nextRoundNumber = response.data.roundNumber

// 更新UI显示新问题
updateUI(nextQuestion, nextRoundNumber)
```

### 3. 内容缺失提示

```kotlin
// 显示内容缺失建议
val missingThemes = response.data.missingThemes
val coverage = response.data.coverage

if (missingThemes.isNotEmpty()) {
    showSuggestion("建议补充：${missingThemes.joinToString("、")}")
}
```

## 测试输出示例

```
========================================
AI记者对话流程测试
模拟：老人打开APP，与AI记者持续对话
========================================

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
第1轮：老人打开APP，AI记者开始对话
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📤 请求：开启对话（首次调用，无sessionId）

📥 响应：
{
  "success": true,
  "data": {
    "question": "请描述一下您的童年生活环境...",
    "sessionId": "session_1234567890",
    "roundNumber": 1,
    ...
  }
}

[AI记者 - 第1轮] 请描述一下您的童年生活环境，比如住在哪里？家里有哪些人？

[老人回答 - 第1轮] 我小时候住在农村，家里有父母和两个兄弟姐妹。我们家有一个小院子，院子里种了很多花。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
第2轮：老人回答后，AI记者继续提问
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[AI记者 - 第2轮] 听起来您有一个温馨的家庭！能跟我说说您和兄弟姐妹之间有什么有趣的回忆吗？

💡 内容检测：覆盖率 20%，建议补充：童年趣事、成长环境、早期教育

[老人回答 - 第2轮] 我父母都是农民，父亲种地，母亲在家做家务。他们很勤劳，每天都很早起床。

...

========================================
对话流程测试完成
========================================

📊 对话统计：
  - 总轮次：5 轮
  - 会话ID：session_1234567890
  - 章节：童年故里
  - 内容覆盖率：60%

💡 对话特点：
  - AI记者根据老人的回答，持续生成个性化问题
  - 自动检测内容缺失，引导补充重要主题
  - 对话自然流畅，像朋友聊天一样
```

## 注意事项

1. **Session管理**：每次对话都需要保存 `sessionId`，用于后续调用
2. **RoundNumber**：每次调用后更新 `roundNumber`，用于下次调用
3. **错误处理**：如果API调用失败，应该重试或显示错误信息
4. **网络延迟**：生成问题可能需要几秒钟，应该显示加载状态
5. **内容检测**：可以根据 `missingThemes` 和 `coverage` 引导用户补充内容

