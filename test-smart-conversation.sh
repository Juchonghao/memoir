#!/bin/bash
API_URL="https://lafpbfjtbupootnpornv.supabase.co/functions/v1/ai-interviewer-smart"
AUTH_HEADER="Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZnBiZmp0YnVwb290bnBvcm52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MzIxMzgsImV4cCI6MjA3NDAwODEzOH0.NdxDvO17UX2Cya0Uz3ECWkR3g5nEbpIcu5ISXPTvaQ8"
USER_ID="00000000-0000-0000-0000-000000000001" # 使用UUID格式
CHAPTER="童年故里"
SESSION_ID="00000000-0000-0000-0000-$(date +%N | head -c 12)"

echo "=== 智能对话测试 ==="
echo "用户ID: $USER_ID"
echo "章节: $CHAPTER"

# 第1轮：获取初始问题
echo -e "\n【第1轮】获取初始问题..."
RESP1=$(curl -s -X POST "$API_URL" -H "Content-Type: application/json" -H "$AUTH_HEADER" \
  -d "{\"action\":\"getNextQuestion\",\"userId\":\"$USER_ID\",\"chapter\":\"$CHAPTER\",\"sessionId\":\"$SESSION_ID\"}")
echo "$RESP1" | python3 -m json.tool 2>/dev/null || echo "$RESP1"

QUESTION1=$(echo "$RESP1" | grep -oP '"question":"[^"]*"' | sed 's/"question":"//; s/"$//' | sed 's/\\n/ /g')
ROUND1=$(echo "$RESP1" | grep -oP '"roundNumber":\K[0-9]+')
echo "AI问题1: $QUESTION1"

sleep 2

# 第1轮回答
echo -e "\n【第1轮】用户回答..."
USER_ANS1="我出生在江苏南京，家里有爷爷奶奶、父母还有妹妹。我们住在鼓楼区的一个老四合院里，那时候邻里关系特别好。"
echo "用户: $USER_ANS1"

RESP2=$(curl -s -X POST "$API_URL" -H "Content-Type: application/json" -H "$AUTH_HEADER" \
  -d "{\"action\":\"saveAnswer\",\"userId\":\"$USER_ID\",\"chapter\":\"$CHAPTER\",\"sessionId\":\"$SESSION_ID\",\"roundNumber\":$ROUND1,\"userAnswer\":\"$USER_ANS1\"}")
echo "$RESP2" | python3 -m json.tool 2>/dev/null || echo "$RESP2"

QUESTION2=$(echo "$RESP2" | grep -oP '"nextQuestion":"[^"]*"' | sed 's/"nextQuestion":"//; s/"$//' | sed 's/\\n/ /g')
ROUND2=$(echo "$RESP2" | grep -oP '"nextRoundNumber":\K[0-9]+')
echo "AI问题2: $QUESTION2"

sleep 2

# 第2轮回答
echo -e "\n【第2轮】用户回答..."
USER_ANS2="我印象最深的是爷爷。他是个老师，每天晚上都会给我们讲故事，教我们认字。他特别和蔼可亲。"
echo "用户: $USER_ANS2"

RESP3=$(curl -s -X POST "$API_URL" -H "Content-Type: application/json" -H "$AUTH_HEADER" \
  -d "{\"action\":\"saveAnswer\",\"userId\":\"$USER_ID\",\"chapter\":\"$CHAPTER\",\"sessionId\":\"$SESSION_ID\",\"roundNumber\":$ROUND2,\"userAnswer\":\"$USER_ANS2\"}")
echo "$RESP3" | python3 -m json.tool 2>/dev/null || echo "$RESP3"

QUESTION3=$(echo "$RESP3" | grep -oP '"nextQuestion":"[^"]*"' | sed 's/"nextQuestion":"//; s/"$//' | sed 's/\\n/ /g')
echo "AI问题3: $QUESTION3"

sleep 2

# 第3轮回答
echo -e "\n【第3轮】用户回答..."
USER_ANS3="爷爷给我讲过很多历史故事，比如三国演义、水浒传。我记得有一次他讲诸葛亮草船借箭，我特别佩服诸葛亮的智慧。从那时起我就特别喜欢读书。"
echo "用户: $USER_ANS3"

RESP4=$(curl -s -X POST "$API_URL" -H "Content-Type: application/json" -H "$AUTH_HEADER" \
  -d "{\"action\":\"saveAnswer\",\"userId\":\"$USER_ID\",\"chapter\":\"$CHAPTER\",\"sessionId\":\"$SESSION_ID\",\"roundNumber\":3,\"userAnswer\":\"$USER_ANS3\"}")
echo "$RESP4" | python3 -m json.tool 2>/dev/null || echo "$RESP4"

QUESTION4=$(echo "$RESP4" | grep -oP '"nextQuestion":"[^"]*"' | sed 's/"nextQuestion":"//; s/"$//' | sed 's/\\n/ /g')
echo "AI问题4: $QUESTION4"

echo -e "\n=== 测试完成 ==="
echo -e "\n【验证要点】"
echo "1. AI是否理解用户回答内容？"
echo "2. 生成的问题是否具有针对性和连贯性？"
echo "3. 问题是否基于之前的回答进行深入追问？"
echo "4. 语气是否温暖自然？"
