# 📊 如何查看 Supabase Edge Functions 日志

## 🚀 快速访问

**直接链接**：
```
https://supabase.com/dashboard/project/lafpbfjtbupootnpornv/logs/edge-functions
```

## 📋 查看步骤

### 1. 登录 Supabase Dashboard
- 访问：https://supabase.com/dashboard
- 选择项目：`lafpbfjtbupootnpornv`

### 2. 打开日志页面
- 左侧菜单 → **Logs** → **Edge Functions**
- 或者直接访问上面的链接

### 3. 选择函数
在函数列表中选择：
- `interview-start` - AI 对话函数
- `memoir-generate` - 回忆录生成函数

### 4. 过滤日志
在搜索框中输入关键词：
- `timeout` - 查找超时相关日志
- `[ERROR]` - 查找所有错误
- `[LLM]` - 查看 LLM 调用详情
- `[THEME]` - 查看主题检测日志
- `[QUESTION]` - 查看问题生成日志
- `[REQUEST]` - 查看请求处理时间

## 🔍 诊断超时问题

### 查看关键日志标记

1. **请求开始**：
   ```
   [REQUEST] POST /functions/v1/interview-start - 开始处理请求
   ```

2. **LLM 调用**：
   ```
   [LLM] 开始调用 LLM API, timeout=20000ms
   [LLM] 收到响应, status=200, 耗时=3500ms
   ```

3. **主题检测**：
   ```
   [THEME] 开始检测缺失主题
   [THEME] 主题检测完成, 耗时=3800ms
   ```

4. **问题生成**：
   ```
   [QUESTION] 开始生成问题
   [QUESTION] 问题生成完成, 耗时=3200ms
   ```

5. **请求完成**：
   ```
   [REQUEST] 请求处理完成, 总耗时=7500ms
   ```

### 常见超时原因

1. **LLM API 响应慢**
   - 查看 `[LLM]` 日志
   - 如果耗时超过 20-25 秒，可能是 LLM API 服务慢

2. **总耗时超过 60 秒**
   - Supabase Edge Functions 默认超时是 60 秒
   - 查看 `[REQUEST] 请求处理完成` 的总耗时

3. **多次 LLM 调用**
   - `interview-start` 可能调用 2 次 LLM（主题分析 + 问题生成）
   - 如果每次 25 秒，总共可能超过 50 秒

### 优化建议

如果看到超时：
1. **减少 LLM 调用次数**：跳过主题分析的 LLM 调用，直接使用关键词匹配
2. **缩短超时时间**：主题分析使用 15 秒，问题生成使用 20 秒
3. **优化 prompt**：减少 prompt 长度，提高响应速度

## 📝 日志示例

### 正常情况
```
[REQUEST] POST /functions/v1/interview-start - 开始处理请求
[REQUEST] 参数: userId=xxx, chapter=童年故里, sessionId=new
[THEME] 开始检测缺失主题, 历史记录数=0
[THEME] 使用关键词匹配备用方案
[THEME] ✓ 关键词匹配识别到主题: 家庭背景, 童年趣事
[THEME] 主题检测完成, 耗时=50ms, 缺失主题数=8, 覆盖率=20%
[QUESTION] 开始生成问题
[LLM] 开始调用 LLM API, timeout=20000ms
[LLM] 收到响应, status=200, 耗时=3500ms
[LLM] 成功获取响应, 内容长度=45, 总耗时=3500ms
[QUESTION] 问题生成完成, 耗时=3600ms, 问题长度=45
[REQUEST] 请求处理完成, 总耗时=3800ms
```

### 超时情况
```
[REQUEST] POST /functions/v1/interview-start - 开始处理请求
[THEME] 开始检测缺失主题
[LLM] 开始调用 LLM API, timeout=15000ms
[LLM] 请求超时 (15000ms)
[LLM] 请求被中止 (超时), 耗时=15000ms
[THEME] LLM分析出错: LLM API request timeout after 15000ms
[THEME] 使用关键词匹配备用方案
[QUESTION] 开始生成问题
[LLM] 开始调用 LLM API, timeout=20000ms
[LLM] 请求超时 (20000ms)
[ERROR] 请求处理失败, 总耗时=35000ms, error=LLM API request timeout after 20000ms
```

## 🔗 相关链接

- [Supabase Dashboard](https://supabase.com/dashboard/project/lafpbfjtbupootnpornv)
- [Edge Functions 日志](https://supabase.com/dashboard/project/lafpbfjtbupootnpornv/logs/edge-functions)
- [项目设置](https://supabase.com/dashboard/project/lafpbfjtbupootnpornv/settings/edge-functions)

