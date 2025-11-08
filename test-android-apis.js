// 测试安卓应用API - Node.js版本
// 测试两个新API：interview-start 和 memoir-generate

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const API_KEY = process.env.SUPABASE_ANON_KEY || 'your-anon-key';
const USER_ID = process.env.TEST_USER_ID || 'test-user-id';

// 测试函数
async function testAPI(name, url, method = 'GET', data = null) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`测试: ${name}`);
  console.log(`URL: ${url}`);
  console.log(`Method: ${method}`);
  if (data) {
    console.log(`Data:`, JSON.stringify(data, null, 2));
  }
  console.log('');

  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      }
    };

    if (data && method === 'POST') {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    const responseData = await response.json();
    const status = response.status;

    if (status >= 200 && status < 300) {
      console.log(`✓ 成功 (HTTP ${status})`);
      console.log('响应:');
      console.log(JSON.stringify(responseData, null, 2));
      return { success: true, data: responseData, status };
    } else {
      console.log(`✗ 失败 (HTTP ${status})`);
      console.log('响应:');
      console.log(JSON.stringify(responseData, null, 2));
      return { success: false, data: responseData, status };
    }
  } catch (error) {
    console.log(`✗ 错误: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// 主测试函数
async function runTests() {
  console.log('\n' + '='.repeat(50));
  console.log('测试安卓应用API');
  console.log('='.repeat(50));

  // 测试1: AI起始对话API - 开始新对话
  const test1 = await testAPI(
    'AI起始对话 - 开始新对话',
    `${SUPABASE_URL}/functions/v1/interview-start`,
    'POST',
    {
      userId: USER_ID,
      chapter: '童年故里'
    }
  );

  let sessionId = null;
  if (test1.success && test1.data?.data?.sessionId) {
    sessionId = test1.data.data.sessionId;
    console.log(`\n✓ 获取到Session ID: ${sessionId}`);

    // 测试2: AI起始对话API - 继续对话（提供回答）
    await testAPI(
      'AI起始对话 - 继续对话',
      `${SUPABASE_URL}/functions/v1/interview-start`,
      'POST',
      {
        userId: USER_ID,
        chapter: '童年故里',
        sessionId: sessionId,
        userAnswer: '我小时候住在农村，家里有父母和两个兄弟姐妹。',
        roundNumber: 1
      }
    );

    // 测试3: 再次获取问题
    await testAPI(
      'AI起始对话 - 获取下一个问题',
      `${SUPABASE_URL}/functions/v1/interview-start`,
      'POST',
      {
        userId: USER_ID,
        chapter: '童年故里',
        sessionId: sessionId
      }
    );
  } else {
    console.log('\n✗ 未能获取Session ID，跳过后续测试');
  }

  // 测试4: 生成回忆录API
  await testAPI(
    '生成回忆录',
    `${SUPABASE_URL}/functions/v1/memoir-generate`,
    'POST',
    {
      userId: USER_ID,
      chapter: '童年故里',
      writingStyle: 'moyan',
      title: '我的童年回忆',
      saveToDatabase: false
    }
  );

  // 测试5: 通过API Gateway测试
  console.log('\n' + '='.repeat(50));
  console.log('通过API Gateway测试');
  console.log('='.repeat(50));

  await testAPI(
    'API Gateway - AI起始对话',
    `${SUPABASE_URL}/functions/v1/api-gateway/api/v1/interview/start`,
    'POST',
    {
      chapter: '童年故里'
    }
  );

  await testAPI(
    'API Gateway - 生成回忆录',
    `${SUPABASE_URL}/functions/v1/api-gateway/api/v1/memoir/generate`,
    'POST',
    {
      chapter: '童年故里',
      writingStyle: 'moyan',
      title: '我的童年回忆'
    }
  );

  console.log('\n' + '='.repeat(50));
  console.log('测试完成');
  console.log('='.repeat(50));
  console.log('\n使用说明:');
  console.log('1. 设置环境变量:');
  console.log('   export SUPABASE_URL="https://your-project.supabase.co"');
  console.log('   export SUPABASE_ANON_KEY="your-anon-key"');
  console.log('   export TEST_USER_ID="your-user-id"');
  console.log('\n2. 运行测试:');
  console.log('   node test-android-apis.js');
}

// 运行测试
if (typeof fetch === 'undefined') {
  console.error('需要Node.js 18+或安装node-fetch');
  console.log('安装: npm install node-fetch');
  process.exit(1);
}

runTests().catch(console.error);

