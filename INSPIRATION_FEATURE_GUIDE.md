# 灵感输入模块使用指南

## 🎯 功能说明

灵感输入模块让用户可以**自由记录人生经历**，不受AI问题限制。特别适合老年人随时记录突然想起的回忆。

---

## ✨ 主要特性

### 1. 自由记录
- **不受问题限制**：用户可以随时记录任何想说的内容
- **文本输入**：支持直接输入文字
- **语音输入**：支持语音转文字，更便捷

### 2. 自动分类
- **AI智能分类**：使用Gemini AI分析内容，自动归类到合适的章节
- **关键词分类**：如果AI不可用，使用关键词匹配作为备用
- **分类到5个章节**：
  - 童年故里（childhood）
  - 青春之歌（youth）
  - 事业征程（career）
  - 家庭港湾（family）
  - 流金岁月（reflection）

### 3. 便捷操作
- **浮动按钮**：右下角紫色渐变按钮，随时可点击
- **大文本区**：舒适的输入体验
- **一键保存**：自动分类并保存

---

## 📋 数据库表创建

在Supabase中运行以下SQL创建表：

```sql
-- 创建灵感记录表
CREATE TABLE IF NOT EXISTS inspiration_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    chapter VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_inspiration_records_user_id ON inspiration_records(user_id);
CREATE INDEX IF NOT EXISTS idx_inspiration_records_category ON inspiration_records(category);
CREATE INDEX IF NOT EXISTS idx_inspiration_records_created_at ON inspiration_records(created_at DESC);

-- 启用RLS
ALTER TABLE inspiration_records ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "Users can view their own inspiration records" ON inspiration_records
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own inspiration records" ON inspiration_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inspiration records" ON inspiration_records
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inspiration records" ON inspiration_records
    FOR DELETE USING (auth.uid() = user_id);
```

或者直接运行：
```bash
# 在Supabase Dashboard的SQL Editor中执行
supabase/tables/inspiration_records.sql
```

---

## 🎤 语音模型升级（ChatTTS）

### 使用ChatTTS获得最佳语音效果

项目已集成了ChatTTS支持，但需要启动本地服务器：

#### 1. 启动ChatTTS服务器

```bash
cd /Users/chonghaoju/memoir-package/code
python chattts_server.py
```

服务器会在 `http://localhost:8080` 启动

#### 2. 验证服务器

```bash
curl http://localhost:8080/health
```

#### 3. 自动回退

如果ChatTTS服务器未启动，应用会自动使用浏览器TTS（质量稍低但完全可用）

---

## 🚀 使用流程

### 用户操作

1. **打开灵感输入**：点击右下角紫色渐变按钮（✨图标）
2. **输入内容**：
   - 方式1：直接输入文字
   - 方式2：点击"开始录音"，说话后自动转文字
3. **自动分类**：系统自动分析内容并分类到合适的章节
4. **保存**：点击"保存"按钮，内容自动保存

### 分类示例

| 输入内容 | 自动分类 |
|---------|---------|
| "我小时候在院子里种花" | 童年故里 |
| "大学时和朋友们一起..." | 青春之歌 |
| "我的第一份工作..." | 事业征程 |
| "和妻子相识的那一天..." | 家庭港湾 |
| "退休后的感悟..." | 流金岁月 |

---

## 📊 数据存储

灵感记录保存在 `inspiration_records` 表中：

- **user_id**：用户ID
- **chapter**：章节名称（中文）
- **category**：章节标识（英文）
- **content**：记录的内容
- **created_at**：创建时间

---

## 🔧 技术实现

### 前端组件
- **InspirationInput.tsx**：灵感输入组件
- **useChatTTS.ts**：高质量语音合成Hook
- **InterviewPage.tsx**：集成到访谈页面

### 后端功能
- **Edge Function**：`ai-interviewer-smart` 新增 `classifyContent` action
- **数据库表**：`inspiration_records` 存储记录

### 分类逻辑
1. **优先**：使用Gemini AI进行语义分析
2. **备用**：关键词匹配分类
3. **默认**：当前章节或"童年故里"

---

## 🎨 UI设计

### 浮动按钮
- 位置：右下角固定
- 样式：紫色到粉色渐变
- 图标：✨ Sparkles
- 悬停：放大效果

### 输入面板
- 模态对话框
- 紫色渐变头部
- 大文本输入区
- 语音控制按钮
- 分类显示区域

---

## 💡 使用建议

1. **鼓励用户使用**：告诉用户可以随时记录灵感
2. **语音输入**：对老年人更友好
3. **自动分类**：无需担心分类错误，系统会自动处理
4. **随时保存**：记录后立即保存，不会丢失

---

## 📝 后续优化建议

1. **查看历史灵感**：添加查看已保存的灵感记录功能
2. **编辑灵感**：允许修改已保存的记录
3. **批量导出**：将灵感记录导出为文本
4. **语音回放**：可以回听自己录制的语音

---

**现在可以开始使用了！** 🚀

