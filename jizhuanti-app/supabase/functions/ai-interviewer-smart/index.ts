/**
 * AI记者智能对话系统 - Edge Function
 * 功能：
 * 1. 查询对话历史
 * 2. 分析已问过的问题和用户回答
 * 3. 检测重复问题
 * 4. 基于历史生成个性化问题
 * 5. 保存新对话记录
 * 6. 更新章节摘要
 */

Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const { userId, chapter, action, userAnswer, currentQuestion, sessionId } = await req.json();

        // 测试环境变量endpoint（不需要userId和chapter）
        if (action === 'testEnv') {
            const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
            const supabaseUrl = Deno.env.get('SUPABASE_URL');
            const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
            
            return new Response(JSON.stringify({ 
                data: {
                    supabaseUrl: supabaseUrl ? 'configured' : 'missing',
                    serviceRoleKey: serviceRoleKey ? 'configured' : 'missing',
                    geminiApiKey: geminiApiKey ? `configured (length: ${geminiApiKey.length})` : 'missing'
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 直接测试Gemini API调用
        if (action === 'testGemini') {
            const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
            
            if (!geminiApiKey) {
                return new Response(JSON.stringify({ 
                    error: 'GEMINI_API_KEY not configured'
                }), {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            try {
                const testPrompt = '请用一句话回答：天空是什么颜色？';
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent?key=${geminiApiKey}`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            contents: [{
                                parts: [{
                                    text: testPrompt
                                }]
                            }],
                            generationConfig: {
                                temperature: 0.8,
                                maxOutputTokens: 100
                            }
                        })
                    }
                );

                if (!response.ok) {
                    const errorText = await response.text();
                    return new Response(JSON.stringify({ 
                        error: `Gemini API error: ${response.status}`,
                        details: errorText
                    }), {
                        status: 500,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }

                const data = await response.json();
                return new Response(JSON.stringify({ 
                    success: true,
                    response: data.candidates[0].content.parts[0].text
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });

            } catch (error) {
                return new Response(JSON.stringify({ 
                    error: 'Exception',
                    message: error.message
                }), {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
        }

        if (!userId || !chapter) {
            throw new Error('userId和chapter为必填项');
        }

        // 生成或使用现有的sessionId
        const currentSessionId = sessionId || `session_${Date.now()}`;

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

        // 详细日志：检查环境变量
        console.log('环境变量检查:');
        console.log('- SUPABASE_URL:', supabaseUrl ? '已配置' : '未配置');
        console.log('- SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '已配置' : '未配置');
        console.log('- GEMINI_API_KEY:', geminiApiKey ? `已配置(长度${geminiApiKey.length})` : '未配置');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('缺少必要的Supabase环境变量配置');
        }

        // Gemini API密钥可选，没有时使用默认问题库
        if (!geminiApiKey) {
            console.log('警告: GEMINI_API_KEY未配置，将使用默认问题库');
        }

        // 根据action执行不同操作
        if (action === 'getNextQuestion') {
            // 获取下一个问题
            const result = await getNextQuestion(
                userId,
                chapter,
                currentSessionId,
                supabaseUrl,
                serviceRoleKey,
                geminiApiKey
            );
            
            return new Response(JSON.stringify({ data: result }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else if (action === 'saveAnswer') {
            // 保存用户回答
            if (!userAnswer || !currentQuestion) {
                throw new Error('保存回答需要userAnswer和currentQuestion参数');
            }

            const result = await saveAnswer(
                userId,
                chapter,
                currentSessionId,
                currentQuestion,
                userAnswer,
                supabaseUrl,
                serviceRoleKey
            );

            return new Response(JSON.stringify({ data: result }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else {
            throw new Error('无效的action参数，应为getNextQuestion或saveAnswer');
        }

    } catch (error) {
        console.error('AI Interviewer Smart Error:', error);

        const errorResponse = {
            error: {
                code: 'AI_INTERVIEWER_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

/**
 * 获取对话历史
 */
async function getConversationHistory(
    userId: string,
    chapter: string,
    sessionId: string,
    supabaseUrl: string,
    serviceRoleKey: string
) {
    const response = await fetch(
        `${supabaseUrl}/rest/v1/conversation_history?user_id=eq.${userId}&chapter=eq.${chapter}&session_id=eq.${sessionId}&select=*&order=round_number.asc`,
        {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            }
        }
    );

    if (!response.ok) {
        throw new Error(`获取对话历史失败: ${await response.text()}`);
    }

    return await response.json();
}

/**
 * 获取章节摘要
 */
async function getChapterSummary(
    userId: string,
    chapter: string,
    supabaseUrl: string,
    serviceRoleKey: string
) {
    const response = await fetch(
        `${supabaseUrl}/rest/v1/conversation_summary?user_id=eq.${userId}&chapter=eq.${chapter}&select=*`,
        {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            }
        }
    );

    if (!response.ok) {
        throw new Error(`获取章节摘要失败: ${await response.text()}`);
    }

    const summaries = await response.json();
    return summaries.length > 0 ? summaries[0] : null;
}

/**
 * 检测问题是否重复
 */
function isQuestionDuplicate(
    newQuestion: string,
    questionHistory: string[]
): boolean {
    const newQuestionLower = newQuestion.toLowerCase().trim();
    
    for (const oldQuestion of questionHistory) {
        const oldQuestionLower = oldQuestion.toLowerCase().trim();
        
        // 完全相同
        if (newQuestionLower === oldQuestionLower) {
            return true;
        }
        
        // 高度相似（包含主要关键词）
        const newWords = newQuestionLower.split(/\s+/);
        const oldWords = oldQuestionLower.split(/\s+/);
        
        // 计算相似度（简单的关键词匹配）
        const commonWords = newWords.filter(word => 
            word.length > 2 && oldWords.includes(word)
        );
        
        const similarity = commonWords.length / Math.max(newWords.length, oldWords.length);
        
        if (similarity > 0.6) {
            return true;
        }
    }
    
    return false;
}

/**
 * 使用Gemini生成下一个问题
 */
async function generateNextQuestion(
    chapter: string,
    conversationHistory: any[],
    chapterSummary: any,
    geminiApiKey: string | undefined
): Promise<string> {
    // 提取已问过的问题列表
    const askedQuestions = conversationHistory.map(conv => conv.ai_question);

    // 如果没有Gemini API密钥，直接使用默认问题
    if (!geminiApiKey) {
        console.log('使用默认问题库（未配置Gemini API）');
        return getDefaultQuestion(chapter, conversationHistory.length);
    }

    // 构建对话历史上下文
    const historyContext = conversationHistory.map((conv, index) => 
        `第${index + 1}轮:\nQ: ${conv.ai_question}\nA: ${conv.user_answer}`
    ).join('\n\n');

    // 构建提示词
    const prompt = `你是一位资深的人物传记记者，正在采访一位长者，帮助他们撰写人生传记。

当前章节: ${chapter}

已进行的对话历史:
${historyContext || '这是该章节的第一个问题'}

${chapterSummary ? `章节摘要:
关键主题: ${chapterSummary.key_themes?.join(', ') || '暂无'}
重要细节: ${chapterSummary.important_details || '暂无'}
` : ''}

已问过的问题列表:
${askedQuestions.length > 0 ? askedQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n') : '暂无'}

请基于以上对话历史和用户的回答特点，生成下一个深入的、个性化的问题。要求：

1. **避免重复**: 绝对不要问已经问过的问题或相似的问题
2. **深入挖掘**: 基于用户之前的回答，提出更深层次的追问
3. **情感连接**: 关注用户提到的情感、细节和故事
4. **自然过渡**: 问题要与之前的对话自然衔接
5. **开放性**: 鼓励用户分享更多细节和故事
6. **温暖关怀**: 保持温暖、尊重的语气

请直接返回问题内容，不要包含任何前缀或解释。`;

    try {
        console.log('准备调用Gemini API生成问题...');
        console.log('- 历史对话轮数:', conversationHistory.length);
        console.log('- API密钥存在:', geminiApiKey ? 'true' : 'false');
        
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent?key=${geminiApiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.8,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 200
                    }
                })
            }
        );

        console.log('Gemini API响应状态:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API错误响应:', errorText);
            throw new Error(`Gemini API调用失败: ${errorText}`);
        }

        const data = await response.json();
        const generatedQuestion = data.candidates[0].content.parts[0].text.trim();
        
        console.log('Gemini生成的问题:', generatedQuestion);

        // 检测是否重复
        if (isQuestionDuplicate(generatedQuestion, askedQuestions)) {
            // 如果重复，再次生成（最多重试2次）
            console.log('检测到重复问题，重新生成...');
            return generateNextQuestion(chapter, conversationHistory, chapterSummary, geminiApiKey);
        }

        return generatedQuestion;

    } catch (error) {
        console.error('Gemini生成问题失败，使用默认问题:', error);
        console.error('错误详情:', error.message);
        // 返回章节默认问题
        return getDefaultQuestion(chapter, conversationHistory.length);
    }
}

/**
 * 获取默认问题（备用）
 */
function getDefaultQuestion(chapter: string, roundNumber: number): string {
    const defaultQuestions: { [key: string]: string[] } = {
        '童年故里': [
            '能跟我说说您最早的记忆是什么吗？',
            '您的童年是在哪里度过的？那个地方有什么特别之处？',
            '您小时候最喜欢玩什么？有什么难忘的童年趣事吗？',
            '您记得您的父母是什么样的人吗？他们对您有什么影响？'
        ],
        '青春之歌': [
            '您还记得学生时代最难忘的一件事吗？',
            '在青春时期，有哪位朋友或老师对您影响很深？',
            '那个年代的青春岁月，您最怀念什么？',
            '青春时期有什么梦想或目标吗？后来实现了吗？'
        ],
        '事业征程': [
            '您是如何选择您的职业道路的？',
            '在事业发展过程中，遇到过什么重大挑战吗？',
            '有没有一个时刻让您觉得特别有成就感？',
            '您觉得事业成功最重要的因素是什么？'
        ],
        '家庭港湾': [
            '能说说您组建家庭的经历吗？',
            '在您心中，家庭意味着什么？',
            '您和家人之间有什么温馨的回忆吗？',
            '您希望传承给下一代什么样的家庭价值观？'
        ],
        '流金岁月': [
            '回顾您的人生，哪些经历让您成长最多？',
            '如果让您总结人生最重要的三件事，会是什么？',
            '您觉得什么才是真正的幸福？',
            '您有什么想对年轻人说的话吗？'
        ]
    };

    const questions = defaultQuestions[chapter] || defaultQuestions['流金岁月'];
    return questions[roundNumber % questions.length];
}

/**
 * 获取下一个问题
 */
async function getNextQuestion(
    userId: string,
    chapter: string,
    sessionId: string,
    supabaseUrl: string,
    serviceRoleKey: string,
    geminiApiKey: string
) {
    // 获取对话历史
    const conversationHistory = await getConversationHistory(
        userId,
        chapter,
        sessionId,
        supabaseUrl,
        serviceRoleKey
    );

    // 获取章节摘要
    const chapterSummary = await getChapterSummary(
        userId,
        chapter,
        supabaseUrl,
        serviceRoleKey
    );

    // 生成下一个问题
    const nextQuestion = await generateNextQuestion(
        chapter,
        conversationHistory,
        chapterSummary,
        geminiApiKey
    );

    return {
        question: nextQuestion,
        roundNumber: conversationHistory.length + 1,
        totalRounds: conversationHistory.length,
        sessionId: sessionId
    };
}

/**
 * 保存用户回答
 */
async function saveAnswer(
    userId: string,
    chapter: string,
    sessionId: string,
    question: string,
    answer: string,
    supabaseUrl: string,
    serviceRoleKey: string
) {
    // 获取当前轮次
    const conversationHistory = await getConversationHistory(
        userId,
        chapter,
        sessionId,
        supabaseUrl,
        serviceRoleKey
    );

    const roundNumber = conversationHistory.length + 1;

    // 保存对话记录
    const insertResponse = await fetch(
        `${supabaseUrl}/rest/v1/conversation_history`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                user_id: userId,
                chapter: chapter,
                session_id: sessionId,
                round_number: roundNumber,
                ai_question: question,
                user_answer: answer
            })
        }
    );

    if (!insertResponse.ok) {
        throw new Error(`保存对话记录失败: ${await insertResponse.text()}`);
    }

    const savedConversation = await insertResponse.json();

    // 更新章节摘要
    await updateChapterSummary(
        userId,
        chapter,
        sessionId,
        question,
        answer,
        supabaseUrl,
        serviceRoleKey
    );

    return {
        success: true,
        conversation: savedConversation[0],
        roundNumber: roundNumber
    };
}

/**
 * 提取关键词（简单实现）
 */
function extractKeywords(text: string): string[] {
    // 简单的中文关键词提取（可以后续优化）
    const words = text.match(/[\u4e00-\u9fa5]{2,}/g) || [];
    return [...new Set(words)].slice(0, 10);
}

/**
 * 提取关键人物
 */
function extractKeyPeople(text: string): string[] {
    // 简单提取可能的人名（2-4个字的中文词）
    const words = text.match(/[\u4e00-\u9fa5]{2,4}/g) || [];
    return [...new Set(words)].slice(0, 5);
}

/**
 * 提取关键事件
 */
function extractKeyEvents(conversations: any[]): string[] {
    // 提取较长回答中的关键句子
    return conversations
        .filter(h => h.user_answer.length > 30)
        .map(h => h.user_answer.substring(0, 50) + '...')
        .slice(0, 5);
}

/**
 * 分析情感基调
 */
function analyzeEmotionalTone(text: string): string {
    const positiveWords = ['高兴', '快乐', '幸福', '满足', '开心', '美好', '温暖'];
    const negativeWords = ['难过', '痛苦', '困难', '失望', '悲伤', '艰难'];
    const neutralWords = ['平静', '普通', '一般', '正常'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    positiveWords.forEach(word => {
        if (text.includes(word)) positiveCount++;
    });
    
    negativeWords.forEach(word => {
        if (text.includes(word)) negativeCount++;
    });
    
    if (positiveCount > negativeCount) return '积极';
    if (negativeCount > positiveCount) return '复杂';
    return '平和';
}

/**
 * 更新章节摘要
 */
async function updateChapterSummary(
    userId: string,
    chapter: string,
    sessionId: string,
    newQuestion: string,
    newAnswer: string,
    supabaseUrl: string,
    serviceRoleKey: string
) {
    // 获取现有摘要
    const existingSummary = await getChapterSummary(
        userId,
        chapter,
        supabaseUrl,
        serviceRoleKey
    );

    // 获取所有对话历史
    const allHistory = await getConversationHistory(
        userId,
        chapter,
        sessionId,
        supabaseUrl,
        serviceRoleKey
    );

    // 提取关键信息
    const allAnswers = allHistory.map(h => h.user_answer).join(' ');
    const keyThemes = extractKeywords(allAnswers);
    const keyPeople = extractKeyPeople(allAnswers);
    const keyEvents = extractKeyEvents(allHistory);
    const emotionalTone = analyzeEmotionalTone(allAnswers);

    const summaryData = {
        user_id: userId,
        chapter: chapter,
        key_themes: keyThemes,
        key_people: keyPeople,
        key_events: keyEvents,
        emotional_tone: emotionalTone,
        last_updated: new Date().toISOString()
    };

    if (existingSummary) {
        // 更新现有摘要
        const updateResponse = await fetch(
            `${supabaseUrl}/rest/v1/conversation_summary?user_id=eq.${userId}&chapter=eq.${chapter}`,
            {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(summaryData)
            }
        );

        if (!updateResponse.ok) {
            console.error('更新摘要失败:', await updateResponse.text());
        }
    } else {
        // 创建新摘要
        const insertResponse = await fetch(
            `${supabaseUrl}/rest/v1/conversation_summary`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(summaryData)
            }
        );

        if (!insertResponse.ok) {
            console.error('创建摘要失败:', await insertResponse.text());
        }
    }
}
