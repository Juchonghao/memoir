// AI访谈引导功能 - 带本地智能备用方案
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
    
    // 根据章节生成合适的问题
    const chapterContext = {
      'childhood': '童年故里 - 关于家乡、童年记忆、家庭成员',
      'youth': '青春之歌 - 关于校园、青春时光、友情爱情',
      'career': '事业征程 - 关于职业发展、工作经历、成就',
      'family': '家庭港湾 - 关于家庭生活、亲情支持',
      'reflection': '流金岁月 - 关于人生感悟、经验智慧'
    };

    // 首次提问的问题库
    const firstQuestions = {
      'childhood': [
        '能告诉我您童年时最难忘的一个场景吗？比如家乡的街道、房屋，或者家人的笑容？',
        '您小时候最喜欢去哪里玩？那里的样子您还记得吗？',
        '童年时家里有什么特别的味道或声音让您印象深刻吗？',
        '能说说您童年时最要好的小伙伴吗？你们一起做过什么有趣的事？'
      ],
      'youth': [
        '青春时期有什么特别让您印象深刻的事情吗？',
        '学生时代您最喜欢哪门课？为什么？',
        '青春时有什么特别的朋友或经历吗？',
        '那时候的梦想是什么？'
      ],
      'career': [
        '能告诉我您职业生涯中最有成就感的一件事吗？',
        '工作中遇到过什么特别的挑战，您是怎么克服的？',
        '是什么机缘让您选择了现在的工作？',
        '工作中有什么特别让您感动的时刻吗？'
      ],
      'family': [
        '能说说您印象中最温暖的家庭时光吗？',
        '家里有什么特别传统或习惯让您印象深刻？',
        '父母或家人有什么话或行为对您影响很大？',
        '家庭中有什么特别的回忆或故事吗？'
      ],
      'reflection': [
        '如果让您给年轻时的自己一个建议，您会说什么？',
        '人生中有什么特别让您感恩的经历？',
        '您觉得什么是生活中最重要的？',
        '有什么人生感悟想要分享的吗？'
      ]
    };

    // 智能回复策略
    const responseStrategies = {
      // 简短回答的跟进
      short: {
        'childhood': [
          '能再具体说说那个场景吗？比如当时您在做什么？',
          '那个记忆中最打动您的是什么？',
          '当时的心情是怎样的？',
          '还有谁在场吗？'
        ],
        'youth': [
          '能详细说说那个经历吗？',
          '当时您的感受如何？',
          '这件事对您有什么影响？',
          '还有什么相关的回忆吗？'
        ],
        'career': [
          '能详细说说那个项目或经历吗？',
          '当时面临的主要困难是什么？',
          '您是如何找到解决方案的？',
          '这件事对您的职业发展有什么影响？'
        ],
        'family': [
          '能详细说说那个时光吗？',
          '当时家里人的反应如何？',
          '这件事对您的家庭关系有什么影响？',
          '还有什么相关的家庭记忆吗？'
        ],
        'reflection': [
          '能详细解释一下您的这个感悟吗？',
          '这个想法是如何形成的？',
          '有什么具体的经历让您有这样的想法？',
          '您觉得这个感悟对您的生活有什么帮助？'
        ]
      },
      // 详细回答的深入
      detailed: {
        'childhood': [
          '那个场景中最让您印象深刻的是什么细节？',
          '当时的环境是怎样的？比如天气、声音、气味？',
          '这件事对您后来的成长有什么影响？',
          '现在回想起来有什么特别的感觉？'
        ],
        'youth': [
          '那个经历中最关键的转折点是什么？',
          '当时您是如何做决定的？',
          '这件事如何改变了您的想法或人生轨迹？',
          '现在回想起来有什么新的理解？'
        ],
        'career': [
          '那个成就中您最自豪的是什么？',
          '过程中有什么特别难忘的细节？',
          '这件事如何改变了您对工作的看法？',
          '您从中学到了什么重要的经验？'
        ],
        'family': [
          '那个时光中最温馨的细节是什么？',
          '当时每个人的表情或反应如何？',
          '这个经历如何加深了您的家庭感情？',
          '现在您如何传承这些家庭价值？'
        ],
        'reflection': [
          '这个感悟的形成过程是怎样的？',
          '有什么具体的经历验证了您的想法？',
          '这个想法如何指导您的生活选择？',
          '您希望如何将这个感悟传递给他人？'
        ]
      },
      // 情感回答的回应
      emotional: {
        'childhood': [
          '听起来那个记忆对您很珍贵，能说说为什么吗？',
          '那个情感背后有什么特别的故事？',
          '这个记忆如何影响了您的性格形成？',
          '现在想起那个场景还有什么感受？'
        ],
        'youth': [
          '那个情感体验对您有什么深远影响？',
          '这件事如何塑造了您的人生观？',
          '那个时期对您的成长有什么特别意义？',
          '现在您如何看待那段经历？'
        ],
        'career': [
          '那个成就背后的努力和坚持一定很不容易，能说说吗？',
          '这个经历如何坚定了您的职业信念？',
          '工作中还有什么类似的感动时刻吗？',
          '您觉得这种成就感对您的人生有什么意义？'
        ],
        'family': [
          '家庭的温暖一定给您很多力量，能具体说说吗？',
          '这些家庭经历如何塑造了您对爱的理解？',
          '您如何将这份家庭的温暖传递下去？',
          '家庭对您的人生有什么重要意义？'
        ],
        'reflection': [
          '这个人生感悟一定经历了很深的思考，能分享更多吗？',
          '这个想法如何影响了您的人生态度？',
          '您觉得这个感悟对其他人有什么启发意义？',
          '这个人生智慧如何指导您的日常选择？'
        ]
      }
    };

    let analysis = '';
    let question = '';

    if (!userAnswer) {
      // 首次提问
      const questions = firstQuestions[chapter] || firstQuestions['childhood'];
      question = questions[Math.floor(Math.random() * questions.length)];
      analysis = '让我们开始这个美好的回忆之旅。';
    } else {
      // 分析用户回答并生成跟进
      const answer = userAnswer.toLowerCase().trim();
      
      // 简短回答检测 - 优化逻辑
      const isShort = (answer.length < 8 && !answer.includes('爬') && !answer.includes('跑') && !answer.includes('跳') && !answer.includes('玩') && !answer.includes('做') && !answer.includes('去')) ||
                     ['是', '好的', '嗯', '是的', '对', '没有', '不知道', '不想说', '不记得', '没什么'].some(word => answer.includes(word));
      
      // 情感词汇检测
      const emotionalWords = ['开心', '快乐', '高兴', '难过', '伤心', '感动', '温暖', '感谢', '珍贵', '难忘', '激动', '兴奋', '害怕', '紧张'];
      const hasEmotion = emotionalWords.some(word => answer.includes(word));
      
      // 动作词汇检测（表示有具体内容）
      const actionWords = ['爬', '跑', '跳', '玩', '做', '去', '看', '听', '说', '吃', '喝', '走', '来'];
      const hasAction = actionWords.some(word => answer.includes(word));
      
      // 地点词汇检测
      const placeWords = ['花园', '公园', '学校', '家', '河边', '山上', '田野', '操场', '后院', '院子', '街道', '房子'];
      const hasPlace = placeWords.some(word => answer.includes(word));
      
      // 详细回答检测
      const isDetailed = answer.length > 50 && answer.split(/[。！？.!?]/).length > 2;

      let strategies;
      if (hasEmotion) {
        strategies = responseStrategies.emotional[chapter] || responseStrategies.emotional['childhood'];
        analysis = '感受到您对这个话题的深厚情感。';
      } else if (hasPlace) {
        strategies = responseStrategies.detailed[chapter] || responseStrategies.detailed['childhood'];
        analysis = '听起来是个很美好的地方！';
      } else if (hasAction) {
        strategies = responseStrategies.detailed[chapter] || responseStrategies.detailed['childhood'];
        analysis = '这个经历听起来很有趣！';
      } else if (isDetailed) {
        strategies = responseStrategies.detailed[chapter] || responseStrategies.detailed['childhood'];
        analysis = '感谢您分享了这么详细的经历。';
      } else if (isShort) {
        strategies = responseStrategies.short[chapter] || responseStrategies.short['childhood'];
        analysis = '能感受到您对这个话题的珍惜。';
      } else {
        // 默认策略
        strategies = responseStrategies.detailed[chapter] || responseStrategies.detailed['childhood'];
        analysis = '感谢您的分享。';
      }
      
      question = strategies[Math.floor(Math.random() * strategies.length)];
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
