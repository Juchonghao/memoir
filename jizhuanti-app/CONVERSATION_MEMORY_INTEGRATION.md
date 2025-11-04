# 对话历史记忆系统集成指南

## 概述

智能AI记者Edge Function (`ai-interviewer-smart`) 已成功部署，提供对话历史管理和个性化问题生成功能。

## Edge Function URL

```
https://lafpbfjtbupootnpornv.supabase.co/functions/v1/ai-interviewer-smart
```

## 核心功能

### 1. 对话历史查询
- 查询用户在当前章节的所有历史对话
- 按轮次排序返回对话记录

### 2. 智能问题生成
- 分析历史对话内容
- 提取已问过的问题
- 检测重复问题（完全相同或高度相似）
- 基于用户回答特点生成个性化后续问题
- 使用Gemini AI生成深入、有温度的问题

### 3. 对话记录保存
- 保存用户回答到conversation_history表
- 自动记录轮次、时间戳等元数据

### 4. 章节摘要更新
- 提取关键主题（key_themes）
- 识别关键人物（key_people）
- 记录关键事件（key_events）
- 分析情感基调（emotional_tone）
- 自动更新conversation_summary表

## API接口

### 获取下一个问题

**请求**:
```json
{
  "action": "getNextQuestion",
  "userId": "用户UUID",
  "chapter": "章节名称",
  "sessionId": "会话ID（可选，首次调用不传）"
}
```

**响应**:
```json
{
  "data": {
    "question": "生成的问题内容",
    "roundNumber": 当前轮次,
    "totalRounds": 历史总轮次,
    "sessionId": "会话ID"
  }
}
```

### 保存用户回答

**请求**:
```json
{
  "action": "saveAnswer",
  "userId": "用户UUID",
  "chapter": "章节名称",
  "sessionId": "会话ID",
  "currentQuestion": "当前问题",
  "userAnswer": "用户回答"
}
```

**响应**:
```json
{
  "data": {
    "success": true,
    "conversation": {对话记录对象},
    "roundNumber": 当前轮次
  }
}
```

## 前端集成步骤

### 1. 修改InterviewPage.tsx

需要将现有的localStorage存储改为使用Supabase Edge Function。

#### 修改前（现有代码）：
```typescript
// 从localStorage获取/保存对话历史
const savedHistory = localStorage.getItem(`interview_${chapter}`);
```

#### 修改后：
```typescript
// 使用Edge Function获取下一个问题
const getNextQuestion = async () => {
  const { data, error } = await supabase.functions.invoke('ai-interviewer-smart', {
    body: {
      action: 'getNextQuestion',
      userId: user.id,
      chapter: chapter,
      sessionId: currentSessionId // 保存在组件state中
    }
  });

  if (data?.data) {
    setCurrentQuestion(data.data.question);
    setCurrentSessionId(data.data.sessionId);
  }
};

// 保存用户回答
const saveAnswer = async (answer: string) => {
  const { data, error } = await supabase.functions.invoke('ai-interviewer-smart', {
    body: {
      action: 'saveAnswer',
      userId: user.id,
      chapter: chapter,
      sessionId: currentSessionId,
      currentQuestion: currentQuestion,
      userAnswer: answer
    }
  });

  if (data?.data?.success) {
    // 保存成功后获取下一个问题
    await getNextQuestion();
  }
};
```

### 2. 状态管理

在InterviewPage组件中添加：

```typescript
const [currentSessionId, setCurrentSessionId] = useState<string>('');
const [currentQuestion, setCurrentQuestion] = useState<string>('');
const [conversationRound, setConversationRound] = useState<number>(1);
```

### 3. 初始化流程

```typescript
useEffect(() => {
  if (user && chapter) {
    // 进入页面时获取第一个问题
    getNextQuestion();
  }
}, [user, chapter]);
```

### 4. 对话流程

```typescript
const handleSendMessage = async () => {
  if (!userInput.trim()) return;

  // 保存用户回答并获取下一个问题
  await saveAnswer(userInput);
  
  // 清空输入框
  setUserInput('');
};
```

## 数据库表结构

### conversation_history
- `id`: UUID (主键)
- `user_id`: UUID (外键 -> users.id)
- `chapter`: VARCHAR(50) (章节名称)
- `session_id`: VARCHAR(100) (会话ID)
- `round_number`: INTEGER (对话轮次)
- `ai_question`: TEXT (AI提出的问题)
- `user_answer`: TEXT (用户的回答)
- `created_at`: TIMESTAMP (创建时间)

### conversation_summary
- `id`: UUID (主键)
- `user_id`: UUID (外键 -> users.id)
- `chapter`: VARCHAR(50) (章节名称)
- `key_themes`: TEXT[] (关键主题数组)
- `key_people`: TEXT[] (关键人物数组)
- `key_events`: TEXT[] (关键事件数组)
- `emotional_tone`: VARCHAR(50) (情感基调)
- `last_updated`: TIMESTAMP (最后更新时间)

## 重复问题检测机制

Edge Function实现了智能重复检测：

1. **完全匹配检测**：识别完全相同的问题
2. **相似度检测**：计算关键词重叠率，相似度>60%视为重复
3. **自动重试**：检测到重复时自动重新生成问题

## 智能问题生成策略

1. **上下文感知**：基于所有历史对话生成问题
2. **深入追问**：根据用户回答中的细节进行追问
3. **情感连接**：关注用户提到的情感和故事
4. **自然过渡**：问题与之前对话自然衔接
5. **开放性**：鼓励用户分享更多细节

## 测试状态

✅ Edge Function部署成功（版本2）
✅ 获取问题接口测试通过
✅ 数据库表结构验证通过
⚠️ Gemini API密钥需要配置（目前使用默认问题作为备用）

## 后续优化建议

1. **配置Gemini API密钥**：启用AI智能问题生成
2. **前端UI更新**：显示对话轮次和历史记录
3. **对话回顾功能**：允许用户查看完整对话历史
4. **摘要展示**：在章节完成后展示关键信息摘要
5. **导出功能**：支持导出对话历史为文档

## 注意事项

- ⚠️ userId必须是有效的UUID格式
- ⚠️ userId必须存在于users表中（外键约束）
- ⚠️ sessionId在整个对话会话中保持不变
- ⚠️ 需要用户登录状态才能调用Edge Function
