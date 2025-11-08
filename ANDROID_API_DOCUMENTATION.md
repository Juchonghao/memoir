# 安卓应用API文档

## 概述

本文档描述为安卓应用开发的两个核心API：
1. **AI起始对话API** - 像记者一样引导老人记录回忆，检测大类内容缺失
2. **生成回忆录API** - 用LLM生成回忆录，返回webUI格式

## 基础信息

- **Base URL**: `https://your-project.supabase.co/functions/v1`
- **认证方式**: Bearer Token (使用Supabase Anon Key或Service Role Key)

## API 1: AI起始对话API

### 端点
```
POST /interview-start
```

### 功能
- **持续对话API**：打开APP第一次调用开启对话，之后持续与老人交流
- 像记者一样引导老人进行对话
- 自动检测大类内容缺失
- 基于对话历史生成个性化问题
- 返回缺失主题建议

### 对话流程

```
1. 打开APP → 第一次调用（只传userId和chapter）
   ↓
2. AI返回第一个问题 + sessionId
   ↓
3. 老人回答 → 调用API（传userId, chapter, sessionId, userAnswer, roundNumber）
   ↓
4. AI保存回答，生成下一个问题
   ↓
5. 重复步骤3-4，持续对话
```

### 请求参数

#### 第一次调用（开启对话）
```json
{
  "userId": "string (必需) - 用户ID",
  "chapter": "string (必需) - 章节名称，可选值：童年故里、青春之歌、事业征程、家庭港湾、流金岁月"
}
```

#### 后续调用（继续对话）
```json
{
  "userId": "string (必需) - 用户ID",
  "chapter": "string (必需) - 章节名称",
  "sessionId": "string (必需) - 会话ID，从第一次调用的响应中获取",
  "userAnswer": "string (必需) - 用户的回答",
  "roundNumber": "integer (必需) - 当前对话轮次，从上次响应的roundNumber获取"
}
```

### 响应格式

```json
{
  "success": true,
  "data": {
    "question": "AI生成的问题",
    "sessionId": "会话ID",
    "roundNumber": 1,
    "totalRounds": 1,
    "missingThemes": ["主题1", "主题2", "主题3"],
    "coverage": 45,
    "suggestions": "建议补充以下内容：主题1、主题2、主题3"
  }
}
```

### 响应字段说明

- `question`: AI生成的下一个问题
- `sessionId`: 会话ID，用于后续对话
- `roundNumber`: 当前轮次
- `totalRounds`: 总轮次
- `missingThemes`: 缺失的主题列表（最多5个）
- `coverage`: 内容覆盖率（0-100）
- `suggestions`: 建议补充的内容提示

### 使用示例

#### 完整对话流程示例

**第1轮：打开APP，开启对话**

```bash
curl -X POST "https://your-project.supabase.co/functions/v1/interview-start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "userId": "user-123",
    "chapter": "童年故里"
  }'
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

**第2轮：老人回答后，继续对话**

```bash
curl -X POST "https://your-project.supabase.co/functions/v1/interview-start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "userId": "user-123",
    "chapter": "童年故里",
    "sessionId": "session_1234567890",
    "userAnswer": "我小时候住在农村，家里有父母和两个兄弟姐妹。",
    "roundNumber": 1
  }'
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

**第3轮及以后：持续对话**

每次调用都传入：
- `userId`: 用户ID
- `chapter`: 章节名称
- `sessionId`: 从第一次响应中获取的sessionId
- `userAnswer`: 老人的回答
- `roundNumber`: 从上次响应中获取的roundNumber

API会自动：
1. 保存老人的回答
2. 分析对话历史
3. 检测内容缺失
4. 生成下一个个性化问题
5. 返回新的roundNumber供下次使用

### 对话流程图示

```
┌─────────────────────────────────────────┐
│  打开APP，选择章节                        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  第1次调用：                              │
│  { userId, chapter }                    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  返回：第一个问题 + sessionId             │
│  AI: "请描述一下您的童年生活环境..."      │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  老人回答（语音/文字）                    │
│  "我小时候住在农村..."                    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  第2次调用：                              │
│  { userId, chapter, sessionId,          │
│    userAnswer, roundNumber }            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  返回：下一个问题                         │
│  AI: "能跟我说说您和兄弟姐妹之间..."      │
└──────────────┬──────────────────────────┘
               │
               ▼
        (持续循环...)
```

### 章节配置

每个章节都有预定义的主题大类，API会自动检测这些主题是否已被讨论：

- **童年故里**: 家庭背景、童年趣事、成长环境、早期教育、故乡印象、父母关系、兄弟姐妹、童年玩伴、学校生活、家乡变化
- **青春之歌**: 求学经历、青春梦想、重要转折、师友情谊、性格养成、校园生活、初恋回忆、青春困惑、理想追求、成长烦恼
- **事业征程**: 职业起点、事业发展、重要项目、职业挑战、成就与荣誉、工作环境、同事关系、职业选择、工作压力、职业感悟
- **家庭港湾**: 恋爱婚姻、家庭生活、子女教育、家庭角色、亲情故事、夫妻关系、子女成长、家庭责任、家庭传统、家庭困难
- **流金岁月**: 退休生活、兴趣爱好、人生智慧、对后辈的寄语、未来展望、人生感悟、经验总结、遗憾与收获、生活态度、人生意义

