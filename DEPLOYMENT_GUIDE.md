# Edge Functions 部署指南

## 📊 当前状态

### ✅ 已完成
- Supabase 项目配置完成（项目ID: lafpbfjtbupootnpornv）
- Gemini API Key 已配置（长度39字符）
- 所有前端应用已部署并连接到数据库
- 本地 AI 访谈系统工作正常

### 🔧 需要重新部署的 Edge Functions
由于 Gemini API 模型更新，以下函数需要重新部署：

1. **ai-interviewer-smart** - 智能对话系统（已修复使用 gemini-2.0-flash-exp）
2. **generate-biography** - 传记生成（已修复使用 gemini-2.0-flash-exp）

## 🚀 部署步骤

### 方法1：使用 Supabase CLI（推荐）

#### 1. 安装 Supabase CLI
```bash
# macOS
brew install supabase/tap/supabase

# 或使用 npm
npm install -g supabase
```

#### 2. 登录 Supabase
```bash
cd /Users/chonghaoju/memoir-package
supabase login
```

#### 3. 链接到项目
```bash
supabase link --project-ref lafpbfjtbupootnpornv
```

#### 4. 部署 Edge Functions
```bash
# 部署智能对话系统
supabase functions deploy ai-interviewer-smart

# 部署传记生成系统
supabase functions deploy generate-biography
```

#### 5. 验证部署
```bash
# 测试 ai-interviewer-smart
supabase functions invoke ai-interviewer-smart \
  --data '{"action":"testGemini"}'

# 测试 generate-biography
supabase functions invoke generate-biography \
  --data '{"test":true}'
```

### 方法2：通过 Supabase Dashboard

1. 访问 https://supabase.com/dashboard/project/lafpbfjtbupootnpornv
2. 点击左侧菜单 "Edge Functions"
3. 对于每个函数：
   - 点击函数名称
   - 点击 "Deploy new version"
   - 复制对应函数的代码内容粘贴进去
   - 点击 "Deploy"

**ai-interviewer-smart 函数代码路径：**
`/Users/chonghaoju/memoir-package/supabase/functions/ai-interviewer-smart/index.ts`

**generate-biography 函数代码路径：**
`/Users/chonghaoju/memoir-package/supabase/functions/generate-biography/index.ts`

## 🔍 测试部署

部署完成后，运行以下测试确认功能正常：

```bash
# 1. 测试 Gemini API 连接
curl -X POST https://lafpbfjtbupootnpornv.supabase.co/functions/v1/ai-interviewer-smart \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZnBiZmp0YnVwb290bnBvcm52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MzIxMzgsImV4cCI6MjA3NDAwODEzOH0.NdxDvO17UX2Cya0Uz3ECWkR3g5nEbpIcu5ISXPTvaQ8" \
  -d '{"action":"testGemini"}'

# 预期输出：{"success":true,"response":"...","hasKey":true,"apiKeyLength":39}
```

## 📝 更新日志

### 2025-11-02
- 修复 Gemini API 模型名称
  - 旧模型：gemini-pro (已弃用)
  - 新模型：gemini-2.0-flash-exp (最新实验版)
- 更新 ai-interviewer-smart 函数
- 更新 generate-biography 函数
- 添加完整的错误处理和日志

## 🎯 部署后验证清单

部署完成后，请验证以下功能：

### 1. AI 对话功能
- [ ] 访问任一部署网站
- [ ] 注册/登录账户
- [ ] 选择"童年故里"章节
- [ ] 开始对话，AI 应该能够：
  - 生成自然的开场问题
  - 根据回答进行深入追问
  - 不重复之前的问题
  - 保持对话连贯性

### 2. 传记生成功能
- [ ] 完成3-5轮访谈
- [ ] 点击"完成访谈"
- [ ] 选择文风（莫言/刘慈欣/余秋雨）
- [ ] 等待传记生成（10-30秒）
- [ ] 查看生成的传记内容

### 3. 备用机制
如果 Gemini API 仍有问题，系统会自动降级到：
- 本地智能回复系统（基于关键词分析）
- 默认问题库（确保基本可用）

## 🐛 故障排查

### 问题1：Gemini API 返回 404
**原因**：模型名称不正确或 API 端点错误
**解决**：确认使用 `gemini-2.0-flash-exp` 模型

### 问题2：返回 "invalid candidate structure"
**原因**：API 响应格式发生变化
**解决**：检查 Edge Function 中的响应解析代码

### 问题3：401 Unauthorized
**原因**：Gemini API Key 未配置或无效
**解决**：
1. 访问 Supabase Dashboard
2. Settings → Edge Functions → Environment Variables
3. 确认 GEMINI_API_KEY 存在且有效

## 📞 支持

如果遇到问题，请检查：
1. Supabase Dashboard 的 Edge Functions 日志
2. 浏览器开发者工具的 Console 和 Network 标签
3. Edge Functions 的环境变量配置

---

**最后更新**: 2025-11-02
**项目路径**: /Users/chonghaoju/memoir-package

