# 🚀 立即部署 Gemini API 更新

## 方法1：浏览器登录部署（推荐，最简单）

### 步骤1：打开终端并登录
```bash
cd /Users/chonghaoju/memoir-package
supabase login
```
这会自动打开浏览器，点击"授权"即可。

### 步骤2：链接项目
```bash
supabase link --project-ref lafpbfjtbupootnpornv
```

### 步骤3：部署（2个命令）
```bash
supabase functions deploy ai-interviewer-smart
supabase functions deploy generate-biography
```

### 步骤4：验证
```bash
curl -X POST https://lafpbfjtbupootnpornv.supabase.co/functions/v1/ai-interviewer-smart \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZnBiZmp0YnVwb290bnBvcm52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MzIxMzgsImV4cCI6MjA3NDAwODEzOH0.NdxDvO17UX2Cya0Uz3ECWkR3g5nEbpIcu5ISXPTvaQ8" \
  -d '{"action":"testGemini"}'
```

如果看到 `"success":true`，就成功了！

---

## 方法2：使用 Access Token（适合脚本）

### 步骤1：获取 Access Token
访问：https://supabase.com/dashboard/account/tokens
点击 "Generate new token"，复制 token

### 步骤2：设置环境变量并部署
```bash
cd /Users/chonghaoju/memoir-package

export SUPABASE_ACCESS_TOKEN="你的_token"

supabase link --project-ref lafpbfjtbupootnpornv
supabase functions deploy ai-interviewer-smart
supabase functions deploy generate-biography
```

---

## 方法3：Supabase Dashboard（网页界面，最直观）

### 不需要命令行！直接在浏览器操作：

#### 1. 访问 Edge Functions 页面
https://supabase.com/dashboard/project/lafpbfjtbupootnpornv/functions

#### 2. 更新 ai-interviewer-smart
- 点击 `ai-interviewer-smart` 函数
- 点击右上角 "Deploy new version"
- 复制以下文件内容：
  `/Users/chonghaoju/memoir-package/supabase/functions/ai-interviewer-smart/index.ts`
- 粘贴到编辑器
- 点击 "Deploy"

#### 3. 更新 generate-biography
- 返回 Functions 列表
- 点击 `generate-biography` 函数
- 点击右上角 "Deploy new version"
- 复制以下文件内容：
  `/Users/chonghaoju/memoir-package/supabase/functions/generate-biography/index.ts`
- 粘贴到编辑器
- 点击 "Deploy"

#### 4. 验证部署
回到 Functions 列表，检查版本号是否增加

---

## 🎯 我推荐：方法1（最快）

只需要在终端运行 4 条命令：

```bash
cd /Users/chonghaoju/memoir-package
supabase login                                          # 打开浏览器授权
supabase link --project-ref lafpbfjtbupootnpornv       # 链接项目
supabase functions deploy ai-interviewer-smart          # 部署1
supabase functions deploy generate-biography            # 部署2
```

总共 2 分钟搞定！

---

## ❓ 遇到问题？

### "Cannot connect to Docker"
**不影响部署**，可以忽略这个错误。

### "Project already linked"
**这是好事**，直接跳到部署步骤。

### "Authentication required"
使用 `supabase login` 重新登录。

---

## ✅ 部署成功的标志

运行测试命令后，应该看到类似输出：
```json
{
  "success": true,
  "response": "你好！很高兴能和你聊聊。",
  "hasKey": true,
  "apiKeyLength": 39
}
```

然后访问网站测试 AI 对话功能即可！

---

**准备好了吗？打开终端，运行第一条命令：**
```bash
supabase login
```