## API 2: 生成回忆录API

### 端点
```
POST /memoir-generate
```

### 功能
- 基于对话历史生成回忆录
- 支持多种文风（莫言、刘慈欣、余秋雨）
- 返回纯文本和webUI格式的HTML

### 请求参数

```json
{
  "userId": "string (必需) - 用户ID",
  "chapter": "string (可选) - 章节名称，不传则生成所有章节的回忆录",
  "writingStyle": "string (必需) - 文风，可选值：moyan、liucixin、yiqiuyu、default",
  "title": "string (可选) - 回忆录标题，默认：我的人生故事",
  "saveToDatabase": "boolean (可选) - 是否保存到数据库，默认：true"
}
```

### 响应格式

```json
{
  "success": true,
  "data": {
    "title": "回忆录标题",
    "content": "回忆录纯文本内容",
    "html": "<!DOCTYPE html>...完整的webUI格式HTML",
    "wordCount": 2500,
    "writingStyle": "moyan",
    "chapter": "童年故里",
    "generatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

### 响应字段说明

- `title`: 回忆录标题
- `content`: 回忆录纯文本内容（2000-3000字）
- `html`: 完整的webUI格式HTML，包含样式和排版
- `wordCount`: 字数统计
- `writingStyle`: 使用的文风
- `chapter`: 章节名称
- `generatedAt`: 生成时间

### 文风说明

- **moyan**: 莫言的乡土魔幻风格 - 运用感官细节、乡土语言、魔幻现实主义手法
- **liucixin**: 刘慈欣的宏大叙事风格 - 理性思维、宏观视角、科技与人文结合
- **yiqiuyu**: 余秋雨的文化哲思风格 - 文化意象、历史典故、沉静思辨
- **default**: 温暖叙事、文学化表达

### 使用示例

```bash
curl -X POST "https://your-project.supabase.co/functions/v1/memoir-generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "userId": "user-123",
    "chapter": "童年故里",
    "writingStyle": "moyan",
    "title": "我的童年回忆",
    "saveToDatabase": true
  }'
```

### WebUI HTML格式说明

返回的HTML包含：
- **Hero区域**: 标题和日期展示
- **正文区域**: 最大宽度650px，适合阅读
- **Drop Cap**: 首段首字母大写样式
- **Pull Quote**: 每4段插入一个引用样式
- **响应式设计**: 支持移动端和桌面端
- **打印功能**: 内置打印按钮

可以直接在WebView中显示，或保存为HTML文件。

## 通过API Gateway访问

两个API也可以通过统一的API Gateway访问：

### API Gateway端点

```
POST /api-gateway/api/v1/interview/start
POST /api-gateway/api/v1/memoir/generate
```

### 使用示例

```bash
# 通过API Gateway访问AI起始对话API
curl -X POST "https://your-project.supabase.co/functions/v1/api-gateway/api/v1/interview/start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "chapter": "童年故里"
  }'

# 通过API Gateway访问生成回忆录API
curl -X POST "https://your-project.supabase.co/functions/v1/api-gateway/api/v1/memoir/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "chapter": "童年故里",
    "writingStyle": "moyan",
    "title": "我的童年回忆"
  }'
```

注意：通过API Gateway访问时，`userId`会自动从认证token中提取，无需在请求中提供。

## 错误处理

### 错误响应格式

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": "详细错误信息"
  }
}
```

### 常见错误码

- `BAD_REQUEST`: 请求参数错误
- `UNAUTHORIZED`: 认证失败
- `NOT_FOUND`: 资源不存在
- `INTERNAL_ERROR`: 服务器内部错误

## 测试

### 使用测试脚本

```bash
# 设置环境变量
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"
export TEST_USER_ID="your-user-id"

# 运行测试
bash test-android-apis.sh
# 或
node test-android-apis.js
```

## 注意事项

1. **认证**: 所有API都需要Bearer Token认证
2. **会话管理**: 使用`sessionId`来维护对话上下文
3. **内容缺失检测**: API会自动检测大类内容缺失，建议根据`missingThemes`引导用户补充
4. **生成时间**: 回忆录生成可能需要10-30秒，建议在客户端显示加载状态
5. **HTML显示**: 返回的HTML可以直接在WebView中显示，样式已内置

## 部署

### 部署Edge Functions

```bash
# 部署interview-start
supabase functions deploy interview-start

# 部署memoir-generate
supabase functions deploy memoir-generate

# 部署api-gateway（如果使用）
supabase functions deploy api-gateway
```

### 环境变量配置

确保在Supabase项目中配置以下环境变量：

- `SUPABASE_URL`: Supabase项目URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service Role Key
- `OPENAI_API_KEY` 或 `GEMINI_API_KEY`: LLM API密钥
- `OPENAI_BASE_URL`: LLM API基础URL（可选，默认：https://api.ppinfra.com/openai）
- `OPENAI_MODEL`: LLM模型（可选，默认：deepseek/deepseek-r1）

## 更新日志

### v1.0.0 (2025-01-01)
- 初始版本
- 实现AI起始对话API
- 实现生成回忆录API
- 支持内容缺失检测
- 支持webUI格式输出

