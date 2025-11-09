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

// 调用LLM API
async function callLLM(prompt: string, systemPrompt: string = ''): Promise<string> {
  const apiKey = Deno.env.get('OPENAI_API_KEY') || Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    throw new Error('API key not configured');
  }

  const baseUrl = Deno.env.get('OPENAI_BASE_URL') || 'https://api.ppinfra.com/openai';
  const model = Deno.env.get('OPENAI_MODEL') || 'deepseek/deepseek-r1';
  const maxTokens = parseInt(Deno.env.get('OPENAI_MAX_TOKENS') || '1024');

  const messages: any[] = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

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
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
    throw new Error('LLM API returned no choices');
  }

  return data.choices[0].message.content.trim();
}

// 检测大类内容缺失
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

    // 从对话历史中提取主题（使用LLM分析）
    if (history && history.length > 0) {
      try {
        const historyText = history
          .slice(-10) // 最近10轮对话
          .map((h: any) => `问：${h.question || h.ai_question}\n答：${h.answer || h.user_answer}`)
          .join('\n\n');

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

      const analysisResult = await callLLM(
        analysisPrompt,
        '你是一个专业的主题分析助手，擅长从对话中提取关键主题。'
      );

      // 解析JSON
      const jsonMatch = analysisResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.themes && Array.isArray(parsed.themes)) {
          parsed.themes.forEach((theme: string) => {
            discussedThemes.add(theme);
          });
        }
      }
    } catch (error) {
      console.error('Error analyzing themes:', error);
    }
  }

  // 计算缺失的主题
  const missingThemes = config.requiredThemes.filter(
    theme => !discussedThemes.has(theme)
  );

  const coverage = ((config.requiredThemes.length - missingThemes.length) / config.requiredThemes.length) * 100;

  return { missingThemes, coverage };
}

// 生成智能问题
async function generateInterviewQuestion(
  userId: string,
  chapter: string,
  history: any[],
  summary: any,
  missingThemes: string[],
  supabase: any
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
    let prompt = `我正在和一位老人进行人生访谈，当前章节是"${chapter}"（${config.description}）。\n\n`;
    
    // 添加对话历史
    prompt += '【对话历史】\n';
    const recentHistory = history.slice(-3); // 最近3轮对话
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
    prompt += `【要求】\n`;
    prompt += `请基于上述对话，生成下一个深入的追问。要求：\n`;
    prompt += `1. 自然延续当前话题，不要跳跃\n`;
    prompt += `2. 如果用户的回答中提到了有趣的细节，可以深入追问\n`;
    prompt += `3. 语气温暖、亲切，像朋友聊天\n`;
    prompt += `4. 问题要具体，避免空泛\n`;
    if (missingThemes.length > 0) {
      prompt += `5. 优先引导用户分享缺失的主题内容\n`;
    }
    prompt += `6. 只输出问题本身，不要其他内容\n\n`;
    prompt += `请直接输出下一个问题：`;

    const systemPrompt = '你是一位富有同理心的AI记者，专门帮助老年人回忆和记录人生故事。你的问题要温暖、自然、有针对性，像朋友间的对话一样。';
    
    let question = await callLLM(prompt, systemPrompt);
    question = question.replace(/^问：|^问题：|^Q:|^下一个问题：/i, '').trim();
    question = question.replace(/^["']|["']$/g, '').trim();

    return question || config.fallbackQuestions[0];
  } catch (error) {
    console.error('Error generating question:', error);
    // 降级到备用问题
    const usedQuestions = history.map((h: any) => h.question || h.ai_question);
    const availableQuestions = config.fallbackQuestions.filter(
      (q: string) => !usedQuestions.includes(q)
    );
    return availableQuestions.length > 0 ? availableQuestions[0] : '还有什么想分享的故事吗？';
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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const requestData = await req.json();
    const { userId, chapter, sessionId, userAnswer, roundNumber } = requestData;

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
        console.log('session_id field may not exist, querying without session filter');
        return await supabase
          .from('conversation_history')
          .select('*')
          .eq('user_id', userId)
          .eq('chapter', chapter)
          .order('round_number', { ascending: true });
      });

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

    // 如果用户提供了回答，先保存回答
    if (userAnswer && roundNumber !== undefined) {
      // 更新或插入回答（适配不同的表结构）
      // 先尝试包含session_id的更新
      let updateData: any = { answer: userAnswer };
      
      const { error: updateError } = await supabase
        .from('conversation_history')
        .update(updateData)
        .eq('user_id', userId)
        .eq('chapter', chapter)
        .eq('round_number', roundNumber)
        .then(result => result)
        .catch(async (err) => {
          // 如果包含session_id的更新失败，尝试不包含session_id
          console.log('Update with session_id failed, trying without session_id');
          return await supabase
            .from('conversation_history')
            .update(updateData)
            .eq('user_id', userId)
            .eq('chapter', chapter)
            .eq('round_number', roundNumber);
        });

      if (updateError) {
        console.error('Error updating answer:', updateError);
      }

      // 更新摘要（简化版）
      // TODO: 可以调用AI提取关键信息
    }

    // 检测缺失的主题
    const { missingThemes, coverage } = await detectMissingThemes(
      userId,
      chapter,
      history || [],
      summary,
      supabase
    );

    // 生成下一个问题
    const question = await generateInterviewQuestion(
      userId,
      chapter,
      history || [],
      summary,
      missingThemes,
      supabase
    );

    // 保存新问题到数据库（适配不同的表结构）
    const nextRoundNumber = (history?.length || 0) + 1;
    const insertData: any = {
      user_id: userId,
      chapter: chapter,
      round_number: nextRoundNumber,
      question: question, // 使用question字段
      answer: '', // 使用answer字段
      created_at: new Date().toISOString()
    };
    
    // 尝试插入包含session_id的数据
    // 如果失败，尝试不包含session_id
    const { error: insertError } = await supabase
      .from('conversation_history')
      .insert({ ...insertData, session_id: actualSessionId })
      .then(result => result)
      .catch(async (err) => {
        // 如果包含session_id的插入失败，尝试不包含session_id
        console.log('Insert with session_id failed, trying without session_id');
        return await supabase
          .from('conversation_history')
          .insert(insertData);
      });

    if (insertError) {
      console.error('Error inserting question:', insertError);
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

    // 返回响应
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
    console.error('Error:', error);
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

