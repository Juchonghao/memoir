# 🔒 安全指南 - API 密钥管理

## ⚠️ 重要安全提醒

**永远不要将 API 密钥提交到代码仓库！**

API 密钥是敏感信息，泄露可能导致：
- 未授权的 API 调用
- 产生费用
- 服务被滥用
- 数据泄露

## ✅ 正确的做法

### 1. 使用环境变量

**Supabase Edge Functions:**
- 在 Supabase Dashboard 中配置：Settings → Edge Functions → Secrets
- 或在代码中使用：`Deno.env.get('API_KEY_NAME')`

**本地开发:**
```bash
# 创建 .env 文件（已在 .gitignore 中）
echo "OPENAI_API_KEY=your_key_here" > .env

# 在代码中读取
import { config } from 'dotenv';
config();
const apiKey = process.env.OPENAI_API_KEY;
```

### 2. 使用 .gitignore

确保以下文件已添加到 `.gitignore`：
- `.env`
- `.env.local`
- `*.key`
- `*_secret*`
- `test_*.sh` (如果包含密钥)

### 3. 检查已提交的密钥

如果密钥已经提交到 Git：

```bash
# 1. 立即撤销密钥（在 Google Cloud Console）
# 访问：https://console.cloud.google.com/apis/credentials

# 2. 从 Git 历史中移除
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch test_gemini_models.sh" \
  --prune-empty --tag-name-filter cat -- --all

# 3. 强制推送（谨慎！）
git push origin --force --all
git push origin --force --tags

# 4. 生成新密钥
```

## 🔍 检查清单

在提交代码前，检查：

- [ ] 没有硬编码的 API 密钥
- [ ] 没有在注释中留下密钥
- [ ] `.env` 文件已添加到 `.gitignore`
- [ ] 测试脚本使用环境变量
- [ ] 文档中的示例使用占位符（如 `your_api_key_here`）

## 📝 示例：安全的配置方式

### ❌ 错误示例
```typescript
// 不要这样做！
const apiKey = "AIzaSyBSz-vY8K3qU3_Y0pQoZ5FwX8k5n8yJ4Xk";
```

### ✅ 正确示例
```typescript
// 从环境变量读取
const apiKey = Deno.env.get('OPENAI_API_KEY');
if (!apiKey) {
  throw new Error('OPENAI_API_KEY not configured');
}
```

## 🚨 如果密钥已泄露

1. **立即撤销密钥**
   - Google API: https://console.cloud.google.com/apis/credentials
   - DeepSeek API: 在相应平台撤销

2. **检查使用日志**
   - 查看是否有异常调用
   - 检查费用变化

3. **生成新密钥**
   - 创建新的 API 密钥
   - 更新所有环境变量

4. **清理 Git 历史**
   - 使用 `git filter-branch` 或 `BFG Repo-Cleaner`
   - 或联系 GitHub 支持清理敏感信息

5. **通知团队成员**
   - 如果使用共享密钥，通知所有人更新

## 📚 相关资源

- [GitHub: 从仓库中移除敏感数据](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [Supabase: 环境变量管理](https://supabase.com/docs/guides/functions/secrets)
- [OWASP: API 安全最佳实践](https://owasp.org/www-project-api-security/)

---

**记住：安全第一！永远不要将密钥提交到版本控制！**
