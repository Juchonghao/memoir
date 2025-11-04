// 测试本地智能系统
const testLocalIntelligence = async () => {
  const testData = {
    chapter: "childhood",
    userAnswer: "小花园",
    roundNumber: 2,
    conversationHistory: []
  };

  try {
    const response = await fetch('https://lafpbfjtbupootnpornv.supabase.co/functions/v1/ai-interviewer-local', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();
    console.log('测试结果:', result);
    
    return result;
  } catch (error) {
    console.error('测试失败:', error);
    return null;
  }
};

// 执行测试
testLocalIntelligence();
