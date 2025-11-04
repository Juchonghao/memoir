# 纪传体AI应用 - 项目说明文档

## 项目概述

纪传体AI应用是一个创新的个人传记生成平台,通过AI技术实现记忆回溯访谈、智能引导对话、记忆镜像生成和文学化传记创作。

## 核心功能

### 1. 记忆回溯访谈系统(三区联动设计)
- **左侧**: AI记者动态引导区
- **中央**: 记忆镜像引擎(AI图生图)
- **右侧**: 故事锚点和时代背景素材

### 2. AI文风模仿功能
- 莫言乡土魔幻风格
- 刘慈欣宏大叙事风格
- 余秋雨文化哲思风格

### 3. 个人传记生成与展示
- 基于访谈内容的智能生成
- 多格式输出(文本、图像、音频)
- Editorial Magazine Style设计风格

## 技术架构

### 前端技术栈
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式**: TailwindCSS (Editorial Magazine Style)
- **路由**: React Router DOM
- **状态管理**: Zustand
- **图标**: Lucide React

### 后端技术栈
- **BaaS**: Supabase
  - PostgreSQL数据库
  - Edge Functions (Deno运行时)
  - Storage (对象存储)
  - Auth (身份认证)

### AI集成
- **文本生成**: Gemini API
  - 访谈问题生成
  - 传记内容生成
- **图像生成**: (待集成)
  - 记忆镜像生成

## 已完成的后端开发

### 数据库表结构

#### users (用户信息)
```sql
id UUID PRIMARY KEY
email VARCHAR(255) UNIQUE NOT NULL
full_name VARCHAR(255)
avatar_url TEXT
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

#### interview_sessions (访谈会话)
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
chapter VARCHAR(100) NOT NULL -- 'childhood', 'youth', 'career', 'family', 'reflection'
status VARCHAR(50) DEFAULT 'in_progress'
started_at TIMESTAMPTZ
ended_at TIMESTAMPTZ
total_rounds INTEGER DEFAULT 0
```

#### interview_responses (访谈问答)
```sql
id UUID PRIMARY KEY
session_id UUID REFERENCES interview_sessions(id)
round_number INTEGER NOT NULL
question TEXT NOT NULL
answer TEXT
emotion_tag VARCHAR(50)
created_at TIMESTAMPTZ
```

#### biographies (传记作品)
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
title VARCHAR(255) NOT NULL
content TEXT
writing_style VARCHAR(100) -- 'moyan', 'liucixin', 'yiqiuyu'
status VARCHAR(50) DEFAULT 'draft'
version INTEGER DEFAULT 1
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

#### media_files (媒体文件)
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
file_type VARCHAR(50) NOT NULL -- 'image', 'audio'
file_url TEXT NOT NULL
related_entity_type VARCHAR(50)
related_entity_id UUID
decade VARCHAR(50)
created_at TIMESTAMPTZ
```

### Storage Buckets

1. **user-photos**: 用户上传的照片(10MB限制)
2. **memory-mirrors**: AI生成的记忆镜像图像(10MB限制)

### Edge Functions

#### 1. ai-interviewer (AI访谈引导)
**URL**: `https://lafpbfjtbupootnpornv.supabase.co/functions/v1/ai-interviewer`

**功能**: 根据章节和之前的回答生成合适的访谈问题

**请求示例**:
```json
POST /functions/v1/ai-interviewer
{
  "chapter": "childhood",
  "previousAnswers": ["我出生在一个小山村..."],
  "roundNumber": 1
}
```

**响应示例**:
```json
{
  "question": "那个小山村最让你难忘的是什么?是某个特定的地方,还是某种气味或声音?",
  "roundNumber": 2,
  "suggestions": []
}
```

#### 2. generate-biography (传记生成)
**URL**: `https://lafpbfjtbupootnpornv.supabase.co/functions/v1/generate-biography`

**功能**: 根据访谈内容和选定的文风生成传记

**请求示例**:
```json
POST /functions/v1/generate-biography
{
  "interviewData": [
    {
      "chapter": "childhood",
      "responses": [...]
    }
  ],
  "writingStyle": "moyan",
  "title": "我的人生故事"
}
```

**响应示例**:
```json
{
  "content": "那是一个飘着炊烟的小山村...",
  "wordCount": 2543,
  "generatedAt": "2025-10-31T15:30:00Z"
}
```

## 设计规范 (Editorial Magazine Style)

