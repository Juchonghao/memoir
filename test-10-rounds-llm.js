// 测试连续10轮对话，每轮问题和答案都由LLM生成
const SUPABASE_URL = 'https://lafpbfjtbupootnpornv.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZnBiZmp0YnVwb290bnBvcm52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MzIxMzgsImV4cCI6MjA3NDAwODEzOH0.NdxDvO17UX2Cya0Uz3ECWkR3g5nEbpIcu5ISXPTvaQ8';

// 生成UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// 调用API
async function callAPI(action, body) {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-interviewer-smart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`
      },
      body: JSON.stringify({ action, ...body })
    });

    // 先获取响应文本，以便调试
    const responseText = await response.text();
    
    if (!response.ok) {
      console.error(`API错误 (${response.status}):`, responseText);
      throw new Error(`API错误: ${response.status} - ${responseText}`);
    }
    
    // 尝试解析JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON解析失败，响应内容:', responseText);
      throw new Error(`JSON解析失败: ${parseError.message}`);
    }
    
    return data;
  } catch (error) {
    console.error('API调用错误:', error.message);
    throw error;
  }
}

// 使用LLM生成回答（通过API调用，带重试）
async function generateAnswer(question, conversationHistory, retryCount = 0) {
  const maxRetries = 3;
  
  // 通过我们的API来生成回答
  try {
    const result = await callAPI('generateUserAnswer', {
      question: question,
      conversationHistory: conversationHistory
    });
    
    if (result && result.success && result.answer) {
      return result.answer;
    } else {
      const errorMsg = result?.error || result?.details || '生成回答失败';
      console.error('API返回错误:', JSON.stringify(result, null, 2));
      throw new Error(errorMsg);
    }
  } catch (error) {
    const errorMsg = error.message || String(error);
    console.error(`生成回答失败 (尝试 ${retryCount + 1}/${maxRetries + 1}):`, errorMsg);
    
    // 如果是限流、资源限制或超时错误，且还有重试次数，则重试
    if (retryCount < maxRetries && (
      errorMsg.includes('429') || 
      errorMsg.includes('RATE_LIMIT') ||
      errorMsg.includes('WORKER_LIMIT') ||
      errorMsg.includes('compute resources')
    )) {
      // 限流或资源限制错误：等待时间递增（20秒、40秒、60秒）
      const waitTime = 20000 * (retryCount + 1);
      const errorType = errorMsg.includes('WORKER_LIMIT') ? '资源限制' : 'API限流';
      console.log(`⚠️  ${errorType}，等待${waitTime/1000}秒后重试...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      try {
        return await generateAnswer(question, conversationHistory, retryCount + 1);
      } catch (retryError) {
        if (retryCount === maxRetries - 1) {
          console.error('❌ 所有重试都失败，API限流太严格');
          throw new Error('API限流，请等待更长时间后再试');
        }
      }
    } else if (retryCount < maxRetries && (
      errorMsg.includes('timeout') || 
      errorMsg.includes('Connection timed out') ||
      errorMsg.includes('ECONNRESET') ||
      errorMsg.includes('ETIMEDOUT') ||
      errorMsg.includes('fetch failed') ||
      errorMsg.includes('other side closed') ||
      errorMsg.includes('UND_ERR_SOCKET')
    )) {
      // 超时错误：等待5秒后重试
      const waitTime = 5000;
      console.log(`⚠️  连接超时，等待${waitTime/1000}秒后重试...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      try {
        return await generateAnswer(question, conversationHistory, retryCount + 1);
      } catch (retryError) {
        if (retryCount === maxRetries - 1) {
          console.error('所有重试都失败');
          throw retryError;
        }
      }
    }
    
    // 如果还有重试次数，继续重试
    if (retryCount < maxRetries) {
      console.log(`等待5秒后重试...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return await generateAnswer(question, conversationHistory, retryCount + 1);
    }
    
    throw error;
  }
}

