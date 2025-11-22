// 测试首次请求和接下来的3个问题
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
    const response = await fetch(`${SUPABASE_URL}/functions/v1/interviewer_smart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`
      },
      body: JSON.stringify({ action, ...body })
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error(`API错误 (${response.status}):`, responseText);
      throw new Error(`API错误: ${response.status} - ${responseText}`);
    }
    
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

// 主测试函数
async function testFirstQuestion() {
  console.log('🧪 测试首次请求和接下来的3个问题');
  console.log('='.repeat(80));
  console.log('');

  // 使用已存在的测试用户ID（避免外键约束错误）
  const testUserId = '550e8400-e29b-41d4-a716-446655440000';
  const chapter = '童年故里';
  
  // 生成新的sessionId以确保是新会话
  const testSessionId = `test_session_${Date.now()}`;
  
  console.log(`📋 测试配置:`);
  console.log(`  用户ID: ${testUserId}`);
  console.log(`  章节: ${chapter}`);
  console.log('');

  try {
    // 第1轮：首次请求（不传action和sessionId）
    console.log('📝 第1轮：首次请求（只传userId和chapter）');
    console.log('─'.repeat(80));
    
    // 首次请求：不传action和sessionId，让系统自动生成
    const firstResponse = await callAPI(undefined, {
      userId: testUserId,
      chapter: chapter
      // 不传sessionId，让系统自动生成
    });

    if (!firstResponse || !firstResponse.question) {
      throw new Error('无法获取第一个问题');
    }

    const sessionId = firstResponse.sessionId;
    const roundNumber = firstResponse.roundNumber;
    
    console.log(`✅ 成功获取第一个问题`);
    console.log(`  问题: ${firstResponse.question}`);
    console.log(`  会话ID: ${sessionId}`);
    console.log(`  轮次: ${roundNumber}`);
    console.log(`  使用AI: ${firstResponse.usingAI}`);
    console.log(`  返回用户: ${firstResponse.isReturningUser}`);
    console.log('');
    
    // 检查问题是否只有一个
    const questionLines = firstResponse.question.split('\n\n').filter(line => line.trim().length > 0);
    if (questionLines.length > 1) {
      console.log('⚠️  警告：第一个问题包含多个部分：');
      questionLines.forEach((line, index) => {
        console.log(`  部分${index + 1}: ${line.substring(0, 50)}...`);
      });
    } else {
      console.log('✅ 第一个问题格式正确（只有一个问题）');
    }
    console.log('');

    // 模拟用户回答
    const answer1 = '我叫张三';
    console.log(`👤 用户回答: ${answer1}`);
    console.log('');
    
    // 等待1秒，避免资源限制
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 第2轮：保存回答并获取下一个问题
    console.log('📝 第2轮：保存回答并获取下一个问题');
    console.log('─'.repeat(80));
    
    const secondResponse = await callAPI('saveAnswer', {
      userId: testUserId,
      chapter: chapter,
      sessionId: sessionId,
      userAnswer: answer1,
      roundNumber: roundNumber
    });

    if (!secondResponse || !secondResponse.nextQuestion) {
      throw new Error('无法获取第二个问题');
    }

    console.log(`✅ 成功获取第二个问题`);
    console.log(`  问题: ${secondResponse.nextQuestion}`);
    console.log(`  轮次: ${secondResponse.nextRoundNumber}`);
    console.log(`  使用AI: ${secondResponse.usingAI}`);
    console.log('');

    // 模拟用户回答
    const answer2 = '我今年65岁';
    console.log(`👤 用户回答: ${answer2}`);
    console.log('');
    
    // 等待1秒，避免资源限制
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 第3轮：保存回答并获取下一个问题
    console.log('📝 第3轮：保存回答并获取下一个问题');
    console.log('─'.repeat(80));
    
    const thirdResponse = await callAPI('saveAnswer', {
      userId: testUserId,
      chapter: chapter,
      sessionId: sessionId,
      userAnswer: answer2,
      roundNumber: secondResponse.nextRoundNumber
    });

    if (!thirdResponse || !thirdResponse.nextQuestion) {
      throw new Error('无法获取第三个问题');
    }

    console.log(`✅ 成功获取第三个问题`);
    console.log(`  问题: ${thirdResponse.nextQuestion}`);
    console.log(`  轮次: ${thirdResponse.nextRoundNumber}`);
    console.log(`  使用AI: ${thirdResponse.usingAI}`);
    console.log('');

    // 模拟用户回答
    const answer3 = '我是男性';
    console.log(`👤 用户回答: ${answer3}`);
    console.log('');
    
    // 等待1秒，避免资源限制
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 第4轮：保存回答并获取下一个问题
    console.log('📝 第4轮：保存回答并获取下一个问题');
    console.log('─'.repeat(80));
    
    const fourthResponse = await callAPI('saveAnswer', {
      userId: testUserId,
      chapter: chapter,
      sessionId: sessionId,
      userAnswer: answer3,
      roundNumber: thirdResponse.nextRoundNumber
    });

    if (!fourthResponse || !fourthResponse.nextQuestion) {
      throw new Error('无法获取第四个问题');
    }

    console.log(`✅ 成功获取第四个问题`);
    console.log(`  问题: ${fourthResponse.nextQuestion}`);
    console.log(`  轮次: ${fourthResponse.nextRoundNumber}`);
    console.log(`  使用AI: ${fourthResponse.usingAI}`);
    console.log('');

    // 输出总结
    console.log('='.repeat(80));
    console.log('✨ 测试完成！');
    console.log('');
    console.log('📊 对话总结:');
    console.log('');
    console.log(`第1轮:`);
    console.log(`  问：${firstResponse.question}`);
    console.log(`  答：${answer1}`);
    console.log('');
    console.log(`第2轮:`);
    console.log(`  问：${secondResponse.nextQuestion}`);
    console.log(`  答：${answer2}`);
    console.log('');
    console.log(`第3轮:`);
    console.log(`  问：${thirdResponse.nextQuestion}`);
    console.log(`  答：${answer3}`);
    console.log('');
    console.log(`第4轮:`);
    console.log(`  问：${fourthResponse.nextQuestion}`);
    console.log('');

    console.log('='.repeat(80));
    console.log('✅ 所有测试通过！');

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error('错误详情:', error);
  }
}

// 运行测试
testFirstQuestion().catch(console.error);

