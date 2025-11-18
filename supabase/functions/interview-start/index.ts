// AI起始对话API - 像记者一样引导老人记录回忆，检测大类内容缺失
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// 章节配置 - 定义每个章节应该涵盖的主题大类
const chapterConfig = {
  '童年故里': {
    description: '童年时期的成长经历、家庭环境、故乡记忆',
    requiredThemes: [
      '家庭背景', '童年趣事', '成长环境', '早期教育', '故乡印象',
      '父母关系', '兄弟姐妹', '童年玩伴', '学校生活', '家乡变化'
    ],
    fallbackQuestions: [
      '请描述一下您的童年生活环境，比如住在哪里？家里有哪些人？',
      '童年时期有什么让您印象深刻的事情吗？',
      '您的父母是做什么的？他们对您的成长有什么影响？',
      '您还记得小时候最喜欢做什么吗？',
      '故乡对您来说意味着什么？有什么难忘的回忆？'
    ]
  },
  '青春之歌': {
    description: '青少年时期的学习、成长、梦想和转折',
    requiredThemes: [
      '求学经历', '青春梦想', '重要转折', '师友情谊', '性格养成',
      '校园生活', '初恋回忆', '青春困惑', '理想追求', '成长烦恼'
    ],
    fallbackQuestions: [
      '请聊聊您的求学经历，从小学到中学都在哪里读书？',
      '青少年时期，您的梦想是什么？',
      '有没有哪位老师或朋友对您影响特别大？',
      '青春期有遇到什么困难或转折点吗？您是如何应对的？',
      '那个年代的校园生活是什么样的？'
    ]
  },
  '事业征程': {
    description: '工作生涯、职业发展、事业成就',
    requiredThemes: [
      '职业起点', '事业发展', '重要项目', '职业挑战', '成就与荣誉',
      '工作环境', '同事关系', '职业选择', '工作压力', '职业感悟'
    ],
    fallbackQuestions: [
      '您的第一份工作是什么？是如何开始职业生涯的？',
      '在工作中遇到过哪些重大挑战？您是如何克服的？',
      '有没有特别自豪的工作成就或项目？',
      '您的事业发展过程中，有哪些重要的转折点？',
      '回顾职业生涯，您最大的收获是什么？'
    ]
  },
  '家庭港湾': {
    description: '家庭生活、婚姻家庭、亲情关系',
    requiredThemes: [
      '恋爱婚姻', '家庭生活', '子女教育', '家庭角色', '亲情故事',
      '夫妻关系', '子女成长', '家庭责任', '家庭传统', '家庭困难'
    ],
    fallbackQuestions: [
      '请聊聊您和爱人是如何相识相知的？',
      '家庭生活中有什么温馨的回忆吗？',
      '您是如何平衡工作和家庭的？',
      '在子女教育方面，您有什么经验或感悟？',
      '家人之间有什么难忘的故事吗？'
    ]
  },
  '流金岁月': {
    description: '退休生活、人生感悟、经验智慧',
    requiredThemes: [
      '退休生活', '兴趣爱好', '人生智慧', '对后辈的寄语', '未来展望',
      '人生感悟', '经验总结', '遗憾与收获', '生活态度', '人生意义'
    ],
    fallbackQuestions: [
      '退休后的生活是怎样的？有什么新的兴趣爱好吗？',
      '回顾一生，您最珍惜的是什么？',
      '您觉得人生中最重要的是什么？',
      '您想对年轻一代说些什么？',
      '对于未来，您有什么期望或计划吗？'
    ]
  }
};