// 主测试函数
async function run10RoundsTest() {
  console.log('🚀 开始10轮连续对话测试（问题和答案都由LLM生成）');
  console.log('='.repeat(80));
  console.log('');

  // 获取API Key（从环境变量或测试）
  const envInfo = await callAPI('getEnvInfo', {});
  if (!envInfo.hasApiKey) {
    console.log('❌ API Key未配置，无法进行测试');
    return;
  }

  // 使用固定的测试用户ID（如果不存在，会在数据库中创建）
  // 或者生成新的UUID
  const useFixedTestUser = true;
  const testUserId = useFixedTestUser 
    ? '550e8400-e29b-41d4-a716-446655440000'  // 固定测试用户
    : generateUUID();
  const testSessionId = generateUUID();
  const chapter = '童年故里';
  
  console.log(`📋 测试配置:`);
  console.log(`  用户ID: ${testUserId}`);
  console.log(`  会话ID: ${testSessionId}`);
  console.log(`  章节: ${chapter}`);
  console.log(`  使用固定测试用户: ${useFixedTestUser ? '是' : '否（新用户）'}`);
  console.log('');

  console.log(`📋 测试配置:`);
  console.log(`  用户ID: ${testUserId}`);
  console.log(`  会话ID: ${testSessionId}`);
  console.log(`  章节: ${chapter}`);
  console.log('');

  const conversationHistory = [];
  let currentRoundNumber = 0;

  // API Key已经在Edge Function中配置，可以直接使用
  console.log('✅ 将使用Edge Function的API Key生成用户回答\n');

  try {
    // 第1轮：获取第一个问题
    console.log('📝 第1轮：获取第一个问题');
    console.log('─'.repeat(80));
    
    const firstQuestion = await callAPI('getNextQuestion', {
      userId: testUserId,
      chapter: chapter,
      sessionId: testSessionId
    });

    if (!firstQuestion || !firstQuestion.question) {
      throw new Error('无法获取第一个问题');
    }

    // 处理可能包含多个问题的响应
    let questionText = firstQuestion.question || '';
    // 如果包含换行，可能是开场+问题，只取最后的问题部分
    if (questionText.includes('\n\n')) {
      const parts = questionText.split('\n\n');
      questionText = parts[parts.length - 1]; // 取最后一部分
    }
    
    console.log(`问：${questionText}`);
    currentRoundNumber = firstQuestion.roundNumber;
    conversationHistory.push({
      question: questionText,
      answer: '',
      roundNumber: currentRoundNumber
    });

    // 生成回答
    console.log('\n🤖 LLM正在生成回答...');
    
    // 添加延迟避免API限流
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    let answer = await generateAnswer(
      firstQuestion.question,
      conversationHistory
    );
    console.log(`答：${answer}`);
    console.log('');

    conversationHistory[conversationHistory.length - 1].answer = answer;
    
    // 延迟后再继续（增加到10秒）
    await new Promise(resolve => setTimeout(resolve, 10000));

    // 第2-10轮：连续对话
    for (let round = 2; round <= 10; round++) {
      console.log(`📝 第${round}轮：保存回答并获取下一个问题`);
      console.log('─'.repeat(80));

      // 保存回答并获取下一个问题（带重试）
      let nextQuestion;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount <= maxRetries) {
        try {
          nextQuestion = await callAPI('saveAnswer', {
            userId: testUserId,
            chapter: chapter,
            sessionId: testSessionId,
            userAnswer: answer,
            roundNumber: currentRoundNumber
          });
          break; // 成功，退出循环
        } catch (error) {
          const errorMsg = error.message || String(error);
          if (errorMsg.includes('WORKER_LIMIT') || errorMsg.includes('546')) {
            const waitTime = 20000 * (retryCount + 1);
            console.log(`⚠️  资源限制，等待${waitTime/1000}秒后重试...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            retryCount++;
            if (retryCount > maxRetries) {
              throw error;
            }
          } else if (errorMsg.includes('504') || errorMsg.includes('Gateway Timeout')) {
            const waitTime = 15000 * (retryCount + 1);
            console.log(`⚠️  网关超时，等待${waitTime/1000}秒后重试...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            retryCount++;
            if (retryCount > maxRetries) {
              throw error;
            }
          } else {
            throw error; // 其他错误直接抛出
          }
        }
      }

      if (!nextQuestion || !nextQuestion.nextQuestion) {
        throw new Error(`无法获取第${round}轮的问题`);
      }

      console.log(`问：${nextQuestion.nextQuestion}`);
      currentRoundNumber = nextQuestion.nextRoundNumber;
      conversationHistory.push({
        question: nextQuestion.nextQuestion,
        answer: '',
        roundNumber: currentRoundNumber
      });

      // 生成回答
      console.log('\n🤖 LLM正在生成回答...');
      
      // 添加延迟避免API限流和资源限制（增加到10秒）
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      answer = await generateAnswer(
        nextQuestion.nextQuestion,
        conversationHistory
      );
      console.log(`答：${answer}`);
      console.log('');

      conversationHistory[conversationHistory.length - 1].answer = answer;

      // 短暂延迟，避免API限流和资源限制（增加到10秒）
      await new Promise(resolve => setTimeout(resolve, 10000));
    }

    // 输出总结
    console.log('='.repeat(80));
    console.log('✨ 10轮对话测试完成！');
    console.log('');
    console.log('📊 对话总结:');
    console.log('');
    conversationHistory.forEach((item, index) => {
      console.log(`第${index + 1}轮:`);
      console.log(`  问：${item.question}`);
      console.log(`  答：${item.answer}`);
      console.log('');
    });

    console.log('='.repeat(80));
    console.log('✅ 测试成功完成！');

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error('错误详情:', error);
  }
}

// 运行测试
run10RoundsTest().catch(console.error);

