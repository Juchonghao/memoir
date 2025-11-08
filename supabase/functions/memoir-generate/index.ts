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

// 调用LLM API生成回忆录
async function generateMemoir(
  conversations: any[],
  writingStyle: string,
  title: string,
  chapter?: string
): Promise<string> {
  const apiKey = Deno.env.get('OPENAI_API_KEY') || Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    throw new Error('API key not configured');
  }

  const baseUrl = Deno.env.get('OPENAI_BASE_URL') || 'https://api.ppinfra.com/openai';
  const model = Deno.env.get('OPENAI_MODEL') || 'deepseek/deepseek-r1';
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
          content: '你是一位专业的传记作家，擅长将人生故事转化为优美的文学作品。'
        },
        {
          role: 'user',
          content: systemPrompt
        }
      ],
      temperature: 0.9,
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
      throw conversationsError;
    }

    if (!conversations || conversations.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No conversation data found',
          message: chapter ? `No conversations found for chapter: ${chapter}` : 'No conversations found for user'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 生成回忆录内容
    const memoirContent = await generateMemoir(
      conversations,
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

