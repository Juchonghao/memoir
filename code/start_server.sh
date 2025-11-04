#!/bin/bash
# ChatTTS服务启动脚本

echo "=========================================="
echo "ChatTTS本地HTTP服务启动脚本"
echo "=========================================="

# 检查Python版本
python_version=$(python3 --version 2>&1 | awk '{print $2}' | cut -d. -f1,2)
required_version="3.8"

if [ "$(printf '%s\n' "$required_version" "$python_version" | sort -V | head -n1)" = "$required_version" ]; then
    echo "✓ Python版本检查通过: $python_version"
else
    echo "✗ Python版本过低，需要3.8或更高版本，当前版本: $python_version"
    exit 1
fi

# 检查是否安装了依赖
echo "检查依赖包..."
if python3 -c "import flask, ChatTTS, torch, soundfile" 2>/dev/null; then
    echo "✓ 依赖包检查通过"
else
    echo "✗ 缺少依赖包，正在安装..."
    pip3 install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo "✗ 依赖包安装失败"
        exit 1
    fi
    echo "✓ 依赖包安装完成"
fi

# 创建必要的目录
mkdir -p logs
mkdir -p temp

echo "启动ChatTTS服务..."
echo "服务地址: http://localhost:8080"
echo "API文档: http://localhost:8080/api/info"
echo "按 Ctrl+C 停止服务"
echo "=========================================="

# 启动服务
python3 chattts_server.py