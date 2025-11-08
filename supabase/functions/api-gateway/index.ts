// 📱 统一 API Gateway - 为安卓应用提供 RESTful API
// 功能：将所有功能暴露为标准的 REST API，支持认证、错误处理、统一响应格式

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
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

// 统一响应格式
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

function successResponse<T>(data: T, status = 200): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString()
  };
  return new Response(
    JSON.stringify(response),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

function errorResponse(code: string, message: string, details?: any, status = 400): Response {
  const response: ApiResponse = {
    success: false,
    error: { code, message, details },
    timestamp: new Date().toISOString()
  };
  return new Response(
    JSON.stringify(response),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// 认证中间件
async function authenticate(req: Request): Promise<{ userId: string; supabase: any } | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return null;
  }

  return { userId: user.id, supabase };
}

// 调用 DeepSeek API
async function callDeepSeek(prompt: string, systemPrompt: string = ''): Promise<string> {
  const apiKey = Deno.env.get('OPENAI_API_KEY') || Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    throw new Error('API key not configured');
  }

  const baseUrl = Deno.env.get('OPENAI_BASE_URL') || 'https://api.ppinfra.com/openai';
  const model = Deno.env.get('OPENAI_MODEL') || 'deepseek/deepseek-r1';
  const maxTokens = parseInt(Deno.env.get('OPENAI_MAX_TOKENS') || '512');

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
    throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
    throw new Error('DeepSeek API returned no choices');
  }

  return data.choices[0].message.content.trim();
}

