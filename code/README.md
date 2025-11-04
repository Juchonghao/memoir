# ChatTTS本地HTTP服务

这是一个基于ChatTTS的本地文本转语音HTTP服务，提供RESTful API接口。

## 功能特性

- 🎤 高质量文本转语音
- 🎛️ 支持多种音色选择
- ⚡ 可调节语速、音调、音量
- 🌐 HTTP API接口
- 📁 支持音频文件下载和base64编码返回
- 🔧 简单易用的启动脚本

## 系统要求

- Python 3.8+
- 4GB+ 内存
- 2GB+ 硬盘空间（用于模型文件）

## 快速开始

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

### 2. 启动服务

**Linux/macOS:**
```bash
chmod +x start_server.sh
./start_server.sh
```

**Windows:**
```cmd
start_server.bat
```

**手动启动:**
```bash
python chattts_server.py
```

### 3. 访问服务

- 服务地址: http://localhost:8080
- API文档: http://localhost:8080/api/info
- 健康检查: http://localhost:8080/health

## API接口

### 健康检查

```
GET /health
```

返回服务状态和模型加载情况。

### 获取音色列表

```
GET /api/speakers
```

返回可用的音色列表。

### 文本转语音（文件下载）

```
POST /api/tts
Content-Type: application/json

{
    "text": "你好，这是一个测试",
    "speaker": "female-shaonv",
    "speed": 1.0,
    "pitch": 0,
    "volume": 1.0
}
```

### 文本转语音（Base64返回）

```
POST /api/tts_base64
Content-Type: application/json

{
    "text": "你好，这是一个测试",
    "speaker": "female-shaonv",
    "speed": 1.0,
    "pitch": 0,
    "volume": 1.0
}
```

## 参数说明

| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| text | string | 是 | - | 要转换的文本 |
| speaker | string | 否 | female-shaonv | 音色ID |
| speed | float | 否 | 1.0 | 语速 (0.5-2.0) |
| pitch | int | 否 | 0 | 音调 (-12到12) |
| volume | float | 否 | 1.0 | 音量 (0.1-2.0) |

## 可用音色

| 音色ID | 名称 | 描述 |
|--------|------|------|
| female-shaonv | 女声-少女 | 清甜少女音 |
| female-yujie | 女声-御姐 | 成熟御姐音 |
| male-qingshu | 男声-青叔 | 年轻男性音 |
| male-dashu | 男声-大叔 | 成熟男性音 |
| audiobook_female_1 | 女声- audiobook | 适合朗读的女声 |
| audiobook_male_1 | 男声- audiobook | 适合朗读的男声 |

## 使用示例

### Python客户端示例

```python
import requests
import base64

# 文本转语音
def tts_request(text, speaker="female-shaonv"):
    url = "http://localhost:8080/api/tts_base64"
    data = {
        "text": text,
        "speaker": speaker,
        "speed": 1.0,
        "pitch": 0,
        "volume": 1.0
    }
    
    response = requests.post(url, json=data)
    if response.status_code == 200:
        result = response.json()
        audio_base64 = result['audio_base64']
        
        # 保存音频文件
        audio_data = base64.b64decode(audio_base64)
        with open('output.wav', 'wb') as f:
            f.write(audio_data)
        print("音频文件已保存为 output.wav")
    else:
        print(f"请求失败: {response.status_code}")

# 使用示例
tts_request("你好，欢迎使用ChatTTS服务！")
```

### cURL示例

```bash
# 基础文本转语音
curl -X POST http://localhost:8080/api/tts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "你好，这是一个测试",
    "speaker": "female-shaonv"
  }' \
  --output output.wav

# 使用不同音色
curl -X POST http://localhost:8080/api/tts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "这是男声测试",
    "speaker": "male-dashu",
    "speed": 1.2,
    "pitch": -2
  }'
```

## 配置说明

### 环境变量

- `CHATTTS_MODEL_PATH`: ChatTTS模型路径（可选）
- `HTTP_HOST`: HTTP服务主机地址（默认: 0.0.0.0）
- `HTTP_PORT`: HTTP服务端口（默认: 8080）

### 模型下载

首次运行时会自动下载ChatTTS模型文件到 `./ChatTTS/asset` 目录。

如果下载失败，可以手动下载：
1. 访问ChatTTS官方仓库
2. 下载预训练模型
3. 解压到 `./ChatTTS/asset` 目录

## 故障排除

### 常见问题

1. **模型初始化失败**
   - 检查网络连接（首次运行需要下载模型）
   - 确保有足够的磁盘空间（2GB+）
   - 检查Python版本（需要3.8+）

2. **依赖包安装失败**
   - 更新pip: `pip install --upgrade pip`
   - 安装PyTorch: `pip install torch torchaudio`
   - 使用国内镜像源: `pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple/`

3. **服务启动失败**
   - 检查端口8080是否被占用
   - 检查防火墙设置
   - 查看错误日志

### 日志文件

服务运行日志保存在 `logs/` 目录下。

### 性能优化

- 使用GPU加速（如果可用）
- 调整批处理大小
- 监控内存使用情况

## 许可证

本项目基于MIT许可证开源。

## 贡献

欢迎提交Issue和Pull Request来改进这个项目。

## 更新日志

### v1.0.0
- 初始版本发布
- 支持基础文本转语音功能
- 提供多种音色选择
- 支持参数调节
- HTTP API接口