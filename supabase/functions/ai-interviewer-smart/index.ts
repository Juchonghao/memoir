// AI记者智能对话系统 - 使用OpenAI GPT-4o-mini
// 功能：基于对话历史生成个性化问题，避免重复，实现真正的对话连贯性

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  'Access-Control-Max-Age': '86400',
};

// 章节配置
const chapterConfig = {
  '童年故里': {
    description: '童年时期的成长经历、家庭环境、故乡记忆',
    themes: ['家庭背景', '童年趣事', '成长环境', '早期教育', '故乡印象'],
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
    themes: ['求学经历', '青春梦想', '重要转折', '师友情谊', '性格养成'],
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
    themes: ['职业起点', '事业发展', '重要项目', '职业挑战', '成就与荣誉'],
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
    themes: ['恋爱婚姻', '家庭生活', '子女教育', '家庭角色', '亲情故事'],
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
    themes: ['退休生活', '兴趣爱好', '人生智慧', '对后辈的寄语', '未来展望'],
    fallbackQuestions: [
      '退休后的生活是怎样的？有什么新的兴趣爱好吗？',
      '回顾一生，您最珍惜的是什么？',
      '您觉得人生中最重要的是什么？',
      '您想对年轻一代说些什么？',
      '对于未来，您有什么期望或计划吗？'
    ]
  }
};

interface ConversationHistory {
  round_number: number;
  ai_question: string;
  user_answer: string;
  created_at: string;
}

interface ConversationSummary {
  key_themes: string[];
  key_people: string[];
  key_events: string[];
  emotional_tone: string;
}

