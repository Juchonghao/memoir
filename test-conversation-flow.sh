#!/bin/bash

# 完整对话流程测试 - 展示AI记者与老人的持续对话
# 这个测试模拟了从打开APP到完成多轮对话的完整流程

# 配置
SUPABASE_URL="${SUPABASE_URL:-https://your-project.supabase.co}"
API_KEY="${SUPABASE_ANON_KEY:-your-anon-key}"
USER_ID="${TEST_USER_ID:-test-user-id}"
CHAPTER="童年故里"

# 颜色输出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}AI记者对话流程测试${NC}"
echo -e "${CYAN}模拟：老人打开APP，与AI记者持续对话${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

SESSION_ID=""

# 函数：调用API
call_api() {
    local data=$1
    local response=$(curl -s -X POST "$SUPABASE_URL/functions/v1/interview-start" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $API_KEY" \
        -d "$data")
    echo "$response"
}

# 函数：显示对话
show_conversation() {
    local role=$1
    local content=$2
    local round=$3
    
    if [ "$role" = "ai" ]; then
        echo -e "${BLUE}[AI记者 - 第${round}轮]${NC} $content"
    else
        echo -e "${GREEN}[老人回答 - 第${round}轮]${NC} $content"
    fi
    echo ""
}

# ============================================
# 第1轮：打开APP，AI记者开始对话
# ============================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}第1轮：老人打开APP，AI记者开始对话${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

REQUEST_1='{
    "userId": "'$USER_ID'",
    "chapter": "'$CHAPTER'"
}'

echo "📤 请求：开启对话（首次调用，无sessionId）"
echo ""

RESPONSE_1=$(call_api "$REQUEST_1")
echo "📥 响应："
echo "$RESPONSE_1" | jq '.' 2>/dev/null || echo "$RESPONSE_1"
echo ""

# 提取sessionId和第一个问题
SESSION_ID=$(echo "$RESPONSE_1" | jq -r '.data.sessionId' 2>/dev/null)
QUESTION_1=$(echo "$RESPONSE_1" | jq -r '.data.question' 2>/dev/null)
ROUND_1=$(echo "$RESPONSE_1" | jq -r '.data.roundNumber' 2>/dev/null)

if [ -z "$SESSION_ID" ] || [ "$SESSION_ID" = "null" ]; then
    echo -e "${RED}❌ 未能获取Session ID，测试终止${NC}"
    exit 1
fi

show_conversation "ai" "$QUESTION_1" "$ROUND_1"

# 模拟老人回答
ANSWER_1="我小时候住在农村，家里有父母和两个兄弟姐妹。我们家有一个小院子，院子里种了很多花。"
show_conversation "user" "$ANSWER_1" "$ROUND_1"

sleep 1

# ============================================
# 第2轮：老人回答后，AI记者继续提问
# ============================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}第2轮：老人回答后，AI记者继续提问${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

REQUEST_2='{
    "userId": "'$USER_ID'",
    "chapter": "'$CHAPTER'",
    "sessionId": "'$SESSION_ID'",
    "userAnswer": "'$ANSWER_1'",
    "roundNumber": '$ROUND_1'
}'

echo "📤 请求：保存回答并获取下一个问题"
echo ""

RESPONSE_2=$(call_api "$REQUEST_2")
echo "📥 响应："
echo "$RESPONSE_2" | jq '.' 2>/dev/null || echo "$RESPONSE_2"
echo ""

QUESTION_2=$(echo "$RESPONSE_2" | jq -r '.data.question' 2>/dev/null)
ROUND_2=$(echo "$RESPONSE_2" | jq -r '.data.roundNumber' 2>/dev/null)
MISSING_THEMES=$(echo "$RESPONSE_2" | jq -r '.data.missingThemes[]' 2>/dev/null | head -3 | tr '\n' '、')
COVERAGE=$(echo "$RESPONSE_2" | jq -r '.data.coverage' 2>/dev/null)

show_conversation "ai" "$QUESTION_2" "$ROUND_2"

if [ ! -z "$MISSING_THEMES" ]; then
    echo -e "${CYAN}💡 内容检测：覆盖率 ${COVERAGE}%，建议补充：${MISSING_THEMES}${NC}"
    echo ""
fi

# 模拟老人回答
ANSWER_2="我父母都是农民，父亲种地，母亲在家做家务。他们很勤劳，每天都很早起床。"
show_conversation "user" "$ANSWER_2" "$ROUND_2"

sleep 1

# ============================================
# 第3轮：继续对话
# ============================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}第3轮：继续对话${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

REQUEST_3='{
    "userId": "'$USER_ID'",
    "chapter": "'$CHAPTER'",
    "sessionId": "'$SESSION_ID'",
    "userAnswer": "'$ANSWER_2'",
    "roundNumber": '$ROUND_2'
}'

