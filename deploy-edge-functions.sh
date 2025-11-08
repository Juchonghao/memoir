#!/bin/bash

# 快速部署Edge Functions到Supabase
# 适用于中国网络环境

set -e

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}部署Edge Functions到Supabase${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# 检查Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI未安装${NC}"
    echo ""
    echo "安装方法："
    echo "  npm install -g supabase"
    echo "  或"
    echo "  brew install supabase/tap/supabase"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓ Supabase CLI已安装${NC}"
echo ""

# 检查是否已登录
echo "检查登录状态..."
if ! supabase projects list &> /dev/null; then
    echo -e "${YELLOW}⚠ 未登录，请先登录${NC}"
    echo "运行: supabase login"
    echo ""
    read -p "是否现在登录？(y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        supabase login
    else
        echo -e "${RED}❌ 请先登录后再运行此脚本${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✓ 已登录${NC}"
echo ""

# 检查项目是否已链接
if [ ! -f ".supabase/config.toml" ]; then
    echo -e "${YELLOW}⚠ 项目未链接${NC}"
    echo ""
    read -p "请输入Supabase项目引用ID (project-ref): " PROJECT_REF
    if [ -z "$PROJECT_REF" ]; then
        echo -e "${RED}❌ 项目引用ID不能为空${NC}"
        exit 1
    fi
    echo "链接项目..."
    supabase link --project-ref "$PROJECT_REF"
    echo -e "${GREEN}✓ 项目已链接${NC}"
else
    echo -e "${GREEN}✓ 项目已链接${NC}"
fi

echo ""

# 部署函数列表
FUNCTIONS=(
    "interview-start"
    "memoir-generate"
    "api-gateway"
)

# 部署每个函数
for func in "${FUNCTIONS[@]}"; do
    if [ -d "supabase/functions/$func" ]; then
        echo -e "${CYAN}📦 部署 $func...${NC}"
        if supabase functions deploy "$func" --no-verify-jwt; then
            echo -e "${GREEN}✓ $func 部署成功${NC}"
        else
            echo -e "${RED}❌ $func 部署失败${NC}"
            exit 1
        fi
        echo ""
    else
        echo -e "${YELLOW}⚠ $func 目录不存在，跳过${NC}"
        echo ""
    fi
done

# 获取项目信息
PROJECT_REF=$(grep -A 5 "\[project\]" .supabase/config.toml 2>/dev/null | grep "id" | cut -d '"' -f 2 || echo "")

if [ -z "$PROJECT_REF" ]; then
    echo -e "${YELLOW}⚠ 无法获取项目引用ID${NC}"
    echo "请手动在Supabase Dashboard中查看项目URL"
else
    PROJECT_URL="https://${PROJECT_REF}.supabase.co"
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✅ 部署完成！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "📝 API端点信息："
    echo ""
    echo "  Base URL: $PROJECT_URL/functions/v1"
    echo ""
    echo "  端点："
    echo "    - $PROJECT_URL/functions/v1/interview-start"
    echo "    - $PROJECT_URL/functions/v1/memoir-generate"
    echo "    - $PROJECT_URL/functions/v1/api-gateway"
    echo ""
fi

echo "📋 下一步："
echo ""
echo "1. 在Supabase Dashboard中设置环境变量："
echo "   - Settings → Edge Functions → Secrets"
echo "   - 添加以下环境变量："
echo "     * SUPABASE_URL"
echo "     * SUPABASE_SERVICE_ROLE_KEY"
echo "     * OPENAI_API_KEY (或 GEMINI_API_KEY)"
echo "     * OPENAI_BASE_URL (可选，默认: https://api.ppinfra.com/openai)"
echo ""
echo "2. 测试API端点："
echo "   export SUPABASE_URL=\"$PROJECT_URL\""
echo "   export SUPABASE_ANON_KEY=\"your-anon-key\""
echo "   bash test-conversation-flow.sh"
echo ""
echo "3. 将API信息提供给安卓工程师："
echo "   - Base URL: $PROJECT_URL/functions/v1"
echo "   - API Key: (在Supabase Dashboard → Settings → API中获取)"
echo ""

