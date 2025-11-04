#!/bin/bash
# 语音功能代码验证脚本

echo "=== AI记者语音功能代码验证 ==="
echo ""

# 检查源代码文件是否存在
echo "1. 检查源代码文件..."
if [ -f "src/hooks/useVoiceRecognition.ts" ]; then
    echo "   ✓ useVoiceRecognition.ts 存在"
else
    echo "   ✗ useVoiceRecognition.ts 缺失"
fi

if [ -f "src/hooks/useSpeechSynthesis.ts" ]; then
    echo "   ✓ useSpeechSynthesis.ts 存在"
else
    echo "   ✗ useSpeechSynthesis.ts 缺失"
fi

# 检查InterviewPage是否导入了语音hooks
echo ""
echo "2. 检查InterviewPage集成..."
if grep -q "useVoiceRecognition" src/pages/InterviewPage.tsx; then
    echo "   ✓ useVoiceRecognition 已导入"
else
    echo "   ✗ useVoiceRecognition 未导入"
fi

if grep -q "useSpeechSynthesis" src/pages/InterviewPage.tsx; then
    echo "   ✓ useSpeechSynthesis 已导入"
else
    echo "   ✗ useSpeechSynthesis 未导入"
fi

# 检查关键UI元素
echo ""
echo "3. 检查关键UI元素..."
if grep -q "Mic" src/pages/InterviewPage.tsx; then
    echo "   ✓ 麦克风图标已引入"
else
    echo "   ✗ 麦克风图标缺失"
fi

if grep -q "Volume2" src/pages/InterviewPage.tsx; then
    echo "   ✓ 音量图标已引入"
else
    echo "   ✗ 音量图标缺失"
fi

if grep -q "handleVoiceToggle" src/pages/InterviewPage.tsx; then
    echo "   ✓ 语音切换函数已实现"
else
    echo "   ✗ 语音切换函数缺失"
fi

# 检查编译输出
echo ""
echo "4. 检查编译输出..."
if [ -d "dist" ]; then
    echo "   ✓ dist目录存在"
    if [ -f "dist/index.html" ]; then
        echo "   ✓ index.html已生成"
    fi
else
    echo "   ✗ dist目录不存在"
fi

# 检查编译后的JS是否包含语音API
echo ""
echo "5. 检查编译后的代码..."
if grep -q "SpeechRecognition" dist/assets/*.js; then
    echo "   ✓ SpeechRecognition API已编译"
else
    echo "   ✗ SpeechRecognition API未找到"
fi

if grep -q "speechSynthesis" dist/assets/*.js; then
    echo "   ✓ speechSynthesis API已编译"
else
    echo "   ✗ speechSynthesis API未找到"
fi

# 检查部署状态
echo ""
echo "6. 检查部署状态..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://0kcpiov9wof8.space.minimaxi.com)
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✓ 网站已成功部署 (HTTP $HTTP_CODE)"
else
    echo "   ✗ 网站部署异常 (HTTP $HTTP_CODE)"
fi

echo ""
echo "=== 验证完成 ==="
echo ""
echo "注意: 此脚本仅验证代码结构和编译状态"
echo "实际功能需要在浏览器中手动测试"
