# DeepSeek API 配置指南

## 🔧 环境变量配置

项目已从 Gemini API 切换到 DeepSeek API（OpenAI 兼容接口）。

### 必需的环境变量

在 Supabase Dashboard 中配置以下环境变量：

```bash
OPENAI_API_KEY=your_deepseek_api_key_here
OPENAI_BASE_URL=https://api.ppinfra.com/openai
OPENAI_MODEL=deepseek/deepseek-r1
OPENAI_MAX_TOKENS=512
```

### 配置步骤

1. **登录 Supabase Dashboard**
   - 访问：https://supabase.com/dashboard/project/lafpbfjtbupootnpornv
   - 进入 **Settings** → **Edge Functions** → **Secrets**

2. **添加环境变量**
   - 点击 **Add new secret**
   - 依次添加以下变量：

   | 变量名 | 值 | 说明 |
   |--------|-----|------|
   | `OPENAI_API_KEY` | `your_deepseek_api_key_here` | DeepSeek API密钥 |
   | `OPENAI_BASE_URL` | `https://api.ppinfra.com/openai` | API基础URL |
   | `OPENAI_MODEL` | `deepseek/deepseek-r1` | 使用的模型 |
   | `OPENAI_MAX_TOKENS` | `512` | 最大token数（访谈问题） |

3. **传记生成的额外配置**
   - 传记生成使用更大的 `max_tokens`（4000）
   - 可以在代码中动态调整，或添加额外环境变量

### 使用 Supabase CLI 配置（可选）

```bash
# 设置环境变量
supabase secrets set OPENAI_API_KEY=your_deepseek_api_key_here
supabase secrets set OPENAI_BASE_URL=https://api.ppinfra.com/openai
supabase secrets set OPENAI_MODEL=deepseek/deepseek-r1
supabase secrets set OPENAI_MAX_TOKENS=512
```

## 📝 修改的文件

以下文件已更新为使用 DeepSeek API：

1. **`supabase/functions/ai-interviewer-smart/index.ts`**
   - 更新 `callGemini()` 函数为 OpenAI 兼容格式
   - 使用 `messages` 数组格式
   - 支持 system 和 user 角色

2. **`supabase/functions/generate-biography/index.ts`**
   - 更新传记生成的 API 调用
   - 使用 OpenAI 兼容格式

## 🔄 API 格式对比

### 旧格式（Gemini）
```typescript
{
  contents: [{
    parts: [{ text: prompt }]
  }],
  generationConfig: {
    temperature: 0.8,
    maxOutputTokens: 200
  }
}
```

### 新格式（DeepSeek/OpenAI）
```typescript
{
  model: "deepseek/deepseek-r1",
  messages: [
    { role: "system", content: systemInstruction },
    { role: "user", content: prompt }
  ],
  temperature: 0.8,
  max_tokens: 512,
  top_p: 0.95
}
```

## ✅ 验证配置

配置完成后，可以测试 API：

```bash
curl -X POST https://api.ppinfra.com/openai/v1/chat/completions \
  -H "Authorization: Bearer your_deepseek_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek/deepseek-r1",
    "messages": [
      {"role": "user", "content": "你好"}
    ],
    "max_tokens": 512
  }'
```

## 🚀 部署

配置完成后，重新部署 Edge Functions：

```bash
cd /Users/chonghaoju/memoir-package
supabase functions deploy ai-interviewer-smart
supabase functions deploy generate-biography
```

## 📊 模型信息

- **模型名称**: `deepseek/deepseek-r1`
- **API端点**: `https://api.ppinfra.com/openai/v1/chat/completions`
- **兼容性**: OpenAI API 格式
- **支持功能**: 
  - 对话生成
  - 文本生成
  - System prompt

## 🔍 故障排查

### 问题1: API 密钥错误
- 检查 `OPENAI_API_KEY` 是否正确设置
- 验证密钥格式：应以 `sk_` 开头

### 问题2: 模型不存在
- 确认 `OPENAI_MODEL` 设置为 `deepseek/deepseek-r1`
- 检查 API 端点是否正确

### 问题3: 响应格式错误
- DeepSeek 使用 OpenAI 兼容格式
- 响应结构：`data.choices[0].message.content`

---

**配置完成后，系统将使用 DeepSeek 模型进行对话和传记生成！** 🎉

