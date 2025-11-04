#!/bin/bash
GEMINI_API_KEY=$(curl -s https://lafpbfjtbupootnpornv.supabase.co/functions/v1/ai-interviewer-smart \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZnBiZmp0YnVwb290bnBvcm52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MzIxMzgsImV4cCI6MjA3NDAwODEzOH0.NdxDvO17UX2Cya0Uz3ECWkR3g5nEbpIcu5ISXPTvaQ8" \
  -d '{"action": "getEnvInfo"}' | grep -oP '"apiKeyLength":\K[0-9]+')

echo "API Key length: $GEMINI_API_KEY"

# 尝试列出v1版本的模型
echo "=== Testing v1 API ==="
curl -s "https://generativelanguage.googleapis.com/v1/models?key=AIzaSyBSz-vY8K3qU3_Y0pQoZ5FwX8k5n8yJ4Xk" | head -100

# 尝试列出v1beta版本的模型
echo -e "\n=== Testing v1beta API ==="
curl -s "https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyBSz-vY8K3qU3_Y0pQoZ5FwX8k5n8yJ4Xk" | head -100
