// AI访谈引导功能 - 生成访谈问题和追问
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
    const { chapter, userAnswer, roundNumber, conversationHistory } = await req.json();
    
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    // 根据章节生成合适的问题
    const chapterContext = {
      'childhood': '童年故里 - 关于家乡、童年记忆、家庭成员',
      'youth': '青春之歌 - 关于校园、青春时光、友情爱情',
      'career': '事业征程 - 关于职业发展、工作经历、成就',
      'family': '家庭港湾 - 关于家庭生活、亲情支持',
      'reflection': '流金岁月 - 关于人生感悟、经验智慧'
    };

    let systemPrompt;
    
    if (userAnswer) {
      // 分析用户回答并生成跟进问题
      systemPrompt = `你是一位温暖、专业的央视纪录片记者，正在进行深度访谈。
当前主题：${chapterContext[chapter] || chapter}
轮次：第${roundNumber}轮

受访者刚才说："${userAnswer}"

请分析这个回答，然后生成一个自然的跟进问题。

分析要求：
1. 识别回答的情感色彩（开心、犹豫、回避、详细等）
2. 如果回答简短或回避，给出鼓励性追问
3. 如果回答详细，从中提取关键细节进行深入
4. 语气要温暖、理解和鼓励

要求：
1. 给出简短的分析（1-2句话）
2. 然后生成跟进问题
3. 问题要自然衔接，不突兀
4. 语气温暖、亲切
5. 问题简洁(不超过40字)

格式：
分析：[分析内容]
跟进问题：[问题内容]`;
    } else {
      // 首次提问
      systemPrompt = `你是一位温暖、专业的央视纪录片记者，擅长引导受访者回忆人生故事。
当前主题：${chapterContext[chapter] || chapter}
轮次：第${roundNumber}轮

请生成一个具有画面感和故事性的开场问题，帮助受访者回忆细节。
要求：
1. 问题要具体、有画面感
2. 从感官细节入手（视觉、听觉、嗅觉等）
3. 语气温暖、亲切、不生硬
4. 每个问题要简洁(不超过50字)

只返回问题本身，不要其他解释。`;
    }

    const requestBody = {
      contents: [{
        parts: [{
          text: systemPrompt
        }]
      }],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 200,
        topP: 0.9,
        topK: 40,
      }
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
      console.error('Invalid Gemini API response:', data);
      throw new Error('Invalid response format from Gemini API');
    }
    
    const responseText = data.candidates[0].content.parts[0].text.trim();
    
    let analysis = '';
    let question = '';
    
    if (userAnswer) {
      // 解析分析+跟进问题的格式
      const lines = responseText.split('\n');
      let foundAnalysis = false;
      let foundQuestion = false;
      
      for (const line of lines) {
        if (line.startsWith('分析：')) {
          analysis = line.replace('分析：', '').trim();
          foundAnalysis = true;
        } else if (line.startsWith('跟进问题：')) {
          question = line.replace('跟进问题：', '').trim();
          foundQuestion = true;
        } else if (!foundAnalysis && line.trim() && !foundQuestion) {
          // 如果没有明确标记，尝试智能解析
          if (line.length < 50 && !line.includes('？') && !line.includes('?')) {
            analysis = line.trim();
            foundAnalysis = true;
          } else {
            question = line.trim();
            foundQuestion = true;
          }
        }
      }
      
      // 如果没有找到明确的跟进问题，使用整段作为问题
      if (!question) {
        question = responseText;
        analysis = '感谢您的分享。';
      }
    } else {
      // 首次提问
      question = responseText;
      analysis = '让我们开始这个美好的回忆之旅。';
    }

    return new Response(
      JSON.stringify({ 
        question,
        analysis,
        roundNumber: roundNumber + 1,
        suggestions: []
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