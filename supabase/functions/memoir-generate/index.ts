// 生成回忆录API - 用LLM生成回忆录，返回webUI格式
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// 文风配置
const stylePrompts: Record<string, string> = {
  'moyan': '莫言的乡土魔幻风格 - 运用感官细节、乡土语言、魔幻现实主义手法',
  'liucixin': '刘慈欣的宏大叙事风格 - 理性思维、宏观视角、科技与人文结合',
  'yiqiuyu': '余秋雨的文化哲思风格 - 文化意象、历史典故、沉静思辨',
  'default': '温暖叙事、文学化表达'
};

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

// 调用LLM API生成回忆录（流式返回）
async function generateMemoirStream(
  conversations: any[],
  writingStyle: string,
  title: string,
  chapter?: string,
  onProgress?: (chunk: string, percentage: number) => void
): Promise<string> {
  // 获取 API key，去除前后空格
  let apiKey = Deno.env.get('OPENAI_API_KEY') || Deno.env.get('GEMINI_API_KEY');
  if (apiKey) {
    apiKey = apiKey.trim();
  }
  
  if (!apiKey || apiKey.length === 0) {
    console.error('LLM API key not configured. Please set OPENAI_API_KEY or GEMINI_API_KEY environment variable.');
    throw new Error('LLM API key not configured. Please configure OPENAI_API_KEY or GEMINI_API_KEY in Supabase project settings.');
  }

  // 记录配置信息（不记录完整 key）
  const apiKeyPrefix = apiKey.substring(0, 8) + '...';
  console.log(`Using LLM API: baseUrl=${Deno.env.get('OPENAI_BASE_URL') || 'https://api.ppinfra.com/openai'}, model=${Deno.env.get('OPENAI_MODEL') || 'deepseek/deepseek-r1'}, apiKey=${apiKeyPrefix}`);

  const baseUrl = Deno.env.get('OPENAI_BASE_URL') || 'https://api.ppinfra.com/openai';
  const model = Deno.env.get('OPENAI_MODEL') || 'pa/gmn-2.5-fls';
  const maxTokens = parseInt(Deno.env.get('OPENAI_MAX_TOKENS') || '4000');

  // 构建访谈数据（适配不同的表结构）
  const interviewData = conversations.map(c => ({
    question: c.question || c.ai_question,
    answer: c.answer || c.user_answer
  }));

  const systemPrompt = `你是一位专业的传记作家，擅长将人生故事转化为优美的文学作品。

文风要求：${stylePrompts[writingStyle] || stylePrompts['default']}
标题：${title}
${chapter ? `章节：${chapter}` : ''}

访谈内容：
${JSON.stringify(interviewData, null, 2)}

请根据访谈内容，创作一篇个人传记。要求：
1. 使用第一人称或第三人称叙事
2. 注重细节描写和情感表达
3. 保持故事的连贯性和真实感
4. 语言优美，富有文学性
5. 篇幅适中(2000-3000字)
6. 段落之间用双换行符分隔

请直接输出传记正文，不要其他说明。`;

  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: '你是一位专业的传记作家，擅长将人生故事转化为优美的文学作品。请基于真实访谈内容创作，绝不编造或虚构未提及的事实。'
        },
        {
          role: 'user',
          content: systemPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: maxTokens,
      top_p: 0.9,
      stream: true
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`LLM API call failed: status=${response.status}, error=${errorText}`);
    
    if (response.status === 401) {
      throw new Error(`LLM API authentication failed (401). Please check if your API key is valid and correctly configured in Supabase project settings. Error details: ${errorText}`);
    } else if (response.status === 403) {
      throw new Error(`LLM API access forbidden (403). Please check your API key permissions. Error details: ${errorText}`);
    } else if (response.status === 429) {
      throw new Error(`LLM API rate limit exceeded (429). Please try again later. Error details: ${errorText}`);
    } else {
      throw new Error(`LLM API error (${response.status}): ${errorText}`);
    }
  }

  // 处理流式响应
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let fullContent = '';
  let buffer = '';
  
  if (!reader) {
    throw new Error('Response body is not readable');
  }

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullContent += content;
              // 计算进度（估算）
              const estimatedTotal = maxTokens * 2; // 估算总字符数
              const percentage = Math.min(95, Math.floor((fullContent.length / estimatedTotal) * 100));
              if (onProgress) {
                onProgress(content, percentage);
              }
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  if (!fullContent) {
    throw new Error('LLM API returned empty content');
  }

  const rawContent = fullContent.trim();
  
  // 清理思考内容
  const cleanedContent = cleanThinkingContent(rawContent);
  
  if (cleanedContent !== rawContent) {
    console.log(`[CLEAN] 已清理思考内容, 原始长度=${rawContent.length}, 清理后长度=${cleanedContent.length}`);
  }
  
  return cleanedContent;
}