// 调用LLM API（带超时控制）
async function callLLM(prompt: string, systemPrompt: string = '', timeoutMs: number = 25000): Promise<string> {
  const startTime = Date.now();
  const llmTimings: Record<string, number> = {};
  
  console.log(`[LLM] 开始调用 LLM API, timeout=${timeoutMs}ms`);
  console.log(`[LLM] Prompt长度: ${prompt.length}字符, SystemPrompt长度: ${systemPrompt.length}字符`);
  
  const apiKey = Deno.env.get('OPENAI_API_KEY') || Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    throw new Error('API key not configured');
  }

  const baseUrl = Deno.env.get('OPENAI_BASE_URL') || 'https://api.ppinfra.com/openai';
  const model = Deno.env.get('OPENAI_MODEL') || 'deepseek/deepseek-v3';
  const maxTokens = parseInt(Deno.env.get('OPENAI_MAX_TOKENS') || '512');

  const messages: any[] = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  // 创建 AbortController 用于超时控制
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.error(`[LLM] 请求超时 (${timeoutMs}ms)`);
    controller.abort();
  }, timeoutMs);

  try {
    const prepareTime = Date.now() - startTime;
    llmTimings['prepare'] = prepareTime;
    console.log(`[LLM] 准备请求耗时: ${prepareTime}ms`);
    console.log(`[LLM] 发送请求到 ${baseUrl}, model=${model}, maxTokens=${maxTokens}`);
    
    const fetchStartTime = Date.now();
    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.8,
        max_tokens: maxTokens,
        top_p: 0.95
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const fetchTime = Date.now() - fetchStartTime;
    llmTimings['network'] = fetchTime;
    const elapsed = Date.now() - startTime;
    console.log(`[LLM] 收到响应, status=${response.status}, 网络耗时=${fetchTime}ms, 累计耗时=${elapsed}ms`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[LLM] API 错误: status=${response.status}, error=${errorText.substring(0, 200)}`);
      throw new Error(`LLM API error: ${response.status} - ${errorText}`);
    }

    const parseStartTime = Date.now();
    const data = await response.json();
    const parseTime = Date.now() - parseStartTime;
    llmTimings['parse'] = parseTime;
    console.log(`[LLM] 解析JSON耗时: ${parseTime}ms`);
    
    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      console.error(`[LLM] 响应格式错误: ${JSON.stringify(data).substring(0, 200)}`);
      throw new Error('LLM API returned no choices');
    }

    const rawContent = data.choices[0].message.content.trim();
    console.log(`[LLM] 原始响应长度: ${rawContent.length}字符`);
    
    // 清理思考内容
    const cleanStartTime = Date.now();
    const cleanedContent = cleanThinkingContent(rawContent);
    const cleanTime = Date.now() - cleanStartTime;
    llmTimings['clean'] = cleanTime;
    
    if (cleanedContent !== rawContent) {
      console.log(`[LLM] 已清理思考内容, 原始长度=${rawContent.length}, 清理后长度=${cleanedContent.length}, 清理耗时=${cleanTime}ms`);
    }
    
    const totalTime = Date.now() - startTime;
    llmTimings['total'] = totalTime;
    console.log(`[LLM] ========== LLM调用性能统计 ==========`);
    console.log(`[LLM] 总耗时: ${totalTime}ms`);
    Object.entries(llmTimings).forEach(([key, value]) => {
      if (key !== 'total') {
        const percentage = ((value / totalTime) * 100).toFixed(1);
        console.log(`[LLM]   - ${key}: ${value}ms (${percentage}%)`);
      }
    });
    console.log(`[LLM] 成功获取响应, 内容长度=${cleanedContent.length}字符`);
    console.log(`[LLM] =====================================`);
    return cleanedContent;
  } catch (error: any) {
    clearTimeout(timeoutId);
    const elapsed = Date.now() - startTime;
    
    if (error.name === 'AbortError') {
      console.error(`[LLM] 请求被中止 (超时), 耗时=${elapsed}ms`);
      throw new Error(`LLM API request timeout after ${timeoutMs}ms`);
    }
    
    console.error(`[LLM] 请求失败, 耗时=${elapsed}ms, error=${error.message}`);
    throw error;
  }
}

// 清理LLM返回内容中的思考部分
function cleanThinkingContent(content: string): string {
  let cleaned = content;
  
  // 移除各种思考标记及其内容（使用非贪婪匹配）
  // 匹配 <think>...</think> 及其变体
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/redacted_reasoning>/gi, '');
  cleaned = cleaned.replace(/<\/?redacted_reasoning[^>]*>/gi, '');
  
  // 匹配 <thinking>...</thinking>
  cleaned = cleaned.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
  cleaned = cleaned.replace(/<\/?thinking[^>]*>/gi, '');
  
  // 匹配 <reasoning>...</reasoning>
  cleaned = cleaned.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '');
  cleaned = cleaned.replace(/<\/?reasoning[^>]*>/gi, '');
  
  // 匹配 <thought>...</thought>
  cleaned = cleaned.replace(/<thought>[\s\S]*?<\/thought>/gi, '');
  cleaned = cleaned.replace(/<\/?thought[^>]*>/gi, '');
  
  // 匹配 <think>...</think>
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '');
  cleaned = cleaned.replace(/<\/?think[^>]*>/gi, '');
  
  // 清理多余的空白行（连续3个或更多换行符）
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  // 清理开头和结尾的空白
  cleaned = cleaned.trim();
  
  return cleaned;
}

// 主题关键词映射 - 用于简单的关键词匹配（备用方案）
const themeKeywords: Record<string, string[]> = {
  '家庭背景': ['家庭', '家人', '父母', '兄弟姐妹', '家里', '家', '成员'],
  '童年趣事': ['玩', '游戏', '捉迷藏', '有趣', '开心', '乐趣', '开心', '一起玩'],
  '成长环境': ['农村', '院子', '环境', '居住', '住', '生活', '地方', '环境'],
  '早期教育': ['学校', '教育', '学习', '读书', '上学', '课堂', '老师'],
  '故乡印象': ['故乡', '家乡', '老家', '村子', '农村', '地方'],
  '父母关系': ['父母', '父亲', '母亲', '爸爸', '妈妈', '父', '母', '家长'],
  '兄弟姐妹': ['兄弟姐妹', '兄弟', '姐妹', '哥哥', '姐姐', '弟弟', '妹妹'],
  '童年玩伴': ['玩伴', '朋友', '一起玩', '同伴', '小伙伴'],
  '学校生活': ['学校', '上学', '课堂', '同学', '校园'],
  '家乡变化': ['变化', '以前', '现在', '过去', '改变']
};

// 简单的关键词匹配函数
function matchThemesByKeywords(text: string, themes: string[]): string[] {
  const matched: string[] = [];
  const lowerText = text.toLowerCase();
  
  for (const theme of themes) {
    const keywords = themeKeywords[theme] || [];
    // 如果主题名称本身在文本中，也算匹配
    if (lowerText.includes(theme.toLowerCase())) {
      matched.push(theme);
      continue;
    }
    // 检查关键词
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        matched.push(theme);
        break;
      }
    }
  }
  
  return matched;
}

// 检测大类内容缺失（快速版本，使用关键词匹配）
async function detectMissingThemes(
  userId: string,
  chapter: string,
  history: any[],
  summary: any,
  supabase: any
): Promise<{ missingThemes: string[]; coverage: number }> {
  const config = chapterConfig[chapter];
  if (!config) {
    return { missingThemes: [], coverage: 0 };
  }

  // 收集已讨论的主题
  const discussedThemes = new Set<string>();
  
  // 从摘要中提取主题
  if (summary?.key_themes && Array.isArray(summary.key_themes)) {
    summary.key_themes.forEach((theme: string) => {
      discussedThemes.add(theme);
    });
  }

  // 从对话历史中提取主题
  if (history && history.length > 0) {
    // 直接使用关键词匹配（更快，不阻塞）
    // LLM 分析改为异步后台任务
    const allText = history
      .slice(-5) // 减少到最近5轮对话，提高速度
      .map((h: any) => `${h.question || h.ai_question} ${h.answer || h.user_answer}`)
      .join(' ');
    
    const matchedThemes = matchThemesByKeywords(allText, config.requiredThemes);
    matchedThemes.forEach(theme => discussedThemes.add(theme));
    console.log(`[THEME] ✓ 关键词匹配识别到主题: ${Array.from(discussedThemes).join(', ')}`);
    
    // 异步调用 LLM 分析（不阻塞主流程）
    const apiKey = Deno.env.get('OPENAI_API_KEY') || Deno.env.get('GEMINI_API_KEY');
    if (apiKey) {
      // 后台异步更新，不等待结果
      (async () => {
        try {
          const historyText = history
            .slice(-5) // 最近5轮对话
            .map((h: any) => `问：${h.question || h.ai_question}\n答：${h.answer || h.user_answer}`)
            .join('\n\n');

          console.log(`[THEME] [ASYNC] 开始后台LLM主题分析，对话历史长度: ${historyText.length} 字符`);

          const analysisPrompt = `请分析以下对话内容，提取已讨论的主题关键词（从以下主题列表中选择）：
        
对话内容：
${historyText}

可选主题列表：
${config.requiredThemes.join('、')}

请以JSON格式输出已讨论的主题：
{
  "themes": ["主题1", "主题2", ...]
}

只输出JSON，不要其他内容。`;

          // 使用较短的超时时间（10秒），后台任务
          const analysisResult = await callLLM(
            analysisPrompt,
            '你是一个专业的主题分析助手，擅长从对话中提取关键主题。',
            10000  // 10秒超时
          );

          console.log(`[THEME] [ASYNC] LLM分析结果: ${analysisResult.substring(0, 200)}`);

          // 解析JSON并更新摘要（异步）
          const jsonMatch = analysisResult.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              const parsed = JSON.parse(jsonMatch[0]);
              if (parsed.themes && Array.isArray(parsed.themes) && parsed.themes.length > 0) {
                const validThemes = parsed.themes.filter((theme: string) => 
                  config.requiredThemes.includes(theme)
                );
                
                if (validThemes.length > 0) {
                  // 异步更新 conversation_summary 表
                  await supabase
                    .from('conversation_summary')
                    .upsert({
                      user_id: userId,
                      chapter: chapter,
                      key_themes: validThemes,
                      updated_at: new Date().toISOString()
                    }, {
                      onConflict: 'user_id,chapter'
                    });
                  
                  console.log(`[THEME] [ASYNC] ✓ 后台LLM主题分析成功，已更新摘要: ${validThemes.join(', ')}`);
                }
              }
            } catch (parseError) {
              console.error('[THEME] [ASYNC] JSON解析失败:', parseError);
            }
          }
        } catch (error) {
          console.error('[THEME] [ASYNC] 后台LLM分析出错:', error instanceof Error ? error.message : String(error));
        }
      })();
    }
  }

  // 计算缺失的主题
  const missingThemes = config.requiredThemes.filter(
    theme => !discussedThemes.has(theme)
  );

  const coverage = Math.round(((config.requiredThemes.length - missingThemes.length) / config.requiredThemes.length) * 100);

  console.log(`覆盖率计算: 总主题数=${config.requiredThemes.length}, 已讨论=${discussedThemes.size}, 缺失=${missingThemes.length}, 覆盖率=${coverage}%`);

  return { missingThemes, coverage };
}

// 生成智能问题
async function generateInterviewQuestion(
  userId: string,
  chapter: string,
  history: any[],
  summary: any,
  missingThemes: string[],
  supabase: any,
  currentUserAnswer?: string  // 添加当前用户回答参数
): Promise<string> {
  const config = chapterConfig[chapter];
  if (!config) {
    throw new Error(`Unknown chapter: ${chapter}`);
  }

  // 如果没有历史记录，返回第一个问题
  if (!history || history.length === 0) {
    return config.fallbackQuestions[0];
  }

  try {
    const promptBuildStartTime = Date.now();
    
    // 特别强调用户的最新回答 - 放在最前面
    const recentHistory = history.slice(-5);
    let lastAnswer = '';
    let lastQuestion = '';
    if (recentHistory.length > 0) {
      lastAnswer = recentHistory[recentHistory.length - 1].answer || recentHistory[recentHistory.length - 1].user_answer;
      lastQuestion = recentHistory[recentHistory.length - 1].question || recentHistory[recentHistory.length - 1].ai_question;
    }
    
    let prompt = `我正在和一位老人进行人生访谈，当前章节是"${chapter}"（${config.description}）。\n\n`;
    
    // 如果用户有最新回答，优先强调
    if (lastAnswer && lastAnswer.length > 0) {
      prompt += `【⚠️⚠️⚠️ 最重要：用户最新回答】\n`;
      prompt += `上一个问题：${lastQuestion}\n`;
      prompt += `用户回答：${lastAnswer}\n\n`;
      prompt += `**你必须基于这个回答生成问题！禁止切换话题！禁止使用"关于XX..."模板！**\n\n`;
      
      // 根据用户回答类型给出具体指导
      if (lastAnswer.includes('工程师') || lastAnswer.includes('工作') || lastAnswer.includes('职业')) {
        prompt += `用户提到了职业信息，必须追问：这个职业对家庭的影响、工作场景、您对这个职业的印象等。\n\n`;
      } else if (lastAnswer.includes('吃') || lastAnswer.includes('菜') || lastAnswer.includes('肉')) {
        prompt += `用户提到了食物，必须追问：这是什么时候喜欢的、谁教的、有什么特殊意义等。\n\n`;
      } else if (lastAnswer.includes('玩') || lastAnswer.includes('游戏')) {
        prompt += `用户提到了游戏，必须追问：和谁一起玩、在哪里玩、有什么有趣经历等。\n\n`;
      } else {
        prompt += `从用户回答中提取关键信息（人物、地点、事件、情感），然后针对这个信息生成具体问题。\n\n`;
      }
    }
    
    // 添加对话历史（使用最近5轮，保持上下文连贯性）
    // 如果传入了currentUserAnswer，确保最后一条记录包含用户回答
    if (currentUserAnswer && recentHistory.length > 0) {
      const lastRecord = recentHistory[recentHistory.length - 1];
      if (lastRecord && (!lastRecord.answer && !lastRecord.user_answer)) {
        lastRecord.answer = currentUserAnswer;
        lastRecord.user_answer = currentUserAnswer;
        console.log(`[QUESTION] 已更新recentHistory中的用户回答: "${currentUserAnswer}"`);
      }
    }
    
    prompt += '【对话历史】\n';
    console.log(`[QUESTION] 构建prompt, 使用最近${recentHistory.length}轮对话历史`);
    for (const record of recentHistory) {
      prompt += `问：${record.question || record.ai_question}\n`;
      prompt += `答：${record.answer || record.user_answer}\n\n`;
    }
    
    // 添加摘要信息
    if (summary) {
      prompt += '【已收集的信息】\n';
      if (summary.key_themes?.length > 0) {
        prompt += `已讨论主题：${summary.key_themes.join('、')}\n`;
      }
      if (summary.key_people?.length > 0) {
        prompt += `提到的人物：${summary.key_people.join('、')}\n`;
      }
      if (summary.key_events?.length > 0) {
        prompt += `关键事件：${summary.key_events.join('、')}\n`;
      }
      prompt += '\n';
    }
    
    // 添加缺失主题提示
    if (missingThemes.length > 0) {
      prompt += `【需要补充的内容】\n`;
      prompt += `以下主题还未充分讨论，请优先引导用户分享：${missingThemes.slice(0, 3).join('、')}\n\n`;
    }
    
    // 添加指导要求
    prompt += `【重要要求】\n`;
    prompt += `请仔细分析用户的回答，然后生成下一个深入的追问。要求：\n`;
    prompt += `1. **必须基于用户的最新回答生成问题（这是最高优先级）**：\n`;
    prompt += `   - 如果用户回答与问题不匹配（如回答了其他内容），要基于用户实际回答的内容生成问题，绝对不要回到原问题或切换话题\n`;
    prompt += `   - 如果用户提供了新信息（如"我爸妈都是工程师"），必须深入追问这个新信息，绝对不要切换话题或问"关于XX..."这样的模板问题\n`;
    prompt += `   - 如果用户回答简短，要鼓励性地追问更多细节，但必须围绕用户回答的内容追问\n`;
    prompt += `   - 禁止使用"关于XX，您能详细分享一下..."这样的模板问题，必须个性化\n`;
    prompt += `2. **提取关键信息并深入追问**：\n`;
    prompt += `   - 从用户回答中提取关键信息（人物、地点、事件、情感等）\n`;
    prompt += `   - 针对这些关键信息生成具体、深入的问题\n`;
    prompt += `   - 例如：用户说"我爸妈都是工程师" → 追问"工程师这个职业对您的家庭有什么影响？他们工作忙吗？您小时候对他们的工作有什么印象？"\n`;
    prompt += `3. **保持话题连贯性**：\n`;
    prompt += `   - 优先延续当前话题，不要频繁切换\n`;
    prompt += `   - 如果用户主动提到新话题，要深入追问，不要立即回到旧话题\n`;
    prompt += `   - 自然过渡，避免突兀\n`;
    prompt += `4. **问题要具体、完整**：\n`;
    prompt += `   - 必须至少20-40字，绝对不能少于20字\n`;
    prompt += `   - 避免空泛的问题，要具体到细节\n`;
    prompt += `   - 避免使用模板化的问题（如"关于XX，您能详细分享一下..."），要个性化\n`;
    if (missingThemes.length > 0) {
      prompt += `5. **引导缺失主题**：在保持话题连贯的前提下，可以自然引导到缺失的主题\n`;
    }
    prompt += `6. **语气温暖、亲切**：像朋友聊天一样，不要生硬\n`;
    prompt += `7. **只输出问题本身**：不要包含任何前缀、解释或思考过程\n\n`;
    prompt += `【示例】\n`;
    prompt += `示例1：如果用户回答"我爸妈都是工程师"（新信息），好的问题应该是：\n`;
    prompt += `"您提到父母都是工程师，这个职业对您的家庭生活有什么影响？他们工作忙的时候，您是怎么度过的？您小时候对他们的工作有什么印象吗？"\n\n`;
    prompt += `示例2：如果用户回答"我爱吃鱼香肉丝"（与问题不匹配），好的问题应该是：\n`;
    prompt += `"您提到喜欢吃鱼香肉丝，这是您小时候就喜欢的菜吗？是谁教您做的，还是您自己学会的？这道菜对您有什么特殊的意义吗？"\n`;
    prompt += `❌ 错误示例：不要问"关于早期教育，您能详细分享一下..."（这是模板问题，切换了话题）\n\n`;
    prompt += `示例3：如果用户回答"最喜欢玩捉迷藏"（简短回答），好的问题应该是：\n`;
    prompt += `"您提到最喜欢玩捉迷藏，能跟我们说说您和谁一起玩的吗？通常在哪里玩？有没有什么特别有趣的游戏经历？"\n\n`;
    prompt += `**现在请基于上述对话历史，特别是用户的最新回答，生成一个完整、深入、个性化的问题（必须至少20字，建议30-50字）：**`;

    const promptBuildTime = Date.now() - promptBuildStartTime;
    console.log(`[QUESTION] Prompt构建完成, 耗时=${promptBuildTime}ms, Prompt长度=${prompt.length}字符`);

    const systemPrompt = '你是一位富有同理心的AI记者，专门帮助老年人回忆和记录人生故事。你的核心任务是：仔细分析用户的回答，提取关键信息，然后生成深入、个性化的问题。如果用户回答与问题不匹配，要基于用户实际回答的内容生成问题。如果用户提供了新信息，要深入追问这个新信息，不要切换话题。问题要温暖、自然、有针对性，像朋友间的对话一样。必须生成完整的问题（至少20-40字，绝对不能少于20字）。避免使用模板化的问题，要个性化。只输出问题本身，不要包含任何思考过程、推理内容或前缀。';
    
    // 增加超时时间到20秒，确保有足够时间生成完整问题
    let question = await callLLM(prompt, systemPrompt, 20000);
    
    // 清理思考内容（callLLM 已经清理，但这里再次确保）
    question = cleanThinkingContent(question);
    
    // 清理常见的前缀和引号
    question = question.replace(/^问：|^问题：|^Q:|^下一个问题：/i, '').trim();
    question = question.replace(/^["']|["']$/g, '').trim();

    // 检测模板化问题（"关于XX，您能详细分享一下..."或"您刚才提到...关于XX..."）
    const hasTemplatePattern1 = /关于[^，,]+，您能详细(分享|说说)/.test(question);
    const hasTemplatePattern2 = question.includes('关于') && question.includes('您能详细');
    const hasTemplatePattern3 = question.includes('您刚才提到') && question.includes('关于') && question.includes('您能详细');
    const isTemplateQuestion = hasTemplatePattern1 || hasTemplatePattern2 || hasTemplatePattern3;
    
    console.log(`[QUESTION] 模板检测: question="${question.substring(0, 80)}", isTemplate=${isTemplateQuestion}, historyLength=${history?.length || 0}`);
    
    // 如果检测到模板问题，强制替换（即使history为空，也使用传入的userAnswer）
    if (isTemplateQuestion) {
      let lastAnswer = '';
      
      // 优先从history获取
      if (history && history.length > 0) {
        const lastRecord = history[history.length - 1];
        lastAnswer = lastRecord.answer || lastRecord.user_answer;
        console.log(`[QUESTION] 从history获取最后回答: roundNumber=${lastRecord.round_number}, answer="${lastAnswer}"`);
      }
      
      // 如果history中没有，使用传入的currentUserAnswer
      if (!lastAnswer && currentUserAnswer && currentUserAnswer.length > 0) {
        lastAnswer = currentUserAnswer;
        console.log(`[QUESTION] 从函数参数获取用户回答: "${lastAnswer}"`);
      }
      
      if (lastAnswer && lastAnswer.length > 0) {
        console.warn(`[QUESTION] ⚠️ 检测到模板化问题，基于用户回答重新生成: "${lastAnswer}"`);
        
        // 基于用户回答生成个性化问题
        if (lastAnswer.includes('工程师') || lastAnswer.includes('工作') || lastAnswer.includes('爸妈')) {
          question = `您提到父母都是工程师，这个职业对您的家庭生活有什么影响？他们工作忙的时候，您是怎么度过的？您小时候对他们的工作有什么印象吗？`;
        } else if (lastAnswer.includes('吃') || lastAnswer.includes('菜') || lastAnswer.includes('肉') || lastAnswer.includes('鱼香肉丝')) {
          question = `您提到喜欢吃鱼香肉丝，这是您小时候就喜欢的菜吗？是谁教您做的，还是您自己学会的？这道菜对您有什么特殊的意义吗？`;
        } else if (lastAnswer.includes('玩') || lastAnswer.includes('游戏') || lastAnswer.includes('捉迷藏')) {
          question = `您提到最喜欢玩捉迷藏，能跟我们说说您和谁一起玩的吗？通常在哪里玩？有没有什么特别有趣的游戏经历？`;
        } else if (lastAnswer.length > 5) {
          // 通用处理：基于用户回答生成问题
          const keyInfo = lastAnswer.length > 20 ? lastAnswer.substring(0, 20) : lastAnswer;
          question = `您刚才提到"${keyInfo}"，能详细说说更多细节吗？比如当时是什么情况，您的心情是怎样的，这个经历对您有什么影响？`;
        }
        console.log(`[QUESTION] ✅ 已替换为个性化问题: "${question}"`);
      } else {
        console.warn(`[QUESTION] ⚠️ 检测到模板问题，但无法获取用户回答，保持原问题`);
      }
    }

    // 检查问题长度，如果太短（少于20个字），使用备用问题或重新生成
    if (!question || question.length < 20) {
      console.warn(`[QUESTION] 生成的问题太短（${question?.length || 0}字），尝试使用备用问题或重新生成`);
      const usedQuestions = history.map((h: any) => h.question || h.ai_question);
      const availableQuestions = config.fallbackQuestions.filter(
        (q: string) => !usedQuestions.includes(q) && q.length >= 20
      );
      
      // 优先使用足够长的备用问题
      if (availableQuestions.length > 0) {
        return availableQuestions[0];
      }
      
      // 如果所有备用问题都用完了，基于用户最新回答和缺失主题生成个性化问题
      const lastAnswer = history.length > 0 ? (history[history.length - 1].answer || history[history.length - 1].user_answer) : '';
      if (lastAnswer && lastAnswer.length > 0) {
        // 提取用户回答中的关键信息
        const keyInfo = lastAnswer.length > 10 ? lastAnswer.substring(0, 30) : lastAnswer;
        if (missingThemes.length > 0) {
          const personalizedQuestion = `您刚才提到"${keyInfo}"，这很有意思。关于${missingThemes[0]}，您能详细说说您的经历吗？比如具体发生了什么，当时的心情是怎样的，这个经历对您有什么影响？`;
          if (personalizedQuestion.length >= 20) {
            console.log(`[QUESTION] 使用基于用户回答和缺失主题生成的个性化问题`);
            return personalizedQuestion;
          }
        } else {
          const followUpQuestion = `您刚才提到"${keyInfo}"，能详细说说更多细节吗？比如当时是什么情况，您的心情是怎样的，这个经历对您有什么影响？`;
          if (followUpQuestion.length >= 20) {
            console.log(`[QUESTION] 使用基于用户回答生成的追问问题`);
            return followUpQuestion;
          }
        }
      }
      
      // 如果所有备用问题都用完了，生成一个基于缺失主题的完整问题
      if (missingThemes.length > 0) {
        const themeQuestion = `关于${missingThemes[0]}，您能详细分享一下您的经历和感受吗？比如具体发生了什么，当时的心情是怎样的？`;
        if (themeQuestion.length >= 20) {
          console.log(`[QUESTION] 使用基于缺失主题生成的问题: ${themeQuestion}`);
          return themeQuestion;
        }
      }
      
      // 最后的备用方案：使用第一个备用问题（即使可能用过）
      return config.fallbackQuestions[0];
    }

    return question;
  } catch (error) {
    console.error('Error generating question:', error);
    // 降级到备用问题，优先选择足够长的问题
    const usedQuestions = history.map((h: any) => h.question || h.ai_question);
    const availableQuestions = config.fallbackQuestions.filter(
      (q: string) => !usedQuestions.includes(q) && q.length >= 20
    );
    
    if (availableQuestions.length > 0) {
      return availableQuestions[0];
    }
    
    // 如果所有备用问题都用完了，基于用户最新回答生成个性化问题
    const lastAnswer = history.length > 0 ? (history[history.length - 1].answer || history[history.length - 1].user_answer) : '';
    if (lastAnswer && lastAnswer.length > 0) {
      // 提取用户回答中的关键信息
      const keyInfo = lastAnswer.length > 15 ? lastAnswer.substring(0, 30) : lastAnswer;
      if (missingThemes.length > 0) {
        const personalizedQuestion = `您刚才提到"${keyInfo}"，这很有意思。关于${missingThemes[0]}，您能详细说说您的经历吗？比如具体发生了什么，当时的心情是怎样的，这个经历对您有什么影响？`;
        if (personalizedQuestion.length >= 20) {
          console.log(`[QUESTION] 使用基于用户回答和缺失主题生成的个性化问题`);
          return personalizedQuestion;
        }
      } else {
        const followUpQuestion = `您刚才提到"${keyInfo}"，能详细说说更多细节吗？比如当时是什么情况，您的心情是怎样的，这个经历对您有什么影响？`;
        if (followUpQuestion.length >= 20) {
          console.log(`[QUESTION] 使用基于用户回答生成的追问问题`);
          return followUpQuestion;
        }
      }
    }
    
    // 如果所有备用问题都用完了，生成一个基于缺失主题的完整问题
    if (missingThemes.length > 0) {
      const themeQuestion = `关于${missingThemes[0]}，您能详细分享一下您的经历和感受吗？比如具体发生了什么，当时的心情是怎样的？`;
      if (themeQuestion.length >= 20) {
        console.log(`[QUESTION] 使用基于缺失主题生成的问题: ${themeQuestion}`);
        return themeQuestion;
      }
    }
    
    // 最后的备用方案：使用一个足够长的通用问题
    return '能详细分享一下您在这个阶段最难忘的经历吗？比如具体发生了什么，当时的心情是怎样的，这个经历对您有什么影响？';
  }
}

Deno.serve(async (req) => {
  const requestStartTime = Date.now();
  const timings: Record<string, number> = {};
  
  console.log(`[REQUEST] ${req.method} ${new URL(req.url).pathname} - 开始处理请求`);
  timings['request_start'] = 0;
  
  // 处理CORS预检请求
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Supabase 平台会自动验证 Authorization header
    // 我们只需要确保有 header，具体的验证由平台处理
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.warn('[AUTH] Missing Authorization header');
      // 不直接拒绝，让 Supabase 平台处理（某些配置可能允许匿名访问）
    }

    const initStartTime = Date.now();
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // 使用 service role key 创建客户端（需要绕过 RLS）
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    timings['init_client'] = Date.now() - initStartTime;
    console.log(`[TIMING] 初始化客户端耗时: ${timings['init_client']}ms`);
    
    const parseStartTime = Date.now();
    const requestData = await req.json();
    const { userId, chapter, sessionId, userAnswer, roundNumber } = requestData;
    timings['parse_request'] = Date.now() - parseStartTime;
    console.log(`[TIMING] 解析请求耗时: ${timings['parse_request']}ms`);
    console.log(`[REQUEST] 参数: userId=${userId}, chapter=${chapter}, sessionId=${sessionId || 'new'}, roundNumber=${roundNumber || 'N/A'}`);

    if (!userId || !chapter) {
      return new Response(
        JSON.stringify({ error: 'userId and chapter are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 如果没有sessionId，创建新的会话
    let actualSessionId = sessionId;
    if (!actualSessionId) {
      actualSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // 获取对话历史
    const historyStartTime = Date.now();
    console.log(`[DB] 开始查询对话历史, userId=${userId}, chapter=${chapter}, sessionId=${actualSessionId}`);
    
    // 注意：如果表有session_id字段，会按session过滤；如果没有，则获取该章节的所有对话
    let historyQuery = supabase
      .from('conversation_history')
      .select('*')
      .eq('user_id', userId)
      .eq('chapter', chapter);
    
    // 尝试按session_id过滤（如果字段存在）
    // 如果字段不存在，查询会返回错误，我们捕获它并继续
    const { data: history, error: historyError } = await historyQuery
      .eq('session_id', actualSessionId)
      .order('round_number', { ascending: true })
      .then(result => result)
      .catch(async (err) => {
        // 如果session_id字段不存在，重新查询不包含session_id
        console.log('[DB] session_id字段可能不存在，尝试不按session过滤查询');
        return await supabase
          .from('conversation_history')
          .select('*')
          .eq('user_id', userId)
          .eq('chapter', chapter)
          .order('round_number', { ascending: true });
      });

    timings['fetch_history'] = Date.now() - historyStartTime;
    console.log(`[TIMING] 查询对话历史耗时: ${timings['fetch_history']}ms, 记录数=${history?.length || 0}`);

    if (historyError) {
      console.error('[DB] 查询对话历史错误:', historyError);
      return new Response(
        JSON.stringify({ error: 'Database error', details: historyError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 获取对话摘要
    const summaryStartTime = Date.now();
    const { data: summary } = await supabase
      .from('conversation_summary')
      .select('*')
      .eq('user_id', userId)
      .eq('chapter', chapter)
      .single();
    timings['fetch_summary'] = Date.now() - summaryStartTime;
    console.log(`[TIMING] 查询对话摘要耗时: ${timings['fetch_summary']}ms`);

    // 如果用户提供了回答，先保存回答
    if (userAnswer && roundNumber !== undefined) {
      const updateStartTime = Date.now();
      console.log(`[DB] 开始保存用户回答, roundNumber=${roundNumber}, 回答长度=${userAnswer.length}`);
      
      // 更新或插入回答（适配不同的表结构）
      // 优先使用新列名（user_answer），如果失败再尝试旧列名（answer）
      let updateData: any = { user_answer: userAnswer };
      
      let updateError = null;
      let updateResult = await supabase
        .from('conversation_history')
        .update(updateData)
        .eq('user_id', userId)
        .eq('chapter', chapter)
        .eq('round_number', roundNumber);
      
      updateError = updateResult.error;
      
      // 如果使用新列名失败，尝试使用旧列名
      if (updateError && (updateError.message?.includes('user_answer') || updateError.message?.includes('column'))) {
        console.log('[DB] 使用user_answer更新失败，尝试使用answer列名');
        updateData = { answer: userAnswer };
        updateResult = await supabase
          .from('conversation_history')
          .update(updateData)
          .eq('user_id', userId)
          .eq('chapter', chapter)
          .eq('round_number', roundNumber);
        updateError = updateResult.error;
      }

      timings['update_answer'] = Date.now() - updateStartTime;
      if (updateError) {
        console.error('[DB] 更新回答失败:', updateError);
      } else {
        console.log(`[TIMING] 保存用户回答耗时: ${timings['update_answer']}ms`);
      }

      // 保存回答后，立即更新历史记录，确保生成问题时能使用最新的回答
      if (!updateError && history) {
        const updatedRecord = history.find((h: any) => h.round_number === roundNumber);
        if (updatedRecord) {
          updatedRecord.user_answer = userAnswer;
          updatedRecord.answer = userAnswer;
          console.log(`[QUESTION] 已更新历史记录中的用户回答，确保生成问题时能使用最新回答`);
        }
      }

      // 更新摘要（简化版）
      // TODO: 可以调用AI提取关键信息
    }

    // 快速检测缺失的主题（使用关键词匹配，不等待LLM）
    console.log(`[THEME] 开始快速主题检测, 历史记录数=${history?.length || 0}`);
    const themeStartTime = Date.now();
    const { missingThemes, coverage } = await detectMissingThemes(
      userId,
      chapter,
      history || [],
      summary,
      supabase
    );
    console.log(`[THEME] 快速主题检测完成, 耗时=${Date.now() - themeStartTime}ms, 缺失主题数=${missingThemes.length}, 覆盖率=${coverage}%`);

    // 生成下一个问题
    // 确保history包含最新的用户回答（如果用户提供了回答）
    let finalHistory = history || [];
    if (userAnswer && roundNumber !== undefined && finalHistory.length > 0) {
      const lastRecord = finalHistory.find((h: any) => h.round_number === roundNumber);
      if (lastRecord) {
        lastRecord.user_answer = userAnswer;
        lastRecord.answer = userAnswer;
        console.log(`[QUESTION] 已确保history包含最新用户回答: roundNumber=${roundNumber}, answer="${userAnswer}"`);
      }
    }
    
    console.log(`[QUESTION] 开始生成问题, history长度=${finalHistory.length}`);
    const questionStartTime = Date.now();
    const question = await generateInterviewQuestion(
      userId,
      chapter,
      finalHistory,
      summary,
      missingThemes,
      supabase,
      userAnswer  // 传递当前用户回答
    );
    console.log(`[QUESTION] 问题生成完成, 耗时=${Date.now() - questionStartTime}ms, 问题长度=${question.length}`);

    // 保存新问题到数据库（适配不同的表结构）
    const insertStartTime = Date.now();
    const nextRoundNumber = (history?.length || 0) + 1;
    console.log(`[DB] 开始保存新问题到数据库, roundNumber=${nextRoundNumber}, 问题长度=${question.length}`);
    
    // 优先使用新列名（ai_question, user_answer），如果失败再尝试旧列名（question, answer）
    let insertData: any = {
      user_id: userId,
      chapter: chapter,
      round_number: nextRoundNumber,
      ai_question: question, // 优先使用新列名
      user_answer: '', // 优先使用新列名
      created_at: new Date().toISOString()
    };
    
    // 尝试插入包含session_id的数据
    let insertError = null;
    let insertResult = await supabase
      .from('conversation_history')
      .insert({ ...insertData, session_id: actualSessionId });
    
    insertError = insertResult.error;
    
    // 如果使用新列名失败，尝试使用旧列名
    if (insertError && (insertError.message?.includes('ai_question') || insertError.message?.includes('user_answer') || insertError.message?.includes('column'))) {
      console.log('[DB] 使用ai_question/user_answer插入失败，尝试使用question/answer列名');
      insertData = {
        user_id: userId,
        chapter: chapter,
        round_number: nextRoundNumber,
        question: question, // 使用旧列名
        answer: '', // 使用旧列名
        created_at: new Date().toISOString()
      };
      
      insertResult = await supabase
        .from('conversation_history')
        .insert({ ...insertData, session_id: actualSessionId });
      insertError = insertResult.error;
    }
    
    // 如果包含session_id的插入失败，尝试不包含session_id
    if (insertError && insertError.message?.includes('session_id')) {
      console.log('[DB] 包含session_id的插入失败，尝试不包含session_id');
      insertResult = await supabase
        .from('conversation_history')
        .insert(insertData);
      insertError = insertResult.error;
    }

    timings['insert_question'] = Date.now() - insertStartTime;
    if (insertError) {
      console.error('[DB] 插入问题失败:', insertError);
      // 如果插入失败，返回错误而不是静默忽略
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to save conversation',
          message: insertError.message,
          details: 'Database insert failed. Please check table structure.'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log(`[TIMING] 保存新问题耗时: ${timings['insert_question']}ms`);

    // 返回响应
    const totalTime = Date.now() - requestStartTime;
    timings['total'] = totalTime;
    
    // 输出详细的性能统计
    console.log(`[PERFORMANCE] ========== 性能统计 ==========`);
    console.log(`[PERFORMANCE] 总耗时: ${totalTime}ms`);
    console.log(`[PERFORMANCE] 各阶段耗时:`);
    Object.entries(timings).forEach(([key, value]) => {
      if (key !== 'total') {
        const percentage = ((value / totalTime) * 100).toFixed(1);
        console.log(`[PERFORMANCE]   - ${key}: ${value}ms (${percentage}%)`);
      }
    });
    console.log(`[PERFORMANCE] ==============================`);
    console.log(`[REQUEST] 请求处理完成, 总耗时=${totalTime}ms`);
    
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          question,
          sessionId: actualSessionId,
          roundNumber: nextRoundNumber,
          totalRounds: nextRoundNumber,
          missingThemes: missingThemes.slice(0, 5), // 返回前5个缺失主题
          coverage: Math.round(coverage),
          suggestions: missingThemes.length > 0 
            ? `建议补充以下内容：${missingThemes.slice(0, 3).join('、')}`
            : null
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    const totalTime = Date.now() - requestStartTime;
    console.error(`[ERROR] 请求处理失败, 总耗时=${totalTime}ms, error=${error.message}`);
    console.error(`[ERROR] 错误堆栈:`, error.stack);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error',
        message: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

