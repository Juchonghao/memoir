# 灵感输入模块使用指南

## 功能概述

灵感输入模块允许用户自由记录人生经历，不受访谈问题限制。系统会自动分析内容并分类到合适的章节。

## 功能特性

### 1. 多输入方式
- ✅ 文本输入：直接在文本框中输入
- ✅ 语音输入：点击"开始录音"按钮，使用语音识别

### 2. 智能分类
- ✅ 使用 DeepSeek AI 自动分析内容
- ✅ 自动判断所属章节（童年故里、青春之歌、事业征程、家庭港湾、流金岁月）
- ✅ 如果AI分类失败，使用关键词匹配作为备用方案

### 3. 数据存储
- ✅ 保存到 `inspiration_records` 表
- ✅ 包含用户ID、章节、分类、内容和时间戳
- ✅ 行级安全策略（RLS）确保用户只能访问自己的记录

## 使用步骤

### 1. 创建数据库表

在 Supabase Dashboard 的 SQL Editor 中执行：

```sql
-- 灵感记录表 - 存储用户自由输入的经历记录
create table if not exists public.inspiration_records (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  chapter text not null,
  category text not null,
  content text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint inspiration_records_pkey primary key (id),
  constraint inspiration_records_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade
);

-- 创建索引
create index if not exists idx_inspiration_records_user_id on public.inspiration_records(user_id);
create index if not exists idx_inspiration_records_category on public.inspiration_records(category);
create index if not exists idx_inspiration_records_created_at on public.inspiration_records(created_at desc);

-- 启用行级安全策略（RLS）
alter table public.inspiration_records enable row level security;

-- 创建策略
create policy "Users can view their own inspiration records" 
  on public.inspiration_records for select
  using (auth.uid() = user_id);

create policy "Users can insert their own inspiration records" 
  on public.inspiration_records for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own inspiration records" 
  on public.inspiration_records for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own inspiration records" 
  on public.inspiration_records for delete
  using (auth.uid() = user_id);
```

### 2. 确保 Edge Function 已部署

确保 `ai-interviewer-smart` Edge Function 已部署并配置了 `OPENAI_API_KEY`。

### 3. 使用方式

1. 在访谈页面，点击右下角的紫色"灵感"按钮（✨图标）
2. 在弹出的对话框中：
   - 可以直接输入文本
   - 或点击"开始录音"使用语音输入
3. 输入完成后，点击"保存"
4. 系统会自动分类并保存到数据库

## 技术实现

### 前端组件
- 位置：`jizhuanti-app/src/components/InspirationInput.tsx`
- 功能：提供UI界面，处理用户输入，调用分类API

### 后端API
- Edge Function：`ai-interviewer-smart`
- Action：`classifyContent`
- 使用 DeepSeek API 进行智能分类

### 数据库表
- 表名：`inspiration_records`
- 字段：
  - `id`: UUID主键
  - `user_id`: 用户ID（外键）
  - `chapter`: 章节名称（如"童年故里"）
  - `category`: 分类标识（childhood, youth, career, family, reflection）
  - `content`: 用户输入的内容
  - `created_at`: 创建时间
  - `updated_at`: 更新时间

## 分类规则

### AI分类（DeepSeek）
系统会分析文本内容，判断最应该属于哪个章节：
- 童年故里（childhood）：童年时期的成长经历、家庭环境、故乡记忆
- 青春之歌（youth）：青少年时期的学习、成长、梦想和转折
- 事业征程（career）：工作生涯、职业发展、事业成就
- 家庭港湾（family）：家庭生活、婚姻家庭、亲情关系
- 流金岁月（reflection）：退休生活、人生感悟、经验智慧

### 关键词分类（备用方案）
如果AI分类失败，使用关键词匹配：
- 工作、同事、公司 → career
- 家庭、家人、父母 → family
- 童年、小时候、学校 → childhood
- 青春、大学、恋爱 → youth
- 退休、感悟、人生 → reflection

## 注意事项

1. 需要用户登录才能使用
2. 需要浏览器支持语音识别（Web Speech API）
3. 分类结果会在保存时显示给用户
4. 如果分类失败，会使用当前章节作为默认分类