// 生成webUI格式的HTML
function generateWebUIHTML(
  title: string,
  content: string,
  writingStyle: string,
  createdAt: string
): string {
  const styleName = writingStyle === 'moyan' ? '莫言' : 
                    writingStyle === 'liucixin' ? '刘慈欣' : 
                    writingStyle === 'yiqiuyu' ? '余秋雨' : '默认';

  // 将内容分段处理
  const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
  
  // 生成段落HTML
  const paragraphsHTML = paragraphs.map((paragraph, index) => {
    const trimmed = paragraph.trim();
    
    // 第一段使用drop-cap样式
    if (index === 0) {
      return `<p class="drop-cap" style="font-family: 'Georgia', serif; font-size: 18px; line-height: 1.7; margin-bottom: 1.5rem; color: #1A1A1A;">
        ${trimmed}
      </p>`;
    }
    
    // 每4段插入一个pull quote
    if (index % 4 === 0 && trimmed.length > 50) {
      const quoteText = trimmed.length > 100 ? trimmed.slice(0, 100) + '...' : trimmed;
      return `<blockquote class="pull-quote" style="font-family: 'Georgia', serif; font-size: 24px; line-height: 1.6; margin: 2rem 0; padding: 1.5rem 0; border-left: 4px solid #D4A574; padding-left: 1.5rem; color: #4A4A4A; font-style: italic;">
        "${quoteText}"
      </blockquote>`;
    }
    
    // 普通段落
    return `<p style="font-family: 'Georgia', serif; font-size: 18px; line-height: 1.7; margin-bottom: 1.5rem; color: #1A1A1A;">
      ${trimmed}
    </p>`;
  }).join('\n');

  const dateStr = new Date(createdAt).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      background-color: #FEFEFE;
      color: #1A1A1A;
      line-height: 1.6;
    }
    
    .hero-section {
      position: relative;
      height: 70vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(to bottom, #E8C9A0, #F9F9F7);
      margin-bottom: 0;
    }
    
    .hero-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(0, 0, 0, 0.2), transparent);
    }
    
    .hero-content {
      position: relative;
      max-width: 800px;
      margin: 0 auto;
      padding: 0 1.5rem;
      text-align: center;
      z-index: 1;
    }
    
    .hero-title {
      font-size: 64px;
      font-weight: bold;
      margin-bottom: 1.5rem;
      color: #1A1A1A;
      font-family: 'Noto Serif SC', serif;
    }
    
    .hero-date {
      font-size: 18px;
      color: #6B6B6B;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    
    .actions-bar {
      position: sticky;
      top: 0;
      background-color: rgba(254, 254, 254, 0.95);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid #E5E5E0;
      z-index: 10;
      padding: 1rem 0;
    }
    
    .actions-content {
      max-width: 800px;
      margin: 0 auto;
      padding: 0 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .article-container {
      max-width: 650px;
      margin: 0 auto;
      padding: 4rem 1.5rem;
    }
    
    .drop-cap {
      font-size: 72px;
      line-height: 0.8;
      float: left;
      margin-right: 0.5rem;
      margin-top: 0.1rem;
      color: #D4A574;
      font-weight: bold;
    }
    
    .pull-quote {
      font-size: 24px;
      line-height: 1.6;
      margin: 2rem 0;
      padding: 1.5rem 0;
      border-left: 4px solid #D4A574;
      padding-left: 1.5rem;
      color: #4A4A4A;
      font-style: italic;
    }
    
    .footer {
      margin-top: 4rem;
      padding-top: 2rem;
      border-top: 1px solid #E5E5E0;
      text-align: center;
      font-size: 14px;
      color: #6B6B6B;
    }
    
    @media (max-width: 768px) {
      .hero-title {
        font-size: 36px;
      }
      
      .article-container {
        padding: 2rem 1rem;
      }
      
      .drop-cap {
        font-size: 48px;
      }
    }
  </style>
</head>
<body>
  <!-- Hero Section -->
  <div class="hero-section">
    <div class="hero-overlay"></div>
    <div class="hero-content">
      <h1 class="hero-title">${title}</h1>
      <p class="hero-date">${dateStr}</p>
    </div>
  </div>

  <!-- Actions Bar -->
  <div class="actions-bar">
    <div class="actions-content">
      <div></div>
      <div style="display: flex; gap: 0.75rem;">
        <button onclick="window.print()" style="padding: 0.5rem 1rem; border: 1px solid #E5E5E0; background: white; border-radius: 4px; cursor: pointer; font-size: 14px;">
          打印
        </button>
      </div>
    </div>
  </div>

  <!-- Article Content -->
  <article class="article-container">
    ${paragraphsHTML}
    
    <div class="footer">
      本传记由纪传体AI应用生成 · 采用${styleName}文风
    </div>
  </article>
</body>
</html>`;
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
    const { userId, chapter, writingStyle, title } = requestData;

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 获取对话历史
    // 尝试查询，处理可能的列名差异（question/answer vs ai_question/user_answer）
    let query = supabase
      .from('conversation_history')
      .select('*')
      .eq('user_id', userId)
      .order('round_number', { ascending: true });

    if (chapter) {
      query = query.eq('chapter', chapter);
    }

    const { data: conversations, error: conversationsError } = await query;

    if (conversationsError) {
      console.error('Error querying conversation_history:', conversationsError);
      // 尝试更详细的错误信息
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Database query error',
          message: conversationsError.message,
          details: `Failed to query conversations for user ${userId}${chapter ? `, chapter ${chapter}` : ''}`
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!conversations || conversations.length === 0) {
      // 添加调试信息：检查是否有任何对话记录
      const { data: allConversations, error: checkError } = await supabase
        .from('conversation_history')
        .select('id, user_id, chapter, round_number')
        .eq('user_id', userId)
        .limit(5);
      
      console.log(`No conversations found for user ${userId}${chapter ? `, chapter ${chapter}` : ''}`);
      if (!checkError && allConversations && allConversations.length > 0) {
        console.log(`Found ${allConversations.length} conversations for user, but none match the criteria`);
        console.log('Sample conversations:', JSON.stringify(allConversations, null, 2));
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No conversation data found',
          message: chapter ? `No conversations found for chapter: ${chapter}` : 'No conversations found for user',
          debug: {
            userId,
            chapter: chapter || 'all',
            totalConversationsForUser: allConversations?.length || 0
          }
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${conversations.length} conversations for user ${userId}${chapter ? `, chapter ${chapter}` : ''}`);

    // 过滤出有完整问答的对话（适配不同的列名）
    const validConversations = conversations.filter(c => {
      const hasQuestion = !!(c.question || c.ai_question);
      const hasAnswer = !!(c.answer || c.user_answer);
      return hasQuestion && hasAnswer;
    });

    if (validConversations.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No valid conversation data found',
          message: 'Found conversations but none have both question and answer',
          debug: {
            userId,
            chapter: chapter || 'all',
            totalConversations: conversations.length,
            conversationsWithQuestions: conversations.filter(c => !!(c.question || c.ai_question)).length,
            conversationsWithAnswers: conversations.filter(c => !!(c.answer || c.user_answer)).length
          }
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Using ${validConversations.length} valid conversations (with both Q&A) out of ${conversations.length} total`);

    // 异步生成回忆录内容，返回流式进度
    // 检查是否请求流式响应
    if (requestData.stream === true) {
      // 返回Server-Sent Events流
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          
          try {
            let generatedContent = '';
            
            await generateMemoirStream(
              validConversations,
              writingStyle || 'default',
              title || '我的人生故事',
              chapter,
              (chunk: string, percentage: number) => {
                generatedContent += chunk;
                // 发送进度更新
                const message = `data: ${JSON.stringify({ type: 'progress', percentage, chunk })}\n\n`;
                controller.enqueue(encoder.encode(message));
              }
            );
            
            // 发送完成消息
            const completeMessage = `data: ${JSON.stringify({ type: 'complete', percentage: 100, content: generatedContent })}\n\n`;
            controller.enqueue(encoder.encode(completeMessage));
            controller.close();
            
            // 保存到数据库
            if (requestData.saveToDatabase !== false) {
              await supabase
                .from('biographies')
                .insert({
                  user_id: userId,
                  title: title || '我的人生故事',
                  content: generatedContent,
                  writing_style: writingStyle || 'default',
                  status: 'completed',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                });
            }
          } catch (error: any) {
            const errorMessage = `data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`;
            controller.enqueue(encoder.encode(errorMessage));
            controller.close();
          }
        }
      });

      return new Response(stream, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    }

    // 非流式模式：传统方式生成
    const memoirContent = await generateMemoirStream(
      validConversations,
      writingStyle || 'default',
      title || '我的人生故事',
      chapter
    );

    // 生成webUI格式的HTML
    const htmlContent = generateWebUIHTML(
      title || '我的人生故事',
      memoirContent,
      writingStyle || 'default',
      new Date().toISOString()
    );

    // 可选：保存到数据库
    if (requestData.saveToDatabase !== false) {
      try {
        const { data: savedBiography, error: saveError } = await supabase
          .from('biographies')
          .insert({
            user_id: userId,
            title: title || '我的人生故事',
            content: memoirContent,
            writing_style: writingStyle || 'default',
            status: 'completed',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (saveError) {
          console.error('Error saving biography:', saveError);
        }
        // 即使保存失败，也返回生成的回忆录
      } catch (saveErr) {
        console.error('Error saving biography:', saveErr);
      }
    }

    // 返回响应
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          title: title || '我的人生故事',
          content: memoirContent,
          html: htmlContent,
          wordCount: memoirContent.length,
          writingStyle: writingStyle || 'default',
          chapter: chapter || 'all',
          generatedAt: new Date().toISOString()
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