RESPONSE_3=$(call_api "$REQUEST_3")
QUESTION_3=$(echo "$RESPONSE_3" | jq -r '.data.question' 2>/dev/null)
ROUND_3=$(echo "$RESPONSE_3" | jq -r '.data.roundNumber' 2>/dev/null)
MISSING_THEMES_3=$(echo "$RESPONSE_3" | jq -r '.data.missingThemes[]' 2>/dev/null | head -3 | tr '\n' '、')
COVERAGE_3=$(echo "$RESPONSE_3" | jq -r '.data.coverage' 2>/dev/null)

show_conversation "ai" "$QUESTION_3" "$ROUND_3"

if [ ! -z "$MISSING_THEMES_3" ]; then
    echo -e "${CYAN}💡 内容检测：覆盖率 ${COVERAGE_3}%，建议补充：${MISSING_THEMES_3}${NC}"
    echo ""
fi

# 模拟老人回答
ANSWER_3="我最喜欢和兄弟姐妹一起在院子里玩。我们经常玩捉迷藏，有时候还会一起帮父母干活。"
show_conversation "user" "$ANSWER_3" "$ROUND_3"

sleep 1

# ============================================
# 第4轮：继续对话
# ============================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}第4轮：继续对话${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

REQUEST_4='{
    "userId": "'$USER_ID'",
    "chapter": "'$CHAPTER'",
    "sessionId": "'$SESSION_ID'",
    "userAnswer": "'$ANSWER_3'",
    "roundNumber": '$ROUND_3'
}'

RESPONSE_4=$(call_api "$REQUEST_4")
QUESTION_4=$(echo "$RESPONSE_4" | jq -r '.data.question' 2>/dev/null)
ROUND_4=$(echo "$RESPONSE_4" | jq -r '.data.roundNumber' 2>/dev/null)
MISSING_THEMES_4=$(echo "$RESPONSE_4" | jq -r '.data.missingThemes[]' 2>/dev/null | head -3 | tr '\n' '、')
COVERAGE_4=$(echo "$RESPONSE_4" | jq -r '.data.coverage' 2>/dev/null)

show_conversation "ai" "$QUESTION_4" "$ROUND_4"

if [ ! -z "$MISSING_THEMES_4" ]; then
    echo -e "${CYAN}💡 内容检测：覆盖率 ${COVERAGE_4}%，建议补充：${MISSING_THEMES_4}${NC}"
    echo ""
fi

# 模拟老人回答
ANSWER_4="我记得小时候最难忘的事情是过年。那时候家里会做很多好吃的，我们兄弟姐妹都会穿上新衣服，特别开心。"
show_conversation "user" "$ANSWER_4" "$ROUND_4"

sleep 1

# ============================================
# 第5轮：继续对话
# ============================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}第5轮：继续对话${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

REQUEST_5='{
    "userId": "'$USER_ID'",
    "chapter": "'$CHAPTER'",
    "sessionId": "'$SESSION_ID'",
    "userAnswer": "'$ANSWER_4'",
    "roundNumber": '$ROUND_4'
}'

RESPONSE_5=$(call_api "$REQUEST_5")
QUESTION_5=$(echo "$RESPONSE_5" | jq -r '.data.question' 2>/dev/null)
ROUND_5=$(echo "$RESPONSE_5" | jq -r '.data.roundNumber' 2>/dev/null)
MISSING_THEMES_5=$(echo "$RESPONSE_5" | jq -r '.data.missingThemes[]' 2>/dev/null | head -3 | tr '\n' '、')
COVERAGE_5=$(echo "$RESPONSE_5" | jq -r '.data.coverage' 2>/dev/null)

show_conversation "ai" "$QUESTION_5" "$ROUND_5"

if [ ! -z "$MISSING_THEMES_5" ]; then
    echo -e "${CYAN}💡 内容检测：覆盖率 ${COVERAGE_5}%，建议补充：${MISSING_THEMES_5}${NC}"
    echo ""
fi

# ============================================
# 总结
# ============================================
echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}对话流程测试完成${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""
echo "📊 对话统计："
echo "  - 总轮次：$ROUND_5 轮"
echo "  - 会话ID：$SESSION_ID"
echo "  - 章节：$CHAPTER"
echo "  - 内容覆盖率：${COVERAGE_5}%"
echo ""
echo "💡 对话特点："
echo "  - AI记者根据老人的回答，持续生成个性化问题"
echo "  - 自动检测内容缺失，引导补充重要主题"
echo "  - 对话自然流畅，像朋友聊天一样"
echo ""
echo "📝 使用说明："
echo "  1. 第一次调用：只传 userId 和 chapter，获取第一个问题"
echo "  2. 后续调用：传 userId, chapter, sessionId, userAnswer, roundNumber"
echo "  3. 持续循环，直到对话结束"
echo ""
