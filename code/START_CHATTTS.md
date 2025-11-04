# ChatTTS 服务器启动指南

## ✅ 依赖已安装

所有必需的包都已安装完成：
- ✅ Flask 2.3.3
- ✅ Flask-CORS 4.0.0
- ✅ ChatTTS 0.2.4
- ✅ torch 2.9.0
- ✅ torchaudio 2.9.0
- ✅ soundfile 0.13.1
- ✅ numpy, scipy 等其他依赖

---

## 🚀 启动服务器

### 方法1：直接启动（推荐）

```bash
cd /Users/chonghaoju/memoir-package/code
python chattts_server.py
```

### 方法2：后台运行

```bash
cd /Users/chonghaoju/memoir-package/code
nohup python chattts_server.py > chattts.log 2>&1 &
```

### 方法3：使用启动脚本

```bash
cd /Users/chonghaoju/memoir-package/code
chmod +x start_server.sh
./start_server.sh
```

---

## 📝 启动过程

首次启动时，ChatTTS 会：
1. 下载模型文件（约2GB，只需下载一次）
2. 初始化模型（需要几分钟）
3. 启动HTTP服务器在 `http://localhost:8080`

### 预期输出

```
正在初始化ChatTTS模型...
ChatTTS模型初始化完成!
 * Running on http://127.0.0.1:8080
```

---

## ✅ 验证服务器

启动后，在另一个终端测试：

```bash
curl http://localhost:8080/health
```

应该返回：
```json
{
  "status": "healthy",
  "model_loaded": true
}
```

---

## 🎯 使用说明

### 服务器地址
- **本地访问**：http://localhost:8080
- **API端点**：http://localhost:8080/api/tts_base64

### 前端自动检测
- 前端会自动检测 ChatTTS 服务器是否运行
- 如果可用，使用 ChatTTS（更自然）
- 如果不可用，自动回退到浏览器 TTS

---

## ⚠️ 注意事项

1. **首次启动较慢**：需要下载模型文件，请耐心等待
2. **内存占用**：ChatTTS 需要约 2-4GB 内存
3. **端口占用**：确保 8080 端口未被占用
4. **模型文件**：首次下载后，模型文件会保存在本地

---

## 🐛 常见问题

### 问题1：端口被占用
```bash
# 查找占用端口的进程
lsof -ti:8080

# 杀死进程
kill -9 <进程ID>
```

### 问题2：模型下载失败
```bash
# 手动下载模型（如果需要）
# ChatTTS会自动处理，但网络问题可能需要重试
```

### 问题3：内存不足
- ChatTTS 需要足够内存
- 如果内存不足，可以关闭其他应用
- 或者继续使用浏览器 TTS（功能完全可用）

---

## 💡 提示

- **不启动也可以**：前端会自动回退到浏览器 TTS，功能完全可用
- **启动后更好**：ChatTTS 的语音质量更自然真实
- **后台运行**：可以使用 `nohup` 或 `screen` 在后台运行

---

**现在可以启动服务器了！** 🚀