### 色彩系统
- **主色调**: 米白底色(#FEFEFE) + 琥珀金点缀(#D4A574)
- **文本**: 近黑色(#1A1A1A)为主, 保持高对比度(AAA级)
- **强调色**: 琥珀金用于关键CTA和章节高亮

### 字体系统
- **标题**: Noto Serif SC (衬线体)
- **正文**: Georgia (易读衬线)
- **UI元素**: Inter (无衬线)

### 核心组件
1. **章节选择卡片**: 带背景图和渐变遮罩
2. **AI对话气泡**: 温暖的聊天界面
3. **记忆镜像画布**: 1:1比例的图像生成区
4. **传记文章布局**: 居中650px文章列,Drop Cap首字下沉

## 环境配置

### Supabase配置
```typescript
// src/lib/supabase.ts
const supabaseUrl = 'https://lafpbfjtbupootnpornv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

### Edge Functions环境变量
- `GEMINI_API_KEY`: 已在Supabase配置

## 下一步开发计划

### 前端开发 (优先级排序)

#### Phase 1: 核心页面 (2-3天)
1. **首页/引导页**: 介绍产品价值,引导用户开始
2. **章节选择页**: 5个人生篇章的可视化选择
3. **登录/注册页**: Supabase Auth集成

#### Phase 2: 访谈功能 (3-4天)
1. **三区联动访谈界面**:
   - 左侧: AI记者对话区
   - 中央: 记忆镜像显示区(先用占位符)
   - 右侧: 时代素材卡片
2. **访谈流程管理**: 保存进度,断点续传
3. **实时问答交互**: 连接ai-interviewer Edge Function

#### Phase 3: 传记生成 (2-3天)
1. **文风选择界面**: 三种作家风格的介绍和选择
2. **传记生成页**: 显示生成进度
3. **传记展示页**: Editorial风格的文章展示,支持导出

#### Phase 4: 图像功能 (待定)
1. **照片上传**: 用户上传个人照片
2. **AI图生图集成**: 需要图像生成API
3. **记忆镜像展示**: 在访谈界面实时显示

### 图像生成方案选项

由于当前缺少图像生成API,可考虑以下方案:

1. **使用免费API**:
   - Pollinations.AI: `https://image.pollinations.ai/prompt/{prompt}`
   - 优点: 免费,无需API密钥
   - 缺点: 质量和控制度较低

2. **使用商业API** (需要API密钥):
   - Stable Diffusion
   - DALL-E 3
   - Midjourney

3. **暂时使用占位符**:
   - 先完成其他核心功能
   - 图像区域显示占位图或渐变背景
   - 后期集成真实的图像生成能力

## 本地开发启动

```bash
cd /workspace/jizhuanti-app

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 部署说明

### 前端部署
```bash
# 构建
npm run build

# 部署dist目录到静态托管服务
# 如: Vercel, Netlify, Cloudflare Pages
```

### 环境变量配置
```
VITE_SUPABASE_URL=https://lafpbfjtbupootnpornv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 项目文件结构

```
jizhuanti-app/
├── public/              # 静态资源
├── src/
│   ├── components/      # React组件
│   │   ├── ChapterCard.tsx
│   │   ├── InterviewChat.tsx
│   │   ├── MemoryMirror.tsx
│   │   └── BiographyArticle.tsx
│   ├── pages/          # 页面组件
│   │   ├── Home.tsx
│   │   ├── ChapterSelection.tsx
│   │   ├── Interview.tsx
│   │   ├── StyleSelection.tsx
│   │   └── BiographyView.tsx
│   ├── lib/            # 工具库
│   │   ├── supabase.ts
│   │   └── api.ts
│   ├── types/          # TypeScript类型
│   │   └── index.ts
│   ├── assets/         # 资源文件
│   ├── App.tsx         # 主应用组件
│   ├── main.tsx        # 入口文件
│   └── index.css       # 全局样式
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js  # TailwindCSS配置
```

## 联系信息

**项目名称**: 纪传体AI应用  
**开发时间**: 2025-10-31  
**Supabase项目**: lafpbfjtbupootnpornv  
**文档维护**: MiniMax Agent

---

**注意事项**:
1. Gemini API已配置在Edge Functions中
2. 图像生成功能需要额外的API集成
3. 所有敏感信息(API密钥)已在Supabase后端配置
4. Editorial Magazine Style设计规范详见 `/workspace/docs/design-specification.md`