// 生成智能问题
async function generateSmartQuestion(
  userId: string,
  chapter: string,
  history: any[],
  summary: any,
  supabase: any
): Promise<string> {
  const config = chapterConfig[chapter];
  if (!config) {
    throw new Error(`Unknown chapter: ${chapter}`);
  }

  if (!history || history.length === 0) {
    return config.fallbackQuestions[0];
  }

  try {
    let prompt = `我正在和一位老人进行人生访谈，当前章节是"${chapter}"（${config.description}）。\n\n`;
    
    prompt += '【对话历史】\n';
    const recentHistory = history.slice(-3);
    for (const record of recentHistory) {
      prompt += `问：${record.ai_question || record.question}\n`;
      prompt += `答：${record.user_answer || record.answer}\n\n`;
    }
    
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
    
    prompt += `【要求】\n请基于上述对话，生成下一个深入的追问。要求：\n`;
    prompt += `1. 自然延续当前话题，不要跳跃\n`;
    prompt += `2. 如果用户的回答中提到了有趣的细节，可以深入追问\n`;
    prompt += `3. 语气温暖、亲切，像朋友聊天\n`;
    prompt += `4. 问题要具体，避免空泛\n`;
    prompt += `5. 只输出问题本身，不要其他内容\n\n`;
    prompt += `请直接输出下一个问题：`;

    const systemPrompt = '你是一位富有同理心的AI记者，专门帮助老年人回忆和记录人生故事。你的问题要温暖、自然、有针对性，像朋友间的对话一样。';
    
    let question = await callDeepSeek(prompt, systemPrompt);
    question = question.replace(/^问：|^问题：|^Q:|^下一个问题：/i, '').trim();
    question = question.replace(/^["']|["']$/g, '').trim();

    return question || config.fallbackQuestions[0];
  } catch (error) {
    console.error('Error generating question:', error);
    const usedQuestions = history.map(h => h.ai_question || h.question);
    const availableQuestions = config.fallbackQuestions.filter(
      q => !usedQuestions.includes(q)
    );
    return availableQuestions.length > 0 ? availableQuestions[0] : '还有什么想分享的故事吗？';
  }
}

// 路由处理
async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname.replace('/api/v1', '');

  // 健康检查（无需认证）
  if (path === '/health' || path === '') {
    return successResponse({
      service: 'Memoir API Gateway',
      version: '1.0.0',
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  }

  // 认证端点（无需认证）
  if (path === '/auth/verify' && req.method === 'POST') {
    const auth = await authenticate(req);
    if (auth) {
      return successResponse({
        authenticated: true,
        userId: auth.userId
      });
    }
    return errorResponse('UNAUTHORIZED', 'Invalid or missing token', null, 401);
  }

  // 需要认证的端点
  const auth = await authenticate(req);
  if (!auth) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', null, 401);
  }

  const { userId, supabase } = auth;

  // ========== 对话管理 API ==========
  
  // GET /api/v1/conversations?chapter=xxx&sessionId=xxx
  if (path.startsWith('/conversations') && req.method === 'GET') {
    const chapter = url.searchParams.get('chapter');
    const sessionId = url.searchParams.get('sessionId');

    if (!chapter) {
      return errorResponse('BAD_REQUEST', 'chapter parameter is required');
    }

    try {
      let query = supabase
        .from('conversation_history')
        .select('*')
        .eq('user_id', userId)
        .eq('chapter', chapter);

      if (sessionId) {
        query = query.eq('session_id', sessionId);
      }

      query = query.order('round_number', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;

      // 获取摘要
      const { data: summary } = await supabase
        .from('conversation_summary')
        .select('*')
        .eq('user_id', userId)
        .eq('chapter', chapter)
        .single();

      return successResponse({
        conversations: data || [],
        summary: summary || null,
        totalRounds: data?.length || 0
      });
    } catch (error: any) {
      return errorResponse('INTERNAL_ERROR', 'Failed to fetch conversations', error.message, 500);
    }
  }

  // POST /api/v1/conversations/next-question
  if (path === '/conversations/next-question' && req.method === 'POST') {
    try {
      const { chapter, sessionId } = await req.json();

      if (!chapter || !sessionId) {
        return errorResponse('BAD_REQUEST', 'chapter and sessionId are required');
      }

      // 获取对话历史
      const { data: history, error: historyError } = await supabase
        .from('conversation_history')
        .select('*')
        .eq('user_id', userId)
        .eq('chapter', chapter)
        .eq('session_id', sessionId)
        .order('round_number', { ascending: true });

      if (historyError) throw historyError;

      // 获取摘要
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
        supabase
      );

      // 保存问题
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

      if (insertError) throw insertError;

      return successResponse({
        question,
        roundNumber: nextRoundNumber,
        chapter
      });
    } catch (error: any) {
      return errorResponse('INTERNAL_ERROR', 'Failed to generate question', error.message, 500);
    }
  }

  // POST /api/v1/conversations/save-answer
  if (path === '/conversations/save-answer' && req.method === 'POST') {
    try {
      const { chapter, sessionId, roundNumber, answer } = await req.json();

      if (!chapter || !sessionId || roundNumber === undefined || !answer) {
        return errorResponse('BAD_REQUEST', 'chapter, sessionId, roundNumber, and answer are required');
      }

      // 更新回答
      const { error: updateError } = await supabase
        .from('conversation_history')
        .update({ user_answer: answer })
        .eq('user_id', userId)
        .eq('chapter', chapter)
        .eq('session_id', sessionId)
        .eq('round_number', roundNumber);

      if (updateError) throw updateError;

      // 更新摘要（简化版，可以后续优化）
      // TODO: 调用 AI 提取关键信息

      // 生成下一个问题
      const { data: history } = await supabase
        .from('conversation_history')
        .select('*')
        .eq('user_id', userId)
        .eq('chapter', chapter)
        .eq('session_id', sessionId)
        .order('round_number', { ascending: true });

      const { data: summary } = await supabase
        .from('conversation_summary')
        .select('*')
        .eq('user_id', userId)
        .eq('chapter', chapter)
        .single();

      const nextQuestion = await generateSmartQuestion(
        userId,
        chapter,
        history || [],
        summary,
        supabase
      );

      const nextRoundNumber = roundNumber + 1;
      await supabase
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

      return successResponse({
        saved: true,
        nextQuestion,
        nextRoundNumber
      });
    } catch (error: any) {
      return errorResponse('INTERNAL_ERROR', 'Failed to save answer', error.message, 500);
    }
  }

  // ========== 灵感记录 API ==========

  // GET /api/v1/inspirations?chapter=xxx&category=xxx
  if (path.startsWith('/inspirations') && req.method === 'GET') {
    const chapter = url.searchParams.get('chapter');
    const category = url.searchParams.get('category');

    try {
      let query = supabase
        .from('inspiration_records')
        .select('*')
        .eq('user_id', userId);

      if (chapter) {
        query = query.eq('chapter', chapter);
      }
      if (category) {
        query = query.eq('category', category);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      return successResponse({
        inspirations: data || [],
        total: data?.length || 0
      });
    } catch (error: any) {
      return errorResponse('INTERNAL_ERROR', 'Failed to fetch inspirations', error.message, 500);
    }
  }

  // POST /api/v1/inspirations
  if (path === '/inspirations' && req.method === 'POST') {
    try {
      const { content, chapter, category } = await req.json();

      if (!content || !chapter || !category) {
        return errorResponse('BAD_REQUEST', 'content, chapter, and category are required');
      }

      const { data, error } = await supabase
        .from('inspiration_records')
        .insert({
          user_id: userId,
          chapter: chapter,
          category: category,
          content: content,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return successResponse({
        inspiration: data,
        created: true
      }, 201);
    } catch (error: any) {
      return errorResponse('INTERNAL_ERROR', 'Failed to create inspiration', error.message, 500);
    }
  }

  // POST /api/v1/inspirations/classify
  if (path === '/inspirations/classify' && req.method === 'POST') {
    try {
      const { text, chapter } = await req.json();

      if (!text) {
        return errorResponse('BAD_REQUEST', 'text is required');
      }

      const classificationPrompt = `请分析以下文本内容，判断它最应该属于哪个传记章节：

文本内容：${text}
当前章节：${chapter || '未指定'}

可选章节：
1. 童年故里（childhood）- 童年时期的成长经历、家庭环境、故乡记忆
2. 青春之歌（youth）- 青少年时期的学习、成长、梦想和转折
3. 事业征程（career）- 工作生涯、职业发展、事业成就
4. 家庭港湾（family）- 家庭生活、婚姻家庭、亲情关系
5. 流金岁月（reflection）- 退休生活、人生感悟、经验智慧

请只返回一个章节标识（childhood, youth, career, family, 或 reflection），不要其他内容。`;

      const category = await callDeepSeek(classificationPrompt);
      const cleanCategory = category.toLowerCase().trim().replace(/[^a-z]/g, '');

      const validCategories = ['childhood', 'youth', 'career', 'family', 'reflection'];
      const finalCategory = validCategories.includes(cleanCategory) 
        ? cleanCategory 
        : (chapter || 'childhood');

      return successResponse({
        category: finalCategory,
        categoryName: chapterConfig[finalCategory]?.description || finalCategory,
        confidence: 'high'
      });
    } catch (error: any) {
      return errorResponse('INTERNAL_ERROR', 'Failed to classify content', error.message, 500);
    }
  }

  // DELETE /api/v1/inspirations/:id
  if (path.match(/^\/inspirations\/([^\/]+)$/) && req.method === 'DELETE') {
    const match = path.match(/^\/inspirations\/([^\/]+)$/);
    const id = match?.[1];

    if (!id) {
      return errorResponse('BAD_REQUEST', 'inspiration id is required');
    }

    try {
      const { error } = await supabase
        .from('inspiration_records')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;

      return successResponse({
        deleted: true,
        id
      });
    } catch (error: any) {
      return errorResponse('INTERNAL_ERROR', 'Failed to delete inspiration', error.message, 500);
    }
  }

  // ========== 传记管理 API ==========

  // GET /api/v1/biographies
  if (path === '/biographies' && req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('biographies')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return successResponse({
        biographies: data || [],
        total: data?.length || 0
      });
    } catch (error: any) {
      return errorResponse('INTERNAL_ERROR', 'Failed to fetch biographies', error.message, 500);
    }
  }

  // POST /api/v1/biographies/generate
  if (path === '/biographies/generate' && req.method === 'POST') {
    try {
      const { chapter, writingStyle, title } = await req.json();

      if (!chapter || !writingStyle) {
        return errorResponse('BAD_REQUEST', 'chapter and writingStyle are required');
      }

      // 获取对话历史
      const { data: conversations } = await supabase
        .from('conversation_history')
        .select('*')
        .eq('user_id', userId)
        .eq('chapter', chapter)
        .order('round_number', { ascending: true });

      if (!conversations || conversations.length === 0) {
        return errorResponse('BAD_REQUEST', 'No conversation data found for this chapter');
      }

      // 构建传记生成提示
      const stylePrompts: Record<string, string> = {
        'moyan': '莫言的乡土魔幻风格 - 运用感官细节、乡土语言、魔幻现实主义手法',
        'liucixin': '刘慈欣的宏大叙事风格 - 理性思维、宏观视角、科技与人文结合',
        'yiqiuyu': '余秋雨的文化哲思风格 - 文化意象、历史典故、沉静思辨'
      };

      const interviewData = conversations.map(c => ({
        question: c.ai_question || c.question,
        answer: c.user_answer || c.answer
      }));

      const systemPrompt = `你是一位专业的传记作家，擅长将人生故事转化为优美的文学作品。

文风要求：${stylePrompts[writingStyle] || '温暖叙事、文学化表达'}
标题：${title || '我的人生故事'}

访谈内容：
${JSON.stringify(interviewData, null, 2)}

请根据访谈内容，创作一篇个人传记。要求：
1. 使用第一人称或第三人称叙事
2. 注重细节描写和情感表达
3. 保持故事的连贯性和真实感
4. 语言优美，富有文学性
5. 篇幅适中(2000-3000字)

请直接输出传记正文，不要其他说明。`;

      const biography = await callDeepSeek(systemPrompt, '你是一位专业的传记作家，擅长将人生故事转化为优美的文学作品。');

      // 保存传记
      const { data: savedBiography, error: saveError } = await supabase
        .from('biographies')
        .insert({
          user_id: userId,
          title: title || '我的人生故事',
          content: biography,
          writing_style: writingStyle,
          status: 'completed',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (saveError) throw saveError;

      return successResponse({
        biography: savedBiography,
        generated: true,
        wordCount: biography.length
      }, 201);
    } catch (error: any) {
      return errorResponse('INTERNAL_ERROR', 'Failed to generate biography', error.message, 500);
    }
  }

  // GET /api/v1/biographies/:id
  if (path.match(/^\/biographies\/([^\/]+)$/) && req.method === 'GET') {
    const match = path.match(/^\/biographies\/([^\/]+)$/);
    const id = match?.[1];

    if (!id) {
      return errorResponse('BAD_REQUEST', 'biography id is required');
    }

    try {
      const { data, error } = await supabase
        .from('biographies')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      if (!data) {
        return errorResponse('NOT_FOUND', 'Biography not found', null, 404);
      }

      return successResponse({ biography: data });
    } catch (error: any) {
      return errorResponse('INTERNAL_ERROR', 'Failed to fetch biography', error.message, 500);
    }
  }

  // ========== 章节信息 API ==========

  // GET /api/v1/chapters
  if (path === '/chapters' && req.method === 'GET') {
    const chapters = Object.keys(chapterConfig).map(key => ({
      id: key,
      name: key,
      description: chapterConfig[key].description,
      themes: chapterConfig[key].themes
    }));

    return successResponse({ chapters });
  }

  // ========== AI访谈 API ==========

  // POST /api/v1/interview/start - AI起始对话，检测内容缺失
  if (path === '/interview/start' && req.method === 'POST') {
    try {
      const { chapter, sessionId, userAnswer, roundNumber } = await req.json();

      if (!chapter) {
        return errorResponse('BAD_REQUEST', 'chapter is required');
      }

      // 调用interview-start Edge Function
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const functionUrl = `${supabaseUrl}/functions/v1/interview-start`;
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

      const functionResponse = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`
        },
        body: JSON.stringify({
          userId,
          chapter,
          sessionId,
          userAnswer,
          roundNumber
        })
      });

      const functionData = await functionResponse.json();
      
      if (!functionResponse.ok) {
        return errorResponse('INTERNAL_ERROR', 'Failed to start interview', functionData, 500);
      }

      return successResponse(functionData.data || functionData);
    } catch (error: any) {
      return errorResponse('INTERNAL_ERROR', 'Failed to start interview', error.message, 500);
    }
  }

  // ========== 回忆录生成 API ==========

  // POST /api/v1/memoir/generate - 生成回忆录，返回webUI格式
  if (path === '/memoir/generate' && req.method === 'POST') {
    try {
      const { chapter, writingStyle, title, saveToDatabase } = await req.json();

      if (!writingStyle) {
        return errorResponse('BAD_REQUEST', 'writingStyle is required');
      }

      // 调用memoir-generate Edge Function
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const functionUrl = `${supabaseUrl}/functions/v1/memoir-generate`;
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

      const functionResponse = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`
        },
        body: JSON.stringify({
          userId,
          chapter,
          writingStyle,
          title,
          saveToDatabase
        })
      });

      const functionData = await functionResponse.json();
      
      if (!functionResponse.ok) {
        return errorResponse('INTERNAL_ERROR', 'Failed to generate memoir', functionData, 500);
      }

      return successResponse(functionData.data || functionData);
    } catch (error: any) {
      return errorResponse('INTERNAL_ERROR', 'Failed to generate memoir', error.message, 500);
    }
  }

  // ========== 404 ==========
  return errorResponse('NOT_FOUND', `Route ${path} not found`, null, 404);
}

// 主处理函数
Deno.serve(async (req) => {
  // 处理 CORS 预检请求
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    return await handleRequest(req);
  } catch (error: any) {
    console.error('Unhandled error:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      'Internal server error',
      error.message,
      500
    );
  }
});