// 调用DeepSeek API生成问题（OpenAI兼容接口）
async function callGemini(prompt: string, apiKey: string): Promise<string> {
  console.log('Calling DeepSeek API...');
  
  const systemInstruction = '你是一位富有同理心的AI记者，专门帮助老年人回忆和记录人生故事。你的问题要温暖、自然、有针对性，像朋友间的对话一样。';
  
  // 使用OpenAI兼容的API格式
  const baseUrl = Deno.env.get('OPENAI_BASE_URL') || 'https://api.ppinfra.com/openai';
  const model = Deno.env.get('OPENAI_MODEL') || 'deepseek/deepseek-r1';
  const maxTokens = parseInt(Deno.env.get('OPENAI_MAX_TOKENS') || '512');
  
  const response = await fetch(
    `${baseUrl}/v1/chat/completions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: systemInstruction
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: maxTokens,
        top_p: 0.95
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('DeepSeek API error:', response.status, errorText);
    throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('DeepSeek API full response:', JSON.stringify(data));
  
  // 检查响应结构（OpenAI兼容格式）
  if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
    console.error('Invalid response structure:', data);
    throw new Error('DeepSeek API returned no choices');
  }
  
  const choice = data.choices[0];
  if (!choice.message || !choice.message.content) {
    console.error('Invalid choice structure:', choice);
    throw new Error('DeepSeek API returned invalid choice structure');
  }
  
  return choice.message.content.trim();
}

// 检测问题是否重复
function isQuestionDuplicate(
  newQuestion: string,
  history: ConversationHistory[]
): boolean {
  if (!history || history.length === 0) return false;

  // 完全匹配检测
  for (const record of history) {
    if (record.ai_question === newQuestion) {
      console.log('Found exact duplicate question');
      return true;
    }
  }

  // 相似度检测（简单的关键词匹配）
  const newKeywords = extractKeywords(newQuestion);
  for (const record of history) {
    const oldKeywords = extractKeywords(record.ai_question);
    const similarity = calculateSimilarity(newKeywords, oldKeywords);
    if (similarity > 0.6) {
      console.log(`Found similar question (similarity: ${similarity})`);
      return true;
    }
  }

  return false;
}

// 提取关键词
function extractKeywords(text: string): string[] {
  // 移除标点符号，分割成词
  const words = text
    .replace(/[？。！，、；：""''（）《》【】？]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 1); // 过滤单字
  return words;
}

// 计算相似度（Jaccard相似度）
function calculateSimilarity(keywords1: string[], keywords2: string[]): number {
  if (keywords1.length === 0 || keywords2.length === 0) return 0;

  const set1 = new Set(keywords1);
  const set2 = new Set(keywords2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

// 简单的关键词分类（备用方案）
function simpleKeywordClassification(text: string, defaultChapter?: string): string {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('工作') || lowerText.includes('同事') || lowerText.includes('办公室') || 
      lowerText.includes('公司') || lowerText.includes('职业') || lowerText.includes('事业')) {
    return 'career';
  }
  
  if (lowerText.includes('家庭') || lowerText.includes('家人') || lowerText.includes('父母') || 
      lowerText.includes('孩子') || lowerText.includes('妻子') || lowerText.includes('丈夫') || 
      lowerText.includes('结婚') || lowerText.includes('婚礼')) {
    return 'family';
  }
  
  if (lowerText.includes('童年') || lowerText.includes('小时候') || lowerText.includes('学校') || 
      lowerText.includes('同学') || lowerText.includes('老师') || lowerText.includes('玩具')) {
    return 'childhood';
  }
  
  if (lowerText.includes('青春') || lowerText.includes('大学') || lowerText.includes('恋爱') || 
      lowerText.includes('朋友') || lowerText.includes('梦想')) {
    return 'youth';
  }
  
  if (lowerText.includes('退休') || lowerText.includes('感悟') || lowerText.includes('人生') || 
      lowerText.includes('回忆') || lowerText.includes('总结')) {
    return 'reflection';
  }

  // 默认使用当前章节或childhood
  return defaultChapter || 'childhood';
}

// 生成基于历史的智能问题
async function generateSmartQuestion(
  userId: string,
  chapter: string,
  history: ConversationHistory[],
  summary: ConversationSummary | null,
  supabase: any,
  geminiApiKey: string | null
): Promise<string> {
  const config = chapterConfig[chapter];
  if (!config) {
    throw new Error(`Unknown chapter: ${chapter}`);
  }

  // 如果没有历史记录，返回第一个问题
  if (!history || history.length === 0) {
    return config.fallbackQuestions[0];
  }

  // 如果没有API密钥，使用备用问题库
  if (!geminiApiKey) {
    console.log('No API key, using fallback questions');
    const usedQuestions = history.map(h => h.ai_question);
    const availableQuestions = config.fallbackQuestions.filter(
      q => !usedQuestions.includes(q)
    );
    
    if (availableQuestions.length > 0) {
      return availableQuestions[0];
    } else {
      return '还有什么想分享的故事吗？';
    }
  }

  // 使用Gemini生成个性化问题
  try {
    // 构建提示词
    let prompt = `我正在和一位老人进行人生访谈，当前章节是"${chapter}"（${config.description}）。\n\n`;
    
    // 添加对话历史
    prompt += '【对话历史】\n';
    const recentHistory = history.slice(-3); // 最近3轮对话
    for (const record of recentHistory) {
      prompt += `问：${record.ai_question}\n`;
      prompt += `答：${record.user_answer}\n\n`;
    }
    
    // 添加摘要信息
    if (summary) {
      prompt += '【已收集的信息】\n';
      if (summary.key_themes?.length > 0) {
        prompt += `主题：${summary.key_themes.join('、')}\n`;
      }
      if (summary.key_people?.length > 0) {
        prompt += `提到的人物：${summary.key_people.join('、')}\n`;
      }
      if (summary.key_events?.length > 0) {
        prompt += `关键事件：${summary.key_events.join('、')}\n`;
      }
      prompt += '\n';
    }
    
    // 添加指导要求
    prompt += `【要求】\n`;
    prompt += `请基于上述对话，生成下一个深入的追问。要求：\n`;
    prompt += `1. 自然延续当前话题，不要跳跃\n`;
    prompt += `2. 如果用户的回答中提到了有趣的细节，可以深入追问\n`;
    prompt += `3. 语气温暖、亲切，像朋友聊天\n`;
    prompt += `4. 问题要具体，避免空泛\n`;
    prompt += `5. 只输出问题本身，不要其他内容\n\n`;
    prompt += `请直接输出下一个问题：`;

    console.log('Generating question with Gemini...');
    console.log('Prompt length:', prompt.length);
    
    let question = await callGemini(prompt, geminiApiKey);
    
    // 清理问题格式
    question = question.replace(/^问：|^问题：|^Q:|^下一个问题：/i, '').trim();
    question = question.replace(/^["']|["']$/g, '').trim();
    
    // 检查是否重复
    let attempts = 0;
    while (isQuestionDuplicate(question, history) && attempts < 3) {
      console.log(`Question is duplicate, regenerating (attempt ${attempts + 1})...`);
      const regeneratePrompt = prompt + `\n注意：以下问题已经问过了，请生成不同的问题：\n${question}`;
      question = await callGemini(regeneratePrompt, geminiApiKey);
      question = question.replace(/^问：|^问题：|^Q:|^下一个问题：/i, '').trim();
      question = question.replace(/^["']|["']$/g, '').trim();
      attempts++;
    }
    
    // 如果仍然重复，使用备用问题
    if (isQuestionDuplicate(question, history)) {
      console.log('Still duplicate after retries, using fallback');
      const usedQuestions = history.map(h => h.ai_question);
      const availableQuestions = config.fallbackQuestions.filter(
        q => !usedQuestions.includes(q)
      );
      
      if (availableQuestions.length > 0) {
        question = availableQuestions[0];
      } else {
        question = '还有什么想分享的故事吗？';
      }
    }
    
    console.log('Generated question:', question);
    return question;
    
  } catch (error) {
    console.error('Error generating question with Gemini:', error);
    // 降级到备用问题
    const usedQuestions = history.map(h => h.ai_question);
    const availableQuestions = config.fallbackQuestions.filter(
      q => !usedQuestions.includes(q)
    );
    
    if (availableQuestions.length > 0) {
      return availableQuestions[0];
    } else {
      return '还有什么想分享的故事吗？';
    }
  }
}

// 更新对话摘要
async function updateConversationSummary(
  userId: string,
  chapter: string,
  userAnswer: string,
  supabase: any,
  geminiApiKey: string | null
): Promise<void> {
  try {
    // 获取当前摘要
    const { data: existingSummary } = await supabase
      .from('conversation_summary')
      .select('*')
      .eq('user_id', userId)
      .eq('chapter', chapter)
      .single();

    if (!geminiApiKey) {
      // 没有API密钥，进行简单的关键词提取
      console.log('No Gemini API key, using simple keyword extraction');
      
      const currentThemes = existingSummary?.key_themes || [];
      const currentPeople = existingSummary?.key_people || [];
      const currentEvents = existingSummary?.key_events || [];
      
      // 简单提取（这里可以使用更复杂的NLP技术）
      const newThemes = [...currentThemes];
      const newPeople = [...currentPeople];
      const newEvents = [...currentEvents];
      
      // 提取可能的人名（简化版）
      const peopleMatches = userAnswer.match(/([一-龥]{2,4})(老师|先生|女士|同学|朋友|父亲|母亲|爷爷|奶奶)/g);
      if (peopleMatches) {
        for (const match of peopleMatches) {
          const person = match.replace(/(老师|先生|女士|同学|朋友|父亲|母亲|爷爷|奶奶)/, '');
          if (!newPeople.includes(person)) {
            newPeople.push(person);
          }
        }
      }
      
      await supabase
        .from('conversation_summary')
        .upsert({
          user_id: userId,
          chapter: chapter,
          key_themes: newThemes.slice(0, 10),
          key_people: newPeople.slice(0, 10),
          key_events: newEvents.slice(0, 10),
          emotional_tone: existingSummary?.emotional_tone || '温暖回忆',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,chapter'
        });
      
      return;
    }

    // 使用Gemini提取关键信息
    const extractPrompt = `请从以下用户回答中提取关键信息：

用户回答：${userAnswer}

请以JSON格式输出：
{
  "themes": ["主题1", "主题2"],
  "people": ["人名1", "人名2"],
  "events": ["事件1", "事件2"],
  "emotional_tone": "情感基调（积极/消极/中性/复杂）"
}

只输出JSON，不要其他内容。`;

    const extractResult = await callGemini(extractPrompt, geminiApiKey);
    
    // 解析JSON
    let extracted;
    try {
      // 尝试提取JSON部分
      const jsonMatch = extractResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extracted = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (e) {
      console.error('Failed to parse extraction result:', e);
      extracted = {
        themes: [],
        people: [],
        events: [],
        emotional_tone: '温暖回忆'
      };
    }

    // 合并现有摘要
    const currentThemes = existingSummary?.key_themes || [];
    const currentPeople = existingSummary?.key_people || [];
    const currentEvents = existingSummary?.key_events || [];
    
    const mergedThemes = [...new Set([...currentThemes, ...(extracted.themes || [])])];
    const mergedPeople = [...new Set([...currentPeople, ...(extracted.people || [])])];
    const mergedEvents = [...new Set([...currentEvents, ...(extracted.events || [])])];

    // 更新数据库
    await supabase
      .from('conversation_summary')
      .upsert({
        user_id: userId,
        chapter: chapter,
        key_themes: mergedThemes.slice(0, 10), // 限制数量
        key_people: mergedPeople.slice(0, 10),
        key_events: mergedEvents.slice(0, 10),
        emotional_tone: extracted.emotional_tone || existingSummary?.emotional_tone || '温暖回忆',
        last_updated: new Date().toISOString()
      }, {
        onConflict: 'user_id,chapter'
      });

  } catch (error) {
    console.error('Error updating conversation summary:', error);
    // 不抛出错误，避免影响主流程
  }
}

Deno.serve(async (req) => {
  // 处理CORS预检请求
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        // 使用 DeepSeek API (OpenAI 兼容)
        const geminiApiKey = Deno.env.get('OPENAI_API_KEY') || Deno.env.get('GEMINI_API_KEY') || null;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const requestData = await req.json();
    const { action, userId, chapter, sessionId, userAnswer, roundNumber } = requestData;

    console.log('Request:', { action, userId, chapter, sessionId, roundNumber });

    // 测试端点
    if (action === 'testGemini') {
      if (!geminiApiKey) {
        return new Response(
          JSON.stringify({ 
            error: 'Gemini API key not configured',
            hasKey: false
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      try {
        const testResult = await callGemini('请说"你好"', geminiApiKey);
        return new Response(
          JSON.stringify({ 
            success: true, 
            response: testResult,
            hasKey: true,
            apiKeyLength: geminiApiKey.length
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error: any) {
        return new Response(
          JSON.stringify({ 
            error: 'Gemini API error',
            details: error.message,
            hasKey: true,
            apiKeyLength: geminiApiKey.length
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 获取环境信息
    if (action === 'getEnvInfo') {
      return new Response(
        JSON.stringify({
          hasApiKey: !!geminiApiKey,
          apiKeyLength: geminiApiKey?.length || 0,
          usingDeepSeek: true
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 获取下一个问题
    if (action === 'getNextQuestion') {
      if (!userId || !chapter || !sessionId) {
        return new Response(
          JSON.stringify({ error: 'Missing required parameters' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 获取对话历史
      const { data: history, error: historyError } = await supabase
        .from('conversation_history')
        .select('*')
        .eq('user_id', userId)
        .eq('chapter', chapter)
        .eq('session_id', sessionId)
        .order('round_number', { ascending: true });

      if (historyError) {
        console.error('Error fetching history:', historyError);
        return new Response(
          JSON.stringify({ error: 'Database error', details: historyError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 获取对话摘要
      const { data: summary } = await supabase
        .from('conversation_summary')
        .select('*')
        .eq('user_id', userId)
        .eq('chapter', chapter)
        .single();

      // 生成问题
      const question = await generateSmartQuestion(
        userId,
        chapter,
        history || [],
        summary,
        supabase,
        geminiApiKey
      );

      // 保存问题到数据库
      const nextRoundNumber = (history?.length || 0) + 1;
      const { error: insertError } = await supabase
        .from('conversation_history')
        .insert({
          user_id: userId,
          chapter: chapter,
          session_id: sessionId,
          round_number: nextRoundNumber,
          ai_question: question,
          user_answer: '',
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error inserting question:', insertError);
        return new Response(
          JSON.stringify({ error: 'Database error', details: insertError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          question,
          roundNumber: nextRoundNumber,
          usingAI: !!geminiApiKey
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 保存回答并获取下一个问题
    if (action === 'saveAnswer') {
      if (!userId || !chapter || !sessionId || !userAnswer || roundNumber === undefined) {
        return new Response(
          JSON.stringify({ error: 'Missing required parameters' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 获取当前问题（从历史记录中）
      // 如果找不到对应 roundNumber 的记录，尝试查找最新的未回答的问题
      let currentRecord = null
      const { data: recordByRound } = await supabase
        .from('conversation_history')
        .select('ai_question, round_number')
        .eq('user_id', userId)
        .eq('chapter', chapter)
        .eq('session_id', sessionId)
        .eq('round_number', roundNumber)
        .single();

      if (recordByRound) {
        currentRecord = recordByRound
      } else {
        // 如果找不到对应 roundNumber，查找最新的未回答的问题
        const { data: latestUnanswered } = await supabase
          .from('conversation_history')
          .select('ai_question, round_number')
          .eq('user_id', userId)
          .eq('chapter', chapter)
          .eq('session_id', sessionId)
          .eq('user_answer', '')
          .order('round_number', { ascending: false })
          .limit(1)
          .single();

        if (latestUnanswered) {
          currentRecord = latestUnanswered
          // 更新 roundNumber 为实际找到的 round_number
          // 注意：这里不能直接修改 roundNumber 参数，但我们可以使用找到的记录
        }
      }

      if (!currentRecord) {
        return new Response(
          JSON.stringify({ error: 'Current question not found', details: `No question found for round ${roundNumber}` }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // 使用实际找到的 round_number
      const actualRoundNumber = currentRecord.round_number || roundNumber

      // 更新回答（使用实际找到的 round_number）
      const { error: updateError } = await supabase
        .from('conversation_history')
        .update({ 
          user_answer: userAnswer
        })
        .eq('user_id', userId)
        .eq('chapter', chapter)
        .eq('session_id', sessionId)
        .eq('round_number', actualRoundNumber);

      if (updateError) {
        console.error('Error updating answer:', updateError);
        return new Response(
          JSON.stringify({ error: 'Database error', details: updateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 更新摘要
      await updateConversationSummary(userId, chapter, userAnswer, supabase, geminiApiKey);

      // 获取更新后的历史
      const { data: history } = await supabase
        .from('conversation_history')
        .select('*')
        .eq('user_id', userId)
        .eq('chapter', chapter)
        .eq('session_id', sessionId)
        .order('round_number', { ascending: true });

      // 获取摘要
      const { data: summary } = await supabase
        .from('conversation_summary')
        .select('*')
        .eq('user_id', userId)
        .eq('chapter', chapter)
        .single();

      // 生成下一个问题
      const nextQuestion = await generateSmartQuestion(
        userId,
        chapter,
        history || [],
        summary,
        supabase,
        geminiApiKey
      );

      // 保存下一个问题（使用实际 round_number + 1）
      const nextRoundNumber = actualRoundNumber + 1;
      const { error: insertError } = await supabase
        .from('conversation_history')
        .insert({
          user_id: userId,
          chapter: chapter,
          session_id: sessionId,
          round_number: nextRoundNumber,
          ai_question: nextQuestion,
          user_answer: '',
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error inserting next question:', insertError);
        return new Response(
          JSON.stringify({ error: 'Database error', details: insertError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          nextQuestion,
          nextRoundNumber,
          usingAI: !!geminiApiKey
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 内容分类功能
    if (action === 'classifyContent') {
      const { text, chapter } = requestData;
      
      if (!text) {
        return new Response(
          JSON.stringify({ error: 'Missing text parameter' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      try {
        // 使用DeepSeek进行智能分类
        const classificationPrompt = `请分析以下文本内容，判断它最应该属于哪个传记章节：

文本内容：${text}
当前章节：${chapter}

可选章节：
1. 童年故里（childhood）- 童年时期的成长经历、家庭环境、故乡记忆
2. 青春之歌（youth）- 青少年时期的学习、成长、梦想和转折
3. 事业征程（career）- 工作生涯、职业发展、事业成就
4. 家庭港湾（family）- 家庭生活、婚姻家庭、亲情关系
5. 流金岁月（reflection）- 退休生活、人生感悟、经验智慧

请只返回一个章节标识（childhood, youth, career, family, 或 reflection），不要其他内容。`;

        const category = await callGemini(classificationPrompt, geminiApiKey || '');
        
        // 清理返回结果
        const cleanCategory = category
          .toLowerCase()
          .trim()
          .replace(/[^a-z]/g, '')
          .replace(/章节|属于|应该|是|的/g, '');

        // 验证分类结果
        const validCategories = ['childhood', 'youth', 'career', 'family', 'reflection'];
        const finalCategory = validCategories.includes(cleanCategory) 
          ? cleanCategory 
          : (chapter || 'childhood');

        return new Response(
          JSON.stringify({ 
            category: finalCategory,
            categoryName: chapterConfig[finalCategory]?.description || finalCategory,
            usingAI: !!geminiApiKey
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error: any) {
        console.error('分类失败:', error);
        // 降级到简单分类
        const simpleCategory = simpleKeywordClassification(text, chapter);
        return new Response(
          JSON.stringify({ 
            category: simpleCategory,
            categoryName: chapterConfig[simpleCategory]?.description || simpleCategory,
            usingAI: false
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        stack: error.stack
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
