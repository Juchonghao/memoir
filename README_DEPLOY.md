# 🚀 快速部署指南 - 让安卓工程师可以测试

## 📋 3步快速部署

### 步骤1: 安装Supabase CLI（如果还没有）

```bash
npm install -g supabase
# 或
brew install supabase/tap/supabase
```

### 步骤2: 登录并链接项目

```bash
# 登录
supabase login

# 链接项目（需要项目引用ID，在Supabase Dashboard中获取）
supabase link --project-ref your-project-ref
```

### 步骤3: 一键部署

```bash
bash deploy-edge-functions.sh
```

## ⚡ 最快方式（如果已有Supabase项目）

```bash
# 1. 登录
supabase login

# 2. 链接项目
supabase link --project-ref your-project-ref

# 3. 部署
supabase functions deploy interview-start
supabase functions deploy memoir-generate
supabase functions deploy api-gateway
```

## 🔧 配置环境变量

在Supabase Dashboard中设置：

1. 进入项目 → **Settings** → **Edge Functions** → **Secrets**
2. 添加以下环境变量：

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-api-key
```

**可选**（如果使用DeepSeek等国内服务）：
```
OPENAI_BASE_URL=https://api.ppinfra.com/openai
OPENAI_MODEL=deepseek/deepseek-r1
```

## 📱 提供给安卓工程师

部署完成后，将以下信息提供给安卓工程师：

### 方式1: 直接提供JSON文件

复制 `API_ENDPOINTS_FOR_ANDROID.json`，替换其中的URL和API Key，发送给安卓工程师。

### 方式2: 提供以下信息

```json
{
  "baseUrl": "https://your-project.supabase.co/functions/v1",
  "apiKey": "your-anon-key",
  "endpoints": {
    "interviewStart": "/interview-start",
    "memoirGenerate": "/memoir-generate"
  }
}
```

### 方式3: 提供文档

发送以下文件给安卓工程师：
- `ANDROID_ENGINEER_QUICK_START.md` - 快速开始指南
- `API_ENDPOINTS_FOR_ANDROID.json` - API端点信息（JSON格式）
- `ANDROID_API_DOCUMENTATION.md` - 完整API文档

## 🧪 测试部署

```bash
# 设置环境变量
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"
export TEST_USER_ID="test-user-id"

# 运行测试
bash test-conversation-flow.sh
```

## 🌐 中国网络优化

### 使用国内LLM服务（推荐）

如果OpenAI API在中国访问困难，使用DeepSeek：

1. 注册 [DeepSeek](https://platform.deepseek.com/)
2. 获取API Key
3. 设置环境变量：
   ```
   OPENAI_API_KEY=your-deepseek-api-key
   OPENAI_BASE_URL=https://api.ppinfra.com/openai
   OPENAI_MODEL=deepseek/deepseek-r1
   ```

### Supabase访问

如果Supabase访问较慢：
- 考虑使用代理
- 或使用国内云服务商的类似服务

## 📚 相关文档

- **快速部署**: `QUICK_DEPLOY_FOR_ANDROID.md`
- **安卓工程师指南**: `ANDROID_ENGINEER_QUICK_START.md`
- **完整API文档**: `ANDROID_API_DOCUMENTATION.md`
- **对话流程测试**: `CONVERSATION_FLOW_TEST.md`
- **API端点JSON**: `API_ENDPOINTS_FOR_ANDROID.json`

## ✅ 部署检查清单

- [ ] Supabase CLI已安装
- [ ] 已登录Supabase
- [ ] 项目已链接
- [ ] Edge Functions已部署
- [ ] 环境变量已设置
- [ ] API测试通过
- [ ] 已提供API信息给安卓工程师

## 🆘 遇到问题？

1. **部署失败**: 检查网络连接和登录状态
2. **API调用失败**: 检查环境变量和API Key
3. **LLM调用失败**: 检查LLM API Key和Base URL

查看详细文档：`QUICK_DEPLOY_FOR_ANDROID.md`

