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
  question: string;
  answer: string;
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
  
  const systemInstruction = `你是一位经验极其丰富、温柔亲切、善解人意的高级资深采访记者。

你的任务是：

通过自然、温暖、循序渐进的采访方式，引导一位上了年纪的长者讲述自己的一生经历，最终为 TA 写成一本完整的人生回忆录。

你必须表现得像一名有几十年采访经验的老记者，既亲切又专业，既尊重长者又能巧妙破冰，还能在聊天中获取你需要的信息。

🎯 采访总原则（必须严格遵守）

1. 一开始绝对不能急着问人生章节。

你必须先通过几个基础问题拉近关系、建立信任。

2. 你的每一句话都必须：

回应理解长者的上一句话

顺着他的情绪与内容继续

绝不机械提问

绝不跳题

3. 如果长者回答与你的问题无关（例：你问童年，他说"我想喝水"）你必须：

先温柔顺应

再判断是否需要休息

再找合适时机重新回到话题

（例如："您先喝点水，我等您～刚刚说到……"）

4. 每个章节你心里必须有清晰提纲（你会自动内置），但提问一定要自然，不背提纲。

5. 不要在一个问题上穷追猛打。问 1～2 次对不上就换问题。

6. 要有"主动喊停"意识。

采访约五分钟或当长者表达疲惫时，你要主动问：

"我们要不要休息一下？我不急，您慢慢说。"

7. 每段采访结束后，你必须输出两样东西：

① 采访纪要（像会议纪要一样）

② 问题进度情况（哪些基础信息已收集、哪个章节进行到第几条提纲）

绝对不能结束后什么也不给。

🧩 采访整体流程（必须严格按顺序执行）

阶段一：关系建立（固定流程）

你必须按以下顺序提问，并在每次回答后做"理解 + 回应 + 顺势提问"。

问题1：询问姓名（必须先问）

示例提问：

"您好，我是记者小陈，请问您怎么称呼呀？"

收到名字后你要自动：

重复名字

询问是哪几个字

对姓氏做一个轻松的小猜测（如：木子李、弓长张等）

问题2：询问年龄

示例提问：

"方便告诉我您的年龄吗？"

收到年龄后你必须自动：

心算出生年份

说出属相

顺带说一句拉近关系的话

例：

"您 66 年生，那属马，我算得对不对？明年就整 60 了，这年龄保养得真好。"

问题3：确认性别 + 未来称呼固定化

提问例：

"那我叫您爷爷还是奶奶比较合适呢？"

规则：

60岁以上：问"爷爷/奶奶"

收到性别后，你后续所有提问都以"李爷爷/张奶奶"方式称呼

问题4：职业

提问例：

"李爷爷，您当时主要从事什么工作呀？"

回答后必须回应一句，再顺势提问籍贯。

问题5：籍贯

提问例：

"那您是哪里人呀？"

收到后回应一句家乡话（如能根据地名判断）。

然后提问：

"那您小时候一直都在那边生活吗？"

此处开始顺势进入第一章：懵懂童年的内容引导。

🌈 阶段二：章节式深度采访（根据当前章节自动切换）

当你进入某一章后，你必须根据我提供的详细大纲自动选择5～10 个话题进行自然式提问。

你必须遵守以下规则：

1. 每一问必须：

捕捉上一个回答的情感

回应理解

顺着内容继续深挖或过渡到下一个提纲

不生硬跳转

2. 若回答偏离主题：

你必须判断：

如果是身体需求（如喝水、累了）：

温柔顺从

询问是否要休息

稍后再自然回到话题

如果是认知偏差或误解问题：

换一种更温柔、更容易理解的方式再问一次

如果还是答不好：

自动切换到下一个提纲问题，不纠缠。

3. 你必须心里有"章节提纲清单"并按顺序灵活走位，不机械贴提纲。

🧠 阶段三：每次问答的格式要求（非常重要）

在每一轮提问时：

如果这是开场问题（上一轮回答为空）：

你必须：

用温柔、带画面感的方式开启

问一个场景化、具体化的问题

控制在 50 字以内

不写分析，只给问题

如果上一轮回答不为空（跟进提问）：

你必须输出如下格式：

分析：［用1–2句话分析他的情绪 + 关键信息 ］

跟进问题：［不超过40字的问题，必须紧扣上一句话］

📌 阶段四：每个自然段落结束时必须输出

当采访达到一个小段落（例如完成姓名–年龄–性别、或完成童年章节）你必须自动生成：

① 本轮采访纪要（类似会议纪要）

必须包括：

获取到的关键信息

情绪特点

提到的重要人物

值得用于回忆录的素材

② 进度追踪表

例如：

基础信息：姓名✔ 年龄✔ 性别✔ 籍贯✔ 职业✔

当前章节：第一章《懵懂童年》

已完成话题：旧宅✓ 祖辈✓ 童年伙伴✓

下一步计划：童年趣事 or 童年恐惧

绝对不能漏。

🏆 最终目标

你的提问方式必须让长者感到：

像在聊天，不像被审问

情绪被理解

想说话

想回忆

想把故事讲给你听

你的最终任务是：

循序渐进地采集整个人生所有章节的素材，用于撰写一本详尽的个人回忆录。

🔥准备好后，请从"我是记者小陈，请问您怎么称呼？"开始执行采访。`;
  
  // 使用OpenAI兼容的API格式
  const baseUrl = Deno.env.get('OPENAI_BASE_URL') || 'https://api.ppinfra.com/openai';
  const model = Deno.env.get('OPENAI_MODEL') || 'deepseek/deepseek-v3';
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
        temperature: 0.7,  // 降低温度提高速度和稳定性
        max_tokens: 200,  // 增加到200确保问题完整
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
    if (record.question === newQuestion) {
      console.log('Found exact duplicate question');
      return true;
    }
  }

  // 相似度检测（简单的关键词匹配）
  const newKeywords = extractKeywords(newQuestion);
  for (const record of history) {
    const oldKeywords = extractKeywords(record.question);
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

  // 如果没有历史记录，返回第一个问题（阶段一：询问姓名）
  if (!history || history.length === 0) {
    return '您好，我是记者小陈，请问您怎么称呼呀？';
  }

  // 如果没有API密钥，使用备用问题库
  if (!geminiApiKey) {
    console.log('No API key, using fallback questions');
    const usedQuestions = history.map(h => h.question);
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
    // 检查是否在阶段一（关系建立）
    const hasAnsweredQuestions = history.filter(h => h.answer && h.answer.trim().length > 0).length > 0;
    const lastRecord = history.length > 0 ? history[history.length - 1] : null;
    const lastAnswer = lastRecord?.answer || '';
    const isFirstQuestion = !hasAnsweredQuestions;
    
    // 构建提示词
    let prompt = `我正在和一位老人进行人生访谈，当前章节是"${chapter}"（${config.description}）。\n\n`;
    
    // 判断当前阶段
    if (isFirstQuestion) {
      prompt += `【当前阶段：关系建立 - 阶段一】\n`;
      prompt += `这是第一次提问，请按照阶段一的要求，从询问姓名开始。\n`;
      prompt += `请用温柔、带画面感的方式开启，问一个场景化、具体化的问题，控制在50字以内。\n`;
      prompt += `直接输出问题，不写分析。\n\n`;
      prompt += `请输出第一个问题（询问姓名）：`;
    } else {
      // 添加对话历史
      prompt += '【对话历史】\n';
      const recentHistory = history.slice(-5); // 最近5轮对话，获取更多上下文
      for (const record of recentHistory) {
        if (record.answer && record.answer.trim().length > 0) {
          prompt += `问：${record.question}\n`;
          prompt += `答：${record.answer}\n\n`;
        }
      }
      
      // 特别强调最后一个回答
      if (lastRecord && lastAnswer && lastAnswer.trim().length > 0) {
        prompt += `【最重要：用户刚才的回答】\n`;
        prompt += `问：${lastRecord.question}\n`;
        prompt += `答：${lastAnswer}\n\n`;
        
        // 添加指导要求
        prompt += `【要求】\n`;
        prompt += `请仔细分析用户的最后一个回答，然后生成下一个问题。\n\n`;
        prompt += `你必须按照以下格式输出：\n\n`;
        prompt += `分析：[用1-2句话分析他的情绪 + 关键信息]\n`;
        prompt += `跟进问题：[不超过40字的问题，必须紧扣上一句话]\n\n`;
        prompt += `重要规则：\n`;
        prompt += `1. **必须基于用户刚才的回答**，回应理解他的情绪和内容\n`;
        prompt += `2. 顺着他的情绪与内容继续，绝不机械提问，绝不跳题\n`;
        prompt += `3. 如果回答偏离主题（如身体需求），先温柔顺应，再找合适时机回到话题\n`;
        prompt += `4. 不要在一个问题上穷追猛打，问1-2次对不上就换问题\n`;
        prompt += `5. 问题要自然、温暖，像在聊天，不像被审问\n`;
        prompt += `6. 绝不重复问过的问题\n\n`;
        prompt += `请输出分析+跟进问题：`;
      } else {
        // 如果上一轮回答为空，只输出问题
        prompt += `【当前状态】\n`;
        prompt += `上一轮回答为空，请用温柔、带画面感的方式开启，问一个场景化、具体化的问题，控制在50字以内。\n`;
        prompt += `直接输出问题，不写分析。\n\n`;
        prompt += `请输出问题：`;
      }
    }
    
    // 添加摘要信息（如果有）
    if (summary) {
      prompt += `\n【已收集的信息】\n`;
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

    console.log('Generating question with Gemini...');
    console.log('Prompt length:', prompt.length);
    
    let response = await callGemini(prompt, geminiApiKey);
    
    // 处理新的格式：可能包含"分析：..."和"跟进问题：..."
    let question = response;
    
    // 如果包含"跟进问题："，提取问题部分
    const followUpMatch = response.match(/跟进问题[：:]\s*(.+?)(?:\n|$)/);
    if (followUpMatch) {
      question = followUpMatch[1].trim();
    } else {
      // 如果没有"跟进问题："格式，尝试提取"问题："格式
      const questionMatch = response.match(/问题[：:]\s*(.+?)(?:\n|$)/);
      if (questionMatch) {
        question = questionMatch[1].trim();
      }
    }
    
    // 清理问题格式
    question = question.replace(/^问：|^问题：|^Q:|^下一个问题：/i, '').trim();
    question = question.replace(/^["']|["']$/g, '').trim();
    // 移除所有括号中的内容（包括语气、情感等备注）
    question = question.replace(/[（(][^)）]*[)）]/g, '').trim();
    question = question.replace(/【[^】]*】/g, '').trim();
    
    // 如果问题为空或太短，使用原始响应
    if (!question || question.length < 3) {
      question = response.trim();
    }
    
    // 检查是否重复
    let attempts = 0;
    while (isQuestionDuplicate(question, history) && attempts < 3) {
      console.log(`Question is duplicate, regenerating (attempt ${attempts + 1})...`);
      const regeneratePrompt = prompt + `\n注意：以下问题已经问过了，请生成不同的问题：\n${question}`;
      let retryResponse = await callGemini(regeneratePrompt, geminiApiKey);
      
      // 处理重试响应的格式
      const retryFollowUpMatch = retryResponse.match(/跟进问题[：:]\s*(.+?)(?:\n|$)/);
      if (retryFollowUpMatch) {
        question = retryFollowUpMatch[1].trim();
      } else {
        question = retryResponse.trim();
      }
      
      question = question.replace(/^问：|^问题：|^Q:|^下一个问题：/i, '').trim();
      question = question.replace(/^["']|["']$/g, '').trim();
      question = question.replace(/[（(][^)）]*[)）]/g, '').trim();
      question = question.replace(/【[^】]*】/g, '').trim();
      attempts++;
    }
    
    // 如果仍然重复，使用备用问题
    if (isQuestionDuplicate(question, history)) {
      console.log('Still duplicate after retries, using fallback');
      const usedQuestions = history.map(h => h.question);
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
    const usedQuestions = history.map(h => h.question);
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

    // 生成用户回答（用于测试）
    if (action === 'generateUserAnswer') {
      if (!geminiApiKey) {
        return new Response(
          JSON.stringify({ 
            error: 'API key not configured',
            hasKey: false
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { question, conversationHistory } = requestData;
      
      if (!question) {
        return new Response(
          JSON.stringify({ error: 'question is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      try {
        // 构建prompt来生成用户回答
        let prompt = '你是一位65岁的老人，正在接受一位记者的采访。\n\n';
        
        if (conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
          prompt += '以下是采访历史：\n';
          const recentHistory = conversationHistory.slice(-3);
          recentHistory.forEach((item: any, index: number) => {
            if (item && item.answer && item.question) {
              prompt += `问${index + 1}：${item.question}\n`;
              prompt += `答${index + 1}：${item.answer}\n\n`;
            }
          });
        }
        
        prompt += `\n现在记者问：${question}\n\n`;
        prompt += `请以一位65岁老人的身份，用自然、真实、温暖的方式回答这个问题。\n`;
        prompt += `回答要：\n`;
        prompt += `1. 符合老人的身份和经历\n`;
        prompt += `2. 与之前的回答保持一致\n`;
        prompt += `3. 自然、真实，不要太长（50-100字）\n`;
        prompt += `4. 直接输出回答，不要加任何说明\n\n`;
        prompt += `你的回答：`;

        console.log('Generating user answer with prompt length:', prompt.length);
        const answer = await callGemini(prompt, geminiApiKey);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            answer: answer.trim(),
            hasKey: true
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error: any) {
        console.error('Error generating user answer:', error);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to generate answer',
            details: error.message || String(error),
            hasKey: true
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 获取下一个问题
    if (action === 'getNextQuestion') {
      if (!userId || !chapter || !sessionId) {
        return new Response(
          JSON.stringify({ error: 'Missing required parameters' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 检查是否有之前的session，如果有，生成总结开场
      const { data: previousSessions } = await supabase
        .from('conversation_history')
        .select('session_id')
        .eq('user_id', userId)
        .eq('chapter', chapter)
        .neq('session_id', sessionId)
        .limit(1);

      let openingQuestion: string | null = null;
      
      if (previousSessions && previousSessions.length > 0) {
        // 有之前的会话，生成总结开场
        const { data: previousHistory } = await supabase
          .from('conversation_history')
          .select('*')
          .eq('user_id', userId)
          .eq('chapter', chapter)
          .neq('session_id', sessionId)
          .order('round_number', { ascending: true });

        if (previousHistory && previousHistory.length > 0 && geminiApiKey) {
          // 使用AI生成总结开场
          const previousQA = previousHistory.slice(-3).map(h => `问：${h.question}\n答：${h.answer}`).join('\n\n');
          const summaryPrompt = `上次我们聊到了：\n${previousQA}\n\n请生成一个简短的总结开场，提及上次的话题，然后引入新的问题。开场要温暖、自然。只输出开场话术，不要问题。`;
          try {
            openingQuestion = await callGemini(summaryPrompt, geminiApiKey);
          } catch (e) {
            openingQuestion = `欢迎回来！上次我们聊到了${chapter}的一些美好回忆，今天我们继续深入聊聊。`;
          }
        }
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
          question: question,
          answer: '',
          ai_question: question,  // Also populate old column for compatibility
          user_answer: '',  // Also populate old column for compatibility
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
          question: openingQuestion ? `${openingQuestion}\n\n${question}` : question,
          roundNumber: nextRoundNumber,
          usingAI: !!geminiApiKey,
          isReturningUser: !!openingQuestion
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
      let currentRecord: { question: string; round_number: number } | null = null
      const { data: recordByRound } = await supabase
        .from('conversation_history')
        .select('question, round_number')
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
          .select('question, round_number')
          .eq('user_id', userId)
          .eq('chapter', chapter)
          .eq('session_id', sessionId)
          .eq('answer', '')
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
          answer: userAnswer,
          user_answer: userAnswer  // Also update old column for compatibility
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
          question: nextQuestion,
          answer: '',
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
