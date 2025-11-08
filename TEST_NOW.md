# 🧪 立即测试API

## ✅ 部署状态

Edge Functions已成功部署到：
- **项目ID**: `lafpbfjtbupootnpornv`
- **Base URL**: `https://lafpbfjtbupootnpornv.supabase.co/functions/v1`

## 🚀 快速测试

### 1. 设置环境变量

```bash
export SUPABASE_URL="https://lafpbfjtbupootnpornv.supabase.co"
export SUPABASE_ANON_KEY="f0792984a8ea66e257abb9db598a4d4432c08db6a5554fe44aeb2c6b2700775f"
```

### 2. 运行测试

```bash
bash test-conversation-flow.sh
```

## 📝 测试结果示例

成功响应示例：

```json
{
  "success": true,
  "data": {
    "question": "请描述一下您的童年生活环境，比如住在哪里？家里有哪些人？",
    "sessionId": "session_1762595383121_9a4ecdykc",
    "roundNumber": 1,
    "totalRounds": 1,
    "missingThemes": ["家庭背景", "童年趣事", "成长环境", "早期教育", "故乡印象"],
    "coverage": 0,
    "suggestions": "建议补充以下内容：家庭背景、童年趣事、成长环境"
  }
}
```

## 🔧 重要提示

### 1. userId格式

**必须使用有效的UUID格式**，例如：
- ✅ `550e8400-e29b-41d4-a716-446655440000`
- ❌ `test-user-123` (无效)

测试脚本会自动生成UUID，无需手动设置。

### 2. 环境变量配置

在Supabase Dashboard中设置以下环境变量：

1. 进入项目：https://supabase.com/dashboard/project/lafpbfjtbupootnpornv
2. Settings → Edge Functions → Secrets
3. 添加：
   - `SUPABASE_URL`: `https://lafpbfjtbupootnpornv.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY`: (在Settings → API中获取)
   - `OPENAI_API_KEY`: (你的LLM API密钥)

### 3. API端点

- **Interview Start**: `https://lafpbfjtbupootnpornv.supabase.co/functions/v1/interview-start`
- **Memoir Generate**: `https://lafpbfjtbupootnpornv.supabase.co/functions/v1/memoir-generate`
- **API Gateway**: `https://lafpbfjtbupootnpornv.supabase.co/functions/v1/api-gateway`

## 📱 提供给安卓工程师

### API信息

```json
{
  "baseUrl": "https://lafpbfjtbupootnpornv.supabase.co/functions/v1",
  "apiKey": "f0792984a8ea66e257abb9db598a4d4432c08db6a5554fe44aeb2c6b2700775f",
  "endpoints": {
    "interviewStart": "/interview-start",
    "memoirGenerate": "/memoir-generate",
    "apiGateway": "/api-gateway"
  }
}
```

### 测试curl命令

```bash
# 测试interview-start
curl -X POST "https://lafpbfjtbupootnpornv.supabase.co/functions/v1/interview-start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer f0792984a8ea66e257abb9db598a4d4432c08db6a5554fe44aeb2c6b2700775f" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "chapter": "童年故里"
  }'
```

## ⚠️ 常见问题

### 1. 返回错误：invalid input syntax for type uuid

**原因**: userId不是有效的UUID格式

**解决**: 使用有效的UUID，测试脚本会自动生成

### 2. 返回错误：Database error

**原因**: 可能是环境变量未设置或数据库连接问题

**解决**: 
- 检查Supabase Dashboard中的环境变量
- 确认数据库表已创建

### 3. LLM API调用失败

**原因**: OPENAI_API_KEY未设置或无效

**解决**: 在Supabase Dashboard中设置OPENAI_API_KEY

## ✅ 下一步

1. ✅ Edge Functions已部署
2. ⏳ 设置环境变量（在Supabase Dashboard中）
3. ⏳ 测试API端点
4. ⏳ 提供给安卓工程师

