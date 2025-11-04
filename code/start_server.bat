@echo off
chcp 65001 >nul
echo ==========================================
echo ChatTTS本地HTTP服务启动脚本 (Windows)
echo ==========================================

REM 检查Python版本
python --version >nul 2>&1
if errorlevel 1 (
    echo ✗ 未找到Python，请先安装Python 3.8或更高版本
    pause
    exit /b 1
)

for /f "tokens=2" %%i in ('python --version 2^>^&1') do set python_version=%%i
echo ✓ Python版本: %python_version%

REM 检查是否安装了依赖
echo 检查依赖包...
python -c "import flask, ChatTTS, torch, soundfile" >nul 2>&1
if errorlevel 1 (
    echo ✗ 缺少依赖包，正在安装...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo ✗ 依赖包安装失败
        pause
        exit /b 1
    )
    echo ✓ 依赖包安装完成
) else (
    echo ✓ 依赖包检查通过
)

REM 创建必要的目录
if not exist logs mkdir logs
if not exist temp mkdir temp

echo 启动ChatTTS服务...
echo 服务地址: http://localhost:8080
echo API文档: http://localhost:8080/api/info
echo 按 Ctrl+C 停止服务
echo ==========================================

REM 启动服务
python chattts_server.py

pause