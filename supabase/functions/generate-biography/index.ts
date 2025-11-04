// AI传记生成功能 - 根据访谈内容生成传记
Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { interviewData, writingStyle, title } = await req.json();
    
    // 使用 DeepSeek API (OpenAI 兼容)
    const apiKey = Deno.env.get('OPENAI_API_KEY') || Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }
    
    const baseUrl = Deno.env.get('OPENAI_BASE_URL') || 'https://api.ppinfra.com/openai';
    const model = Deno.env.get('OPENAI_MODEL') || 'deepseek/deepseek-r1';
    const maxTokens = parseInt(Deno.env.get('OPENAI_MAX_TOKENS') || '4000');

    const stylePrompts = {
      'moyan': '莫言的乡土魔幻风格 - 运用感官细节、乡土语言、魔幻现实主义手法',
      'liucixin': '刘慈欣的宏大叙事风格 - 理性思维、宏观视角、科技与人文结合',
      'yiqiuyu': '余秋雨的文化哲思风格 - 文化意象、历史典故、沉静思辨'
    };

    const systemPrompt = `你是一位专业的传记作家，擅长将人生故事转化为优美的文学作品。

文风要求：${stylePrompts[writingStyle] || '温暖叙事、文学化表达'}
标题：${title}

访谈内容：
${JSON.stringify(interviewData, null, 2)}

请根据访谈内容，创作一篇个人传记。要求：
1. 使用第一人称或第三人称叙事
2. 注重细节描写和情感表达
3. 保持故事的连贯性和真实感
4. 语言优美，富有文学性
5. 篇幅适中(2000-3000字)

请直接输出传记正文，不要其他说明。`;

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
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // OpenAI 兼容格式
    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      throw new Error('DeepSeek API returned no choices');
    }
    
    const biography = data.choices[0].message.content.trim();

    return new Response(
      JSON.stringify({ 
        content: biography,
        wordCount: biography.length,
        generatedAt: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});