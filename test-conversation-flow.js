// 完整对话流程测试 - 展示AI记者与老人的持续对话
// 这个测试模拟了从打开APP到完成多轮对话的完整流程

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const API_KEY = process.env.SUPABASE_ANON_KEY || 'your-anon-key';
const USER_ID = process.env.TEST_USER_ID || 'test-user-id';
const CHAPTER = '童年故里';

// 颜色输出（Node.js）
const colors = {
  reset: '\x1b[0m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 调用API
async function callAPI(data) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/interview-start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify(data)
  });
  return await response.json();
}

// 显示对话
function showConversation(role, content, round) {
  if (role === 'ai') {
    log('blue', `[AI记者 - 第${round}轮] ${content}`);
  } else {
    log('green', `[老人回答 - 第${round}轮] ${content}`);
  }
  console.log('');
}

// 主测试函数
async function runConversationFlow() {
  console.log('');
  log('cyan', '========================================');
  log('cyan', 'AI记者对话流程测试');
  log('cyan', '模拟：老人打开APP，与AI记者持续对话');
  log('cyan', '========================================');
  console.log('');

  let sessionId = '';
  let currentRound = 0;

  // ============================================
  // 第1轮：打开APP，AI记者开始对话
  // ============================================
  log('yellow', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('yellow', '第1轮：老人打开APP，AI记者开始对话');
  log('yellow', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  console.log('📤 请求：开启对话（首次调用，无sessionId）');
  console.log('');

  const response1 = await callAPI({
    userId: USER_ID,
    chapter: CHAPTER
  });

  console.log('📥 响应：');
  console.log(JSON.stringify(response1, null, 2));
  console.log('');

  sessionId = response1.data?.sessionId;
  const question1 = response1.data?.question;
  currentRound = response1.data?.roundNumber || 1;

  if (!sessionId) {
    log('red', '❌ 未能获取Session ID，测试终止');
    return;
  }

  showConversation('ai', question1, currentRound);

  // 模拟老人回答
  const answer1 = '我小时候住在农村，家里有父母和两个兄弟姐妹。我们家有一个小院子，院子里种了很多花。';
  showConversation('user', answer1, currentRound);

  await new Promise(resolve => setTimeout(resolve, 1000));

  // ============================================
  // 第2轮：老人回答后，AI记者继续提问
  // ============================================
  log('yellow', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('yellow', '第2轮：老人回答后，AI记者继续提问');
  log('yellow', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  console.log('📤 请求：保存回答并获取下一个问题');
  console.log('');

  const response2 = await callAPI({
    userId: USER_ID,
    chapter: CHAPTER,
    sessionId: sessionId,
    userAnswer: answer1,
    roundNumber: currentRound
  });

  console.log('📥 响应：');
  console.log(JSON.stringify(response2, null, 2));
  console.log('');

  const question2 = response2.data?.question;
  currentRound = response2.data?.roundNumber || 2;
  const missingThemes2 = response2.data?.missingThemes || [];
  const coverage2 = response2.data?.coverage || 0;

  showConversation('ai', question2, currentRound);

  if (missingThemes2.length > 0) {
    log('cyan', `💡 内容检测：覆盖率 ${coverage2}%，建议补充：${missingThemes2.slice(0, 3).join('、')}`);
    console.log('');
  }

  // 模拟老人回答
  const answer2 = '我父母都是农民，父亲种地，母亲在家做家务。他们很勤劳，每天都很早起床。';
  showConversation('user', answer2, currentRound);

  await new Promise(resolve => setTimeout(resolve, 1000));

  // ============================================
  // 第3轮：继续对话
  // ============================================
  log('yellow', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('yellow', '第3轮：继续对话');
  log('yellow', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  const response3 = await callAPI({
    userId: USER_ID,
    chapter: CHAPTER,
    sessionId: sessionId,
    userAnswer: answer2,
    roundNumber: currentRound
  });

  const question3 = response3.data?.question;
  currentRound = response3.data?.roundNumber || 3;
  const missingThemes3 = response3.data?.missingThemes || [];
  const coverage3 = response3.data?.coverage || 0;

  showConversation('ai', question3, currentRound);

  if (missingThemes3.length > 0) {
    log('cyan', `💡 内容检测：覆盖率 ${coverage3}%，建议补充：${missingThemes3.slice(0, 3).join('、')}`);
    console.log('');
  }

  // 模拟老人回答
  const answer3 = '我最喜欢和兄弟姐妹一起在院子里玩。我们经常玩捉迷藏，有时候还会一起帮父母干活。';
  showConversation('user', answer3, currentRound);

  await new Promise(resolve => setTimeout(resolve, 1000));

  // ============================================
  // 第4轮：继续对话
  // ============================================
  log('yellow', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('yellow', '第4轮：继续对话');
  log('yellow', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  const response4 = await callAPI({
    userId: USER_ID,
    chapter: CHAPTER,
    sessionId: sessionId,
    userAnswer: answer3,
    roundNumber: currentRound
  });

  const question4 = response4.data?.question;
  currentRound = response4.data?.roundNumber || 4;
  const missingThemes4 = response4.data?.missingThemes || [];
  const coverage4 = response4.data?.coverage || 0;

  showConversation('ai', question4, currentRound);

  if (missingThemes4.length > 0) {
    log('cyan', `💡 内容检测：覆盖率 ${coverage4}%，建议补充：${missingThemes4.slice(0, 3).join('、')}`);
    console.log('');
  }

  // 模拟老人回答
  const answer4 = '我记得小时候最难忘的事情是过年。那时候家里会做很多好吃的，我们兄弟姐妹都会穿上新衣服，特别开心。';
  showConversation('user', answer4, currentRound);

  await new Promise(resolve => setTimeout(resolve, 1000));

  // ============================================
  // 第5轮：继续对话
  // ============================================
  log('yellow', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('yellow', '第5轮：继续对话');
  log('yellow', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  const response5 = await callAPI({
    userId: USER_ID,
    chapter: CHAPTER,
    sessionId: sessionId,
    userAnswer: answer4,
    roundNumber: currentRound
  });

  const question5 = response5.data?.question;
  currentRound = response5.data?.roundNumber || 5;
  const missingThemes5 = response5.data?.missingThemes || [];
  const coverage5 = response5.data?.coverage || 0;

  showConversation('ai', question5, currentRound);

  if (missingThemes5.length > 0) {
    log('cyan', `💡 内容检测：覆盖率 ${coverage5}%，建议补充：${missingThemes5.slice(0, 3).join('、')}`);
    console.log('');
  }

  // ============================================
  // 总结
  // ============================================
  console.log('');
  log('cyan', '========================================');
  log('cyan', '对话流程测试完成');
  log('cyan', '========================================');
  console.log('');
  console.log('📊 对话统计：');
  console.log(`  - 总轮次：${currentRound} 轮`);
  console.log(`  - 会话ID：${sessionId}`);
  console.log(`  - 章节：${CHAPTER}`);
  console.log(`  - 内容覆盖率：${coverage5}%`);
  console.log('');
  console.log('💡 对话特点：');
  console.log('  - AI记者根据老人的回答，持续生成个性化问题');
  console.log('  - 自动检测内容缺失，引导补充重要主题');
  console.log('  - 对话自然流畅，像朋友聊天一样');
  console.log('');
  console.log('📝 使用说明：');
  console.log('  1. 第一次调用：只传 userId 和 chapter，获取第一个问题');
  console.log('  2. 后续调用：传 userId, chapter, sessionId, userAnswer, roundNumber');
  console.log('  3. 持续循环，直到对话结束');
  console.log('');
}

// 运行测试
if (typeof fetch === 'undefined') {
  console.error('需要Node.js 18+或安装node-fetch');
  console.log('安装: npm install node-fetch');
  process.exit(1);
}

runConversationFlow().catch(console.error);

