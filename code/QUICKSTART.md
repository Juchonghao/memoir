# 快速启动指南

## 🚀 一键启动

### Linux/macOS
```bash
cd code
chmod +x start_server.sh
./start_server.sh
```

### Windows
```cmd
cd code
start_server.bat
```

### 手动启动
```bash
cd code
pip install -r requirements.txt
python chattts_server.py
```

## 🧪 测试服务

在另一个终端窗口中运行测试：
```bash
cd code
python test_service.py
```

## 📝 简单使用

### Python客户端示例
```python
from client_example import ChatTTSClient

client = ChatTTSClient()

# 文本转语音
success, result = client.text_to_speech(
    text="你好，欢迎使用ChatTTS！",
    speaker="female-shaonv",
    output_file="hello.wav"
)

if success:
    print("语音生成成功！")
else:
    print(f"生成失败: {result}")
```

### 命令行使用
```bash
# 基础使用
python client_example.py --text "你好，这是测试"

# 指定音色和参数
python client_example.py \
    --text "这是不同音色的测试" \
    --speaker "male-dashu" \
    --speed 1.2 \
    --pitch -2

# 列出可用音色
python client_example.py --list-speakers

# 运行完整演示
python client_example.py --demo
```

## 📚 API接口

- `GET /health` - 健康检查
- `GET /api/info` - 服务信息
- `GET /api/speakers` - 音色列表
- `POST /api/tts` - 文本转语音（文件下载）
- `POST /api/tts_base64` - 文本转语音（base64返回）

## 🔧 常见问题

1. **服务启动失败**
   - 检查Python版本（需要3.8+）
   - 安装依赖：`pip install -r requirements.txt`
   - 检查端口8080是否被占用

2. **模型下载失败**
   - 检查网络连接
   - 手动下载模型到 `./ChatTTS/asset` 目录

3. **语音生成失败**
   - 检查文本内容是否为空
   - 确认参数范围正确
   - 查看服务日志

## 📖 更多信息

详细文档请查看 [README.md](README.md)