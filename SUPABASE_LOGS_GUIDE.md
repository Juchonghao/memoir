# 📊 Supabase 日志查看指南

## 🎯 快速访问

### Edge Functions 日志（推荐）

**直接链接**：
```
https://supabase.com/dashboard/project/lafpbfjtbupootnpornv/logs/edge-functions
```

**或者通过 Dashboard 导航**：
1. 访问：https://supabase.com/dashboard/project/lafpbfjtbupootnpornv
2. 左侧菜单 → **Logs** → **Edge Functions**
3. 选择要查看的函数（如 `memoir-generate`）

### 数据库日志

**直接链接**：
```
https://supabase.com/dashboard/project/lafpbfjtbupootnpornv/logs/explorer
```

**或者通过 Dashboard 导航**：
1. 访问：https://supabase.com/dashboard/project/lafpbfjtbupootnpornv
2. 左侧菜单 → **Logs** → **Postgres Logs**

---

## 📋 查看方式详解

### 方式1：Supabase Dashboard（最简单）

#### 步骤：
1. **登录 Supabase Dashboard**
   - 访问：https://supabase.com/dashboard
   - 选择项目：`lafpbfjtbupootnpornv`

2. **查看 Edge Functions 日志**
   - 左侧菜单点击 **Logs**
   - 选择 **Edge Functions**
   - 在函数列表中选择要查看的函数：
     - `memoir-generate`
     - `interview-start`
     - `api-gateway`
     - `ai-interviewer-smart`

3. **过滤日志**
   - 可以按时间范围过滤
   - 可以搜索特定关键词
   - 可以查看错误、警告、信息等不同级别

#### 日志内容包含：
- ✅ 函数执行时间
- ✅ 请求和响应数据
- ✅ `console.log()` 输出
- ✅ 错误堆栈信息
- ✅ 执行耗时
- ✅ HTTP 状态码

---

### 方式2：Supabase CLI（命令行）

#### 安装 CLI（如果还没有）

```bash
# macOS
brew install supabase/tap/supabase

# 或使用 npm
npm install -g supabase
```

#### 登录

```bash
supabase login
```

#### 查看日志

```bash
# 查看所有 Edge Functions 日志
supabase functions logs

# 查看特定函数的日志
supabase functions logs memoir-generate

# 实时查看日志（类似 tail -f）
supabase functions logs memoir-generate --follow

# 查看最近 100 条日志
supabase functions logs memoir-generate --limit 100

# 查看特定时间范围的日志
supabase functions logs memoir-generate --since 1h
supabase functions logs memoir-generate --since 2025-11-08T00:00:00Z
```

#### 过滤日志

```bash
# 只查看错误
supabase functions logs memoir-generate | grep -i error

# 查看包含特定关键词的日志
supabase functions logs memoir-generate | grep "No conversation"
```

---

### 方式3：API Explorer（数据库查询日志）

#### 查看数据库操作日志

1. 访问：https://supabase.com/dashboard/project/lafpbfjtbupootnpornv/logs/explorer
2. 可以查看：
   - SQL 查询日志
   - 数据库错误
   - 慢查询
   - 连接问题

---

## 🔍 调试 memoir-generate 问题

### 查看特定错误的日志

1. **打开 Edge Functions 日志**
   ```
   https://supabase.com/dashboard/project/lafpbfjtbupootnpornv/logs/edge-functions
   ```

2. **选择 `memoir-generate` 函数**

3. **查找错误时间点**
   - 根据错误时间（如 2025-11-08 22:46:23）
   - 查看该时间点前后的日志

4. **查看详细错误信息**
   - 查找包含 "No conversation data found" 的日志
   - 查看 `console.log()` 输出的调试信息
   - 检查请求参数（userId, chapter 等）

### 日志示例

修复后的 `memoir-generate` 函数会输出以下调试信息：

```
Found 0 conversations for user 24fe5f0a-eb7a-4064-98ed-7ccde5312a1a, chapter undefined
No conversations found for user 24fe5f0a-eb7a-4064-98ed-7ccde5312a1a
Sample conversations: []
```

或者如果有部分对话：

```
Found 5 conversations for user 24fe5f0a-eb7a-4064-98ed-7ccde5312a1a
Found 5 conversations for user, but none match the criteria
Sample conversations: [
  {
    "id": "...",
    "user_id": "...",
    "chapter": "童年故里",
    "round_number": 1
  }
]
```

---

## 🛠️ 实用技巧

### 1. 实时监控

使用 CLI 实时监控：
```bash
supabase functions logs memoir-generate --follow
```

### 2. 导出日志

```bash
# 导出到文件
supabase functions logs memoir-generate --limit 1000 > memoir-logs.txt

# 导出 JSON 格式
supabase functions logs memoir-generate --format json > memoir-logs.json
```

### 3. 搜索特定错误

在 Dashboard 中：
- 使用搜索框输入关键词
- 例如：`"No conversation"`、`"HTTP 400"`、`userId`

### 4. 查看函数指标

在 Dashboard 的 **Edge Functions** 页面可以查看：
- 调用次数
- 平均响应时间
- 错误率
- 流量统计

---

## 📝 项目信息

- **项目ID**: `lafpbfjtbupootnpornv`
- **项目URL**: `https://lafpbfjtbupootnpornv.supabase.co`
- **Dashboard**: https://supabase.com/dashboard/project/lafpbfjtbupootnpornv

---

## ⚡ 快速命令参考

```bash
# 查看所有函数日志
supabase functions logs

# 查看 memoir-generate 日志
supabase functions logs memoir-generate

# 实时查看
supabase functions logs memoir-generate --follow

# 查看最近1小时的错误
supabase functions logs memoir-generate --since 1h | grep -i error

# 查看特定用户的请求
supabase functions logs memoir-generate | grep "24fe5f0a-eb7a-4064-98ed-7ccde5312a1a"
```

---

## 🔗 相关链接

- [Supabase Dashboard](https://supabase.com/dashboard/project/lafpbfjtbupootnpornv)
- [Edge Functions 日志](https://supabase.com/dashboard/project/lafpbfjtbupootnpornv/logs/edge-functions)
- [Postgres 日志](https://supabase.com/dashboard/project/lafpbfjtbupootnpornv/logs/explorer)
- [Supabase CLI 文档](https://supabase.com/docs/reference/cli)

