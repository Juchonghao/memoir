// 简化版AI访谈引导功能
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
    const { chapter, userAnswer, roundNumber } = await req.json();
    
    let analysis = '';
    let question = '';

    // 首次提问
    if (!userAnswer) {
      const questions = [
        '能告诉我您童年时最难忘的一个场景吗？',
        '您小时候最喜欢去哪里玩呢？',
        '童年时有什么特别让您印象深刻的事情吗？',
        '能说说您童年时最要好的小伙伴吗？'
      ];
      question = questions[Math.floor(Math.random() * questions.length)];
      analysis = '让我们开始这个美好的回忆之旅。';
    } else {
      // 分析用户回答
      const answer = userAnswer.trim();
      
      // 如果是地点类回答（如"小花园"）
      if (['小花园', '公园', '学校', '家', '河边', '山上', '田野'].includes(answer)) {
        analysis = '听起来是个很美好的地方。';
        const followUps = [
          '能告诉我您在那里都做些什么吗？',
          '那个地方最吸引您的是什么？',
          '您还记得在那里发生的特别的事情吗？',
          '您通常和谁一起去那里呢？'
        ];
        question = followUps[Math.floor(Math.random() * followUps.length)];
      }
      // 如果是简短回答
      else if (answer.length < 10) {
        analysis = '能感受到您对这个话题的珍惜。';
        const followUps = [
          '能再具体说说吗？',
          '当时的心情是怎样的？',
          '还有什么相关的回忆吗？',
          '那个场景中最打动您的是什么？'
        ];
        question = followUps[Math.floor(Math.random() * followUps.length)];
      }
      // 如果是详细回答
      else if (answer.length > 50) {
        analysis = '感谢您分享了这么详细的经历。';
        const followUps = [
          '那个场景中最让您印象深刻的是什么细节？',
          '这件事对您后来的成长有什么影响？',
          '现在回想起来有什么特别的感觉？',
          '还有什么相关的回忆想要分享吗？'
        ];
        question = followUps[Math.floor(Math.random() * followUps.length)];
      }
      // 默认处理
      else {
        analysis = '感谢您的分享。';
        const followUps = [
          '能详细说说那个经历吗？',
          '当时您的感受如何？',
          '这件事对您有什么意义？',
          '还有什么相关的故事吗？'
        ];
        question = followUps[Math.floor(Math.random() * followUps.length)];
      }
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
