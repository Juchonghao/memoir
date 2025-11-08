# 安卓应用API快速部署指南（中国）

## 🚀 最快部署方案

### 方案1：使用Supabase CLI（推荐，最快）

#### 前置要求
1. 安装Supabase CLI
2. 登录Supabase账号
3. 获取项目信息

#### 一键部署脚本

```bash
# 1. 安装Supabase CLI（如果还没有）
npm install -g supabase

# 2. 登录Supabase
supabase login

# 3. 链接项目（首次需要）
supabase link --project-ref your-project-ref

# 4. 部署Edge Functions
bash deploy-edge-functions.sh
```

### 方案2：使用Supabase Dashboard（无需CLI）

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 进入项目 → Edge Functions
3. 手动上传每个函数

## 📦 部署脚本

### deploy-edge-functions.sh

```bash
#!/bin/bash

# 快速部署Edge Functions到Supabase

echo "🚀 开始部署Edge Functions..."

# 检查Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI未安装"
    echo "安装: npm install -g supabase"
    exit 1
fi

# 部署interview-start
echo "📦 部署 interview-start..."
supabase functions deploy interview-start

# 部署memoir-generate
echo "📦 部署 memoir-generate..."
supabase functions deploy memoir-generate

# 部署api-gateway（可选）
echo "📦 部署 api-gateway..."
supabase functions deploy api-gateway

echo "✅ 部署完成！"
echo ""
echo "📝 下一步："
echo "1. 在Supabase Dashboard中设置环境变量"
echo "2. 测试API端点"
echo "3. 将API URL提供给安卓工程师"
```

## 🔧 环境变量配置

在Supabase Dashboard中设置以下环境变量：

### 必需的环境变量

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-api-key
```

### 可选的环境变量

```
OPENAI_BASE_URL=https://api.ppinfra.com/openai
OPENAI_MODEL=deepseek/deepseek-r1
OPENAI_MAX_TOKENS=4000
```

### 设置步骤

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择项目
3. 进入 **Settings** → **Edge Functions**
4. 点击 **Add new secret** 添加每个环境变量

## 🌐 中国网络优化建议

### 1. 使用国内可访问的LLM API

如果OpenAI API在中国访问困难，可以使用：

- **DeepSeek API**（推荐，国内可用）
  - Base URL: `https://api.ppinfra.com/openai`
  - 需要注册DeepSeek账号获取API Key

- **其他国内LLM服务**
  - 通义千问
  - 文心一言
  - 智谱AI

### 2. Supabase访问优化

如果Supabase访问较慢，可以考虑：

- 使用代理服务器
- 使用CDN加速（如果Supabase支持）
- 考虑使用国内云服务商的类似服务

## 📱 提供给安卓工程师的信息

### API端点信息

部署完成后，提供以下信息给安卓工程师：

```json
{
  "baseUrl": "https://your-project.supabase.co/functions/v1",
  "apiKey": "your-anon-key",
  "endpoints": {
    "interviewStart": "/interview-start",
    "memoirGenerate": "/memoir-generate",
    "apiGateway": "/api-gateway"
  }
}
```

### 测试端点

```bash
# 健康检查
curl https://your-project.supabase.co/functions/v1/interview-start \
  -H "Authorization: Bearer your-anon-key" \
  -X POST \
  -d '{"userId":"test","chapter":"童年故里"}'
```

## 🧪 快速测试

### 1. 测试脚本

```bash
# 设置环境变量
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"
export TEST_USER_ID="test-user-id"

# 运行测试
bash test-conversation-flow.sh
```

### 2. Postman测试

导入以下Postman Collection：

```json
{
  "info": {
    "name": "Memoir API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Interview Start - First Call",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{apiKey}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"userId\": \"{{userId}}\",\n  \"chapter\": \"童年故里\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/interview-start",
          "host": ["{{baseUrl}}"],
          "path": ["interview-start"]
        }
      }
    }
  ]
}
```

## 📋 部署检查清单

- [ ] Supabase CLI已安装
- [ ] 已登录Supabase账号
- [ ] 项目已链接
- [ ] Edge Functions已部署
- [ ] 环境变量已设置
- [ ] API端点可访问
- [ ] 测试脚本运行成功
- [ ] 已提供API信息给安卓工程师

## 🐛 常见问题

### 1. 部署失败

**问题**：`supabase functions deploy` 失败

**解决**：
- 检查是否已登录：`supabase login`
- 检查项目是否已链接：`supabase link`
- 检查网络连接

### 2. API调用失败

**问题**：返回401或403错误

**解决**：
- 检查API Key是否正确
- 检查环境变量是否设置
- 检查CORS设置

### 3. LLM API调用失败

**问题**：生成问题失败

**解决**：
- 检查OPENAI_API_KEY是否正确
- 检查OPENAI_BASE_URL是否可访问
- 尝试使用国内LLM服务

## 📞 支持

如有问题，请查看：
- [Supabase文档](https://supabase.com/docs)
- [Edge Functions文档](https://supabase.com/docs/guides/functions)

