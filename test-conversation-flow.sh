#!/bin/bash
API_URL="https://lafpbfjtbupootnpornv.supabase.co/functions/v1/ai-interviewer-smart"
AUTH_HEADER="Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZnBiZmp0YnVwb290bnBvcm52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MzIxMzgsImV4cCI6MjA3NDAwODEzOH0.NdxDvO17UX2Cya0Uz3ECWkR3g5nEbpIcu5ISXPTvaQ8"
USER_ID="test_user_$(date +%s)"
CHAPTER="童年故里"
SESSION_ID="session_$(date +%s)"

echo "=========================================="
echo "开始对话流程测试"
echo "用户ID: $USER_ID"
echo "章节: $CHAPTER"
echo "会话ID: $SESSION_ID"
echo "=========================================="

# 第1轮：获取初始问题
echo -e "\n【第1轮 - 获取初始问题】"
RESPONSE1=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d "{
    \"action\": \"getNextQuestion\",
    \"userId\": \"$USER_ID\",
    \"chapter\": \"$CHAPTER\",
    \"sessionId\": \"$SESSION_ID\"
  }")
echo "Response: $RESPONSE1"
QUESTION1=$(echo "$RESPONSE1" | grep -oP '"question":"[^"]*"' | head -1 | sed 's/"question":"//; s/"$//')
ROUND1=$(echo "$RESPONSE1" | grep -oP '"roundNumber":\K[0-9]+')
echo "AI问题: $QUESTION1"
echo "轮次: $ROUND1"

# 保存第1轮问题到数据库
curl -s -X POST "$API_URL" -H "Content-Type: application/json" -H "$AUTH_HEADER" \
  -d "{\"action\": \"saveQuestionOnly\", \"userId\": \"$USER_ID\", \"chapter\": \"$CHAPTER\", \"sessionId\": \"$SESSION_ID\", \"roundNumber\": $ROUND1, \"question\": \"$QUESTION1\"}" > /dev/null

sleep 2

# 第1轮：保存回答并获取第2个问题
echo -e "\n【第1轮 - 回答并获取下一个问题】"
USER_ANSWER1="我出生在江苏南京，家里有爷爷奶奶、父母还有一个妹妹。我们住在鼓楼区的一个老四合院里，那时候邻里关系特别好，大家都像一家人一样。"
RESPONSE2=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d "{
    \"action\": \"saveAnswer\",
    \"userId\": \"$USER_ID\",
    \"chapter\": \"$CHAPTER\",
    \"sessionId\": \"$SESSION_ID\",
    \"roundNumber\": $ROUND1,
    \"userAnswer\": \"$USER_ANSWER1\"
  }")
echo "Response: $RESPONSE2"
QUESTION2=$(echo "$RESPONSE2" | grep -oP '"nextQuestion":"[^"]*"' | sed 's/"nextQuestion":"//; s/"$//')
ROUND2=$(echo "$RESPONSE2" | grep -oP '"nextRoundNumber":\K[0-9]+')
echo "用户回答: $USER_ANSWER1"
echo "AI问题: $QUESTION2"
echo "轮次: $ROUND2"

sleep 2

# 第2轮：回答并获取第3个问题
echo -e "\n【第2轮 - 回答并获取下一个问题】"
USER_ANSWER2="我印象最深的是爷爷。他是个老师，每天晚上都会给我们讲故事，教我们认字。他特别和蔼，从来不发脾气，总是耐心地解答我的各种问题。"
RESPONSE3=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d "{
    \"action\": \"saveAnswer\",
    \"userId\": \"$USER_ID\",
    \"chapter\": \"$CHAPTER\",
    \"sessionId\": \"$SESSION_ID\",
    \"roundNumber\": $ROUND2,
    \"userAnswer\": \"$USER_ANSWER2\"
  }")
echo "Response: $RESPONSE3"
QUESTION3=$(echo "$RESPONSE3" | grep -oP '"nextQuestion":"[^"]*"' | sed 's/"nextQuestion":"//; s/"$//')
ROUND3=$(echo "$RESPONSE3" | grep -oP '"nextRoundNumber":\K[0-9]+')
echo "用户回答: $USER_ANSWER2"
echo "AI问题: $QUESTION3"
echo "轮次: $ROUND3"

sleep 2

# 第3轮：回答并获取第4个问题
echo -e "\n【第3轮 - 回答并获取下一个问题】"
USER_ANSWER3="爷爷给我讲过很多历史故事，比如三国演义、水浒传。我记得有一次他讲到诸葛亮草船借箭，我特别佩服诸葛亮的智慧。从那时起我就特别喜欢读书，尤其是历史书。"
RESPONSE4=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d "{
    \"action\": \"saveAnswer\",
    \"userId\": \"$USER_ID\",
    \"chapter\": \"$CHAPTER\",
    \"sessionId\": \"$SESSION_ID\",
    \"roundNumber\": $ROUND3,
    \"userAnswer\": \"$USER_ANSWER3\"
  }")
echo "Response: $RESPONSE4"
QUESTION4=$(echo "$RESPONSE4" | grep -oP '"nextQuestion":"[^"]*"' | sed 's/"nextQuestion":"//; s/"$//')
ROUND4=$(echo "$RESPONSE4" | grep -oP '"nextRoundNumber":\K[0-9]+')
echo "用户回答: $USER_ANSWER3"
echo "AI问题: $QUESTION4"
echo "轮次: $ROUND4"

echo -e "\n=========================================="
echo "对话流程测试完成"
echo "=========================================="
echo -e "\n【测试要点检查】"
echo "✓ AI是否能基于用户回答生成相关问题？"
echo "  - 第1轮提到：南京鼓楼、四合院、爷爷奶奶"
echo "  - 第2轮提到：爷爷是老师、讲故事"
echo "  - 第3轮提到：三国演义、诸葛亮、喜欢读书"
echo ""
echo "✓ 问题是否具有连贯性和针对性？"
echo "✓ 问题是否避免重复？"
echo "✓ 语气是否温暖自然？"
