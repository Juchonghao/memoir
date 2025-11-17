import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Send, Loader2, Image as ImageIcon, ArrowLeft, User, MessageCircle, Mic, MicOff, Volume2, VolumeX, Pause, Play } from 'lucide-react'
import { 
  generateMemoryMirror, 
  getEraSymbols 
} from '../lib/imageGeneration'
import { useVoiceRecognition } from '../hooks/useVoiceRecognition'
import { useChatTTS } from '../hooks/useChatTTS'
import InspirationInput from '../components/InspirationInput'

const CHAPTER_NAMES: Record<string, string> = {
  childhood: '童年故里',
  youth: '青春之歌',
  career: '事业征程',
  family: '家庭港湾',
  reflection: '流金岁月',
}

interface Message {
  role: 'ai' | 'user'
  content: string
  timestamp: Date
}

export default function InterviewPage() {
  const { chapter } = useParams<{ chapter: string }>()
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [roundNumber, setRoundNumber] = useState(1)
  const [userPhotoUrl, setUserPhotoUrl] = useState<string | null>(null)
  const [memoryMirrorUrl, setMemoryMirrorUrl] = useState<string | null>(null)
  const [generatingImage, setGeneratingImage] = useState(false)
  const [selectedEra, setSelectedEra] = useState('1980s')
  const [aiReporterAvatar, setAiReporterAvatar] = useState('female')
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [autoPlayVoice, setAutoPlayVoice] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const lastAIMessageRef = useRef<string>('')

  // 语音识别和合成hooks
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSupported: voiceSupported,
    error: voiceError,
    resetTranscript
  } = useVoiceRecognition()

  const {
    isSpeaking,
    speak,
    stop: stopSpeaking,
    isSupported: ttsSupported,
    isUsingChatTTS
  } = useChatTTS()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    initializeSession()
  }, [chapter])

  // 处理语音识别结果 - 录音结束后自动发送
  const [lastSentTranscript, setLastSentTranscript] = useState('')
  
  useEffect(() => {
    if (transcript && !isListening && transcript !== lastSentTranscript) {
      // 语音识别完成后，自动填入并发送
      setInput(transcript)
      setLastSentTranscript(transcript) // 记录已发送的transcript
      
      // 延迟一点时间确保input已更新，然后自动发送
      setTimeout(() => {
        if (transcript.trim() && transcript === lastSentTranscript) {
          handleAutoSend(transcript)
        }
      }, 100)
    }
  }, [transcript, isListening, lastSentTranscript])

  // 自动发送函数（用于语音录音结束后）
  const handleAutoSend = async (text: string) => {
    if (!text.trim()) return

    const userMessage: Message = {
      role: 'user',
      content: text,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user && sessionId) {
        // 获取当前的AI问题（最后一条AI消息）
        const lastAIMessage = messages.filter(m => m.role === 'ai').pop()
        const currentQuestion = lastAIMessage?.content || ''
        
        setInput('')
        resetTranscript() // 清空语音识别结果
        
        // 使用智能对话系统
        await saveAnswerAndGetNext(user.id, sessionId, currentQuestion, text)
      } else {
        // 回退到原有逻辑
        const savedResponses = JSON.parse(localStorage.getItem('interview_responses') || '[]')
        savedResponses.push({
          sessionId,
          chapter,
          roundNumber,
          question: messages[messages.length - 1]?.content || '',
          answer: text,
          timestamp: new Date().toISOString()
        })
        localStorage.setItem('interview_responses', JSON.stringify(savedResponses))

        setInput('')
        resetTranscript()
        await getNextQuestion(text, messages)
      }
    } catch (err) {
      console.error('Failed to save answer:', err)
      setInput('')
      resetTranscript()
      await getNextQuestion(text)
    }
  }

  // 监听AI消息变化，自动播放语音
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.role === 'ai' && lastMessage.content !== lastAIMessageRef.current) {
        lastAIMessageRef.current = lastMessage.content
        if (autoPlayVoice && ttsSupported) {
          // 先停止当前播放的语音，避免冲突
          stopSpeaking()
          // 延迟一下再播放，确保UI已更新
          setTimeout(() => {
            speak(lastMessage.content)
          }, 300)
        }
      }
    }
  }, [messages, autoPlayVoice, ttsSupported])

  const initializeSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !user.id) {
        console.log('用户未登录，跳转到登录页')
        navigate('/auth')
        return
      }

      console.log('当前用户ID:', user.id)
      
      // 确保用户记录存在于users表中
      try {
        const { error: upsertError } = await supabase
          .from('users')
          .upsert({
            id: user.id,
            email: user.email || 'anonymous@example.com',
            full_name: user.user_metadata?.full_name || null,
            avatar_url: user.user_metadata?.avatar_url || null,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          })
        
        if (upsertError) {
          console.warn('创建用户记录失败（可能已存在）:', upsertError)
        }
      } catch (userErr) {
        console.warn('用户记录创建异常:', userErr)
      }

      const chapterName = CHAPTER_NAMES[chapter || 'childhood']
      
      // 先尝试加载之前的对话历史
      const { data: history, error: historyError } = await supabase
        .from('conversation_history')
        .select('*')
        .eq('user_id', user.id)
        .eq('chapter', chapterName)
        .order('round_number', { ascending: true })

      if (history && history.length > 0) {
        // 找到最新的session_id
        const latestSession = history[history.length - 1]
        const existingSessionId = latestSession.session_id
        
        // 恢复对话历史
        const restoredMessages: Message[] = []
        let maxRound = 0
        
        for (const record of history) {
          if (record.session_id === existingSessionId) {
            // 添加AI问题
            if (record.ai_question) {
              restoredMessages.push({
                role: 'ai',
                content: record.ai_question,
                timestamp: new Date(record.created_at)
              })
            }
            
            // 添加用户回答
            if (record.user_answer) {
              restoredMessages.push({
                role: 'user',
                content: record.user_answer,
                timestamp: new Date(record.created_at)
              })
            }
            
            if (record.round_number > maxRound) {
              maxRound = record.round_number
            }
          }
        }
        
        if (restoredMessages.length > 0) {
          // 恢复会话
          setSessionId(existingSessionId)
          setMessages(restoredMessages)
          setRoundNumber(maxRound + 1)
          
          // 如果有未回答的问题，不需要再获取新问题
          const lastMessage = restoredMessages[restoredMessages.length - 1]
          if (lastMessage.role === 'ai') {
            // 最后一条是AI问题，用户还没回答，不需要获取新问题
            return
          }
          
          // 如果最后一条是用户回答，获取下一个问题
          await getNextQuestionFromSmart(user.id, existingSessionId)
          return
        }
      }

      // 如果没有历史记录，创建新的会话
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      setSessionId(newSessionId)

      // 使用智能对话系统获取第一个问题
      await getNextQuestionFromSmart(user.id, newSessionId)
    } catch (err) {
      console.error('Failed to initialize session:', err)
      // 即使初始化失败，也要开始访谈
      await getNextQuestion()
    }
  }

  // 本地智能回复系统
  const generateSmartReply = (userAnswer: string, chapter: string, roundNumber: number): { analysis: string; question: string } => {
    const answer = userAnswer.toLowerCase().trim()
    
    // 分析回答类型
    if (answer.includes('不想说') || answer.includes('不记得') || answer.includes('没什么')) {
      return {
        analysis: '我理解您可能需要一些时间来回忆，这很正常。',
        question: '没关系，我们可以从一个小细节开始。您童年时最喜欢去哪里玩呢？'
      }
    }
    
    // 地点类回答（如"小花园"）
    if (answer.includes('花园') || answer.includes('公园') || answer.includes('学校') || 
        answer.includes('家') || answer.includes('河边') || answer.includes('山上') || 
        answer.includes('田野') || answer.includes('操场') || answer.includes('后院') || 
        answer.includes('院子') || answer.includes('街道') || answer.includes('房子')) {
      return {
        analysis: '听起来是个很美好的地方！',
        question: '能告诉我您在那里都做些什么吗？那里最吸引您的是什么？'
      }
    }
    
    // 动作类回答（如"爬树"）
    if (answer.includes('爬') || answer.includes('跑') || answer.includes('跳') || 
        answer.includes('玩') || answer.includes('做') || answer.includes('去') ||
        answer.includes('看') || answer.includes('听') || answer.includes('说') ||
        answer.includes('吃') || answer.includes('喝') || answer.includes('走') || answer.includes('来')) {
      return {
        analysis: '这个经历听起来很有趣！',
        question: '能再具体说说那个场景吗？比如当时您在做什么？'
      }
    }

    if (answer.includes('开心') || answer.includes('快乐') || answer.includes('好玩')) {
      return {
        analysis: '听起来您有一个快乐的童年！这些美好的回忆很珍贵。',
        question: '能具体说说是什么让您这么开心吗？是和朋友们一起玩耍，还是有什么特别的玩具或活动？'
      }
    }
    
    if (answer.includes('家') || answer.includes('爸妈') || answer.includes('父母') || answer.includes('妈妈') || answer.includes('爸爸')) {
      return {
        analysis: '家庭总是我们最温暖的港湾。',
        question: '您的家人有什么特别让您印象深刻的事情吗？比如父母做过的让您感动的事？'
      }
    }
    
    if (answer.includes('学校') || answer.includes('同学') || answer.includes('老师') || answer.includes('朋友')) {
      return {
        analysis: '校园生活是我们成长中重要的一部分。',
        question: '学校生活中有什么特别有趣或难忘的事情吗？'
      }
    }
    
    // 默认智能回复
    const chapterQuestions = {
      childhood: [
        '听起来很有趣！能告诉我更多关于这个场景的细节吗？比如当时是什么季节，周围的环境是怎样的？',
        '这个回忆很珍贵！您还记得当时的心情吗？是什么让您印象这么深刻？',
        '很好！能说说这个经历对您后来的人生有什么影响吗？'
      ],
      youth: [
        '青春时光总是令人难忘！能告诉我更多关于这个经历的细节吗？',
        '这个阶段对您的成长一定很重要。能具体说说当时的感受吗？',
        '青春的故事总是充满活力！还有什么特别想分享的吗？'
      ],
      career: [
        '您的职业生涯一定很精彩！这个经历对您意味着什么？',
        '工作中的这些时刻塑造了现在的您。能说说当时的挑战和收获吗？',
        '您的专业经验一定很宝贵。能分享更多关于这个阶段的感悟吗？'
      ],
      family: [
        '家庭是我们最珍贵的财富。能告诉我更多关于这个温馨时刻的细节吗？',
        '家人的陪伴总是最珍贵的。能说说这个经历如何影响了您吗？',
        '家庭故事总是最动人的！还有什么特别想分享的吗？'
      ],
      reflection: [
        '您的智慧一定很丰富！能具体说说这个感悟是如何形成的吗？',
        '这些人生经验一定很宝贵。能分享更多关于这个思考的过程吗？',
        '您的见解一定很深刻。能说说这个感悟对您的人生有什么指导意义吗？'
      ]
    }
    
    const questions = chapterQuestions[chapter as keyof typeof chapterQuestions] || chapterQuestions.childhood
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)]
    
    return {
      analysis: '谢谢您的分享，每个人的故事都很独特。',
      question: randomQuestion
    }
  }

  // 从智能对话系统获取下一个问题
  const getNextQuestionFromSmart = async (userId: string, currentSessionId: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('ai-interviewer-smart', {
        body: {
          action: 'getNextQuestion',
          userId: userId,
          chapter: CHAPTER_NAMES[chapter || 'childhood'],
          sessionId: currentSessionId
        }
      })

      if (error) {
        console.error('智能对话系统错误:', error)
        // 回退到原有系统
        await getNextQuestion()
        return
      }

      // 修复：Supabase functions.invoke 返回的数据在 data 属性中
      const responseData = data?.data || data
      if (responseData?.question) {
        const aiMessage: Message = {
          role: 'ai',
          content: responseData.question,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, aiMessage])
        // 更新 roundNumber，确保保存回答时使用正确的轮次
        if (responseData.roundNumber) {
          setRoundNumber(responseData.roundNumber)
        }
        
        // 更新sessionId（如果返回了新的）
        if (responseData.sessionId) {
          setSessionId(responseData.sessionId)
        }
      } else {
        await getNextQuestion()
      }
    } catch (err) {
      console.error('获取问题失败:', err)
      await getNextQuestion()
    } finally {
      setLoading(false)
    }
  }

  // 保存回答并获取下一个问题
  const saveAnswerAndGetNext = async (userId: string, currentSessionId: string, currentQuestion: string, answer: string) => {
    setLoading(true)
    try {
      // 保存回答
      const { data: saveData, error: saveError } = await supabase.functions.invoke('ai-interviewer-smart', {
        body: {
          action: 'saveAnswer',
          userId: userId,
          chapter: CHAPTER_NAMES[chapter || 'childhood'],
          sessionId: currentSessionId,
          userAnswer: answer,
          roundNumber: roundNumber
        }
      })

      if (saveError) {
        console.error('保存回答失败:', saveError)
        // 回退到本地保存
        const savedResponses = JSON.parse(localStorage.getItem('interview_responses') || '[]')
        savedResponses.push({
          sessionId: currentSessionId,
          chapter,
          roundNumber,
          question: currentQuestion,
          answer: answer,
          timestamp: new Date().toISOString()
        })
        localStorage.setItem('interview_responses', JSON.stringify(savedResponses))
        
        // 使用原有系统获取下一个问题
        await getNextQuestion(answer, messages)
        return
      }

      // 获取下一个问题
      // 注意：roundNumber 已经由 getNextQuestionFromSmart 更新
      await getNextQuestionFromSmart(userId, currentSessionId)
      
    } catch (err) {
      console.error('保存并获取下一个问题失败:', err)
      await getNextQuestion(answer)
    } finally {
      setLoading(false)
    }
  }

  const getNextQuestion = async (userAnswer?: string, conversationHistory?: any[]) => {
    setLoading(true)
    
    try {
      // 优先使用LLM API
      const { data, error } = await supabase.functions.invoke('ai-interviewer-local', {
        body: {
          chapter,
          userAnswer,
          roundNumber,
          conversationHistory
        }
      })

      if (error) {
        console.error('Edge function error:', error)
        // LLM API失败时，使用本地智能回复系统作为备用
        if (userAnswer) {
          const smartReply = generateSmartReply(userAnswer, chapter || 'childhood', roundNumber)
          const aiMessage: Message = {
            role: 'ai',
            content: `${smartReply.analysis}\n\n${smartReply.question}`,
            timestamp: new Date()
          }
          setMessages(prev => [...prev, aiMessage])
          setRoundNumber(prev => prev + 1)
        } else {
          // 首次提问的备用问题
          const defaultQuestions = {
            childhood: "请告诉我您童年最难忘的一个场景或故事。",
            youth: "青春时期有什么特别让您印象深刻的人或事吗？",
            career: "您职业生涯中最有意义的时刻是什么？",
            family: "关于您的家庭，有什么珍贵的回忆想要分享？",
            reflection: "回顾您的人生，您最想对年轻人说什么？"
          }
          
          const aiMessage: Message = {
            role: 'ai',
            content: defaultQuestions[chapter as keyof typeof defaultQuestions] || "请分享您的人生故事。",
            timestamp: new Date()
          }
          setMessages(prev => [...prev, aiMessage])
        }
        setLoading(false)
        return
      }

      // LLM API成功返回
      const aiMessage: Message = {
        role: 'ai',
        content: data?.analysis ? `${data.analysis}\n\n${data.question}` : (data?.question || "请分享您的人生故事。"),
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMessage])
      setRoundNumber(data?.roundNumber || roundNumber + 1)
    } catch (err) {
      console.error('Failed to get question:', err)
      
      // 网络错误时，使用本地智能回复系统
      if (userAnswer) {
        const smartReply = generateSmartReply(userAnswer, chapter || 'childhood', roundNumber)
        const aiMessage: Message = {
          role: 'ai',
          content: `${smartReply.analysis}\n\n${smartReply.question}`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, aiMessage])
        setRoundNumber(prev => prev + 1)
      } else {
        const errorMessage: Message = {
          role: 'ai',
          content: '抱歉，获取问题时出现错误。请直接分享您的人生故事，我会认真倾听。',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])

    const currentInput = input
    setInput('') // 立即清空输入框

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user && sessionId) {
        // 获取当前的AI问题（最后一条AI消息）
        const lastAIMessage = messages.filter(m => m.role === 'ai').pop()
        const currentQuestion = lastAIMessage?.content || ''
        
        // 使用智能对话系统
        await saveAnswerAndGetNext(user.id, sessionId, currentQuestion, currentInput)
      } else {
        // 回退到原有逻辑
        const savedResponses = JSON.parse(localStorage.getItem('interview_responses') || '[]')
        savedResponses.push({
          sessionId,
          chapter,
          roundNumber,
          question: messages[messages.length - 2]?.content || '',
          answer: currentInput,
          timestamp: new Date().toISOString()
        })
        localStorage.setItem('interview_responses', JSON.stringify(savedResponses))

        await getNextQuestion(currentInput, messages)
      }
    } catch (err) {
      console.error('Failed to save answer:', err)
      await getNextQuestion(currentInput)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // 处理录音按钮点击
  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening()
    } else {
      if (!voiceSupported) {
        alert('您的浏览器不支持语音识别功能，请使用Chrome、Edge或Safari浏览器')
        return
      }
      stopSpeaking() // 停止AI语音播放
      startListening()
    }
  }

  // 切换语音播放
  const handleVoicePlayToggle = () => {
    if (isSpeaking) {
      // ChatTTS 不支持暂停/恢复，直接停止
      stopSpeaking()
    }
  }

  // AI自动生成记忆镜像（无需上传照片，根据对话内容智能生成）
  const handleGenerateMemoryMirror = async () => {
    try {
      setGeneratingImage(true)
      
      // 根据章节和年代风格自动生成记忆镜像
      // 使用对话内容作为上下文（如果可用）
      const chapterContext = chapter || 'childhood'
      const recentMessages = messages.slice(-3).map(m => m.content).join(' ')
      
      // 生成记忆镜像（不依赖用户照片）
      const mirrorUrl = await generateMemoryMirror('', selectedEra, chapterContext)
      setMemoryMirrorUrl(mirrorUrl)

      // 保存到本地存储
      const mirrorData = {
        sessionId,
        mirrorUrl,
        era: selectedEra,
        chapter: chapterContext,
        timestamp: new Date().toISOString()
      }
      localStorage.setItem('memory_mirrors', JSON.stringify([...JSON.parse(localStorage.getItem('memory_mirrors') || '[]'), mirrorData]))
      
    } catch (err) {
      console.error('Failed to generate memory mirror:', err)
      alert('生成记忆镜像失败，请稍后再试')
    } finally {
      setGeneratingImage(false)
    }
  }

  const handleFinish = () => {
    navigate('/style')
  }

  const eraSymbols = getEraSymbols(chapter, selectedEra)

  // 获取当前用户ID用于灵感输入
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUserId(user.id)
      }
    })
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* 灵感输入组件 */}
      {currentUserId && (
        <InspirationInput 
          chapter={chapter || 'childhood'} 
          userId={currentUserId}
          onSaved={() => {
            // 灵感保存后的回调，可以刷新对话或显示提示
            console.log('灵感记录已保存')
          }}
        />
      )}
      {/* 顶部导航 */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-amber-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/chapters')}
            className="flex items-center gap-2 text-amber-700 hover:text-amber-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            返回章节选择
          </button>
          <h1 className="text-xl font-serif font-semibold text-amber-900">
            {CHAPTER_NAMES[chapter || 'childhood']} - 记忆回溯
          </h1>
          <button
            onClick={handleFinish}
            className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            完成访谈
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
          {/* 左侧：AI记者对话区 */}
          <div className="col-span-7 bg-white rounded-xl shadow-lg overflow-hidden flex flex-col">
            {/* AI记者头像区域 */}
            <div className="bg-gradient-to-r from-amber-100 to-orange-100 p-4 border-b border-amber-200">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    {aiReporterAvatar === 'female' ? (
                      <User className="w-8 h-8 text-white" />
                    ) : (
                      <MessageCircle className="w-8 h-8 text-white" />
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-amber-900">AI记者 - 小雅</h3>
                  <p className="text-sm text-amber-700">正在与您进行深度访谈</p>
                  <div className="flex items-center gap-2 mt-1">
                    <select
                      value={aiReporterAvatar}
                      onChange={(e) => setAiReporterAvatar(e.target.value)}
                      className="text-xs px-2 py-1 border border-amber-300 rounded bg-white"
                    >
                      <option value="female">女性记者</option>
                      <option value="male">男性记者</option>
                    </select>
                    <span className="text-xs text-amber-600">轮次: {roundNumber}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 对话区域 */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-amber-600 py-8">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>AI记者正在准备第一个问题...</p>
                </div>
              )}
              
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                    message.role === 'user' 
                      ? 'bg-amber-600 text-white' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {message.role === 'ai' && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                          <User className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-xs font-medium text-amber-700">AI记者</span>
                      </div>
                    )}
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-amber-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl px-4 py-3 max-w-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                        <User className="w-3 h-3 text-white" />
                      </div>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* 输入区域 */}
            <div className="border-t border-amber-200 p-4">
              {/* 语音播放状态提示 */}
              {isSpeaking && (
                <div className="mb-3 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-blue-600 animate-pulse" />
                    <span className="text-sm text-blue-700 font-medium">AI记者正在播放语音...</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleVoicePlayToggle}
                      className="p-1 hover:bg-blue-100 rounded transition-colors"
                      title="停止播放"
                    >
                      <VolumeX className="w-4 h-4 text-blue-600" />
                    </button>
                    <button
                      onClick={stopSpeaking}
                      className="p-1 hover:bg-blue-100 rounded transition-colors"
                      title="停止播放"
                    >
                      <VolumeX className="w-4 h-4 text-blue-600" />
                    </button>
                  </div>
                </div>
              )}

              {/* 语音错误提示 */}
              {voiceError && (
                <div className="mb-3 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <span className="text-sm text-yellow-700">{voiceError}</span>
                </div>
              )}

              {/* 居中的录音按钮区域 */}
              <div className="mb-4">
                <div className="flex flex-col items-center justify-center py-8">
                  {/* 录音状态提示 */}
                  {isListening && (
                    <div className="mb-4 px-6 py-3 bg-red-50 border border-red-200 rounded-full flex items-center gap-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-6 bg-red-500 rounded animate-pulse"></div>
                        <div className="w-2 h-6 bg-red-500 rounded animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-6 bg-red-500 rounded animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-6 bg-red-500 rounded animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                      </div>
                      <span className="text-base text-red-700 font-semibold">正在录音中...</span>
                    </div>
                  )}
                  
                  {/* 识别中的文字提示 */}
                  {isListening && transcript && (
                    <div className="mb-4 px-4 py-2 bg-gray-100 rounded-lg max-w-md text-center">
                      <span className="text-sm text-gray-700">识别中: {transcript}</span>
                    </div>
                  )}
                  
                  {/* 大型居中录音按钮 */}
                  <button
                    onClick={handleVoiceToggle}
                    disabled={loading}
                    className={`${
                      isListening 
                        ? 'w-32 h-32 bg-red-500 hover:bg-red-600 shadow-2xl shadow-red-500/50 animate-pulse scale-110' 
                        : 'w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-xl hover:shadow-2xl hover:scale-105'
                    } rounded-full text-white transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={isListening ? '点击停止录音（录音后自动发送）' : '点击开始录音'}
                  >
                    {isListening ? (
                      <MicOff className="w-12 h-12" />
                    ) : (
                      <Mic className="w-10 h-10" />
                    )}
                  </button>
                  
                  {/* 录音提示文字 */}
                  <p className="mt-4 text-sm text-gray-600 text-center">
                    {isListening 
                      ? '点击按钮停止录音，录音结束后将自动发送' 
                      : '点击麦克风按钮开始录音'}
                  </p>
                </div>
              </div>

              {/* 输入控制栏 */}
              <div className="flex gap-3">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="也可以在这里直接输入文字..."
                  className="flex-1 resize-none border border-amber-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  rows={2}
                  disabled={isListening}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading || isListening}
                  className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  发送
                </button>
              </div>

              {/* 语音功能开关 */}
              <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoPlayVoice}
                      onChange={(e) => setAutoPlayVoice(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>自动播放AI语音</span>
                  </label>
                  {!voiceSupported && (
                    <span className="text-yellow-600">语音识别不可用</span>
                  )}
                  {!ttsSupported && (
                    <span className="text-yellow-600">语音播放不可用</span>
                  )}
                </div>
                <span className="text-gray-400">
                  {voiceSupported ? '支持语音输入' : ''} {ttsSupported ? '支持语音播放' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* 右侧：记忆镜像和时代背景 */}
          <div className="col-span-5 space-y-6">
            {/* 记忆镜像引擎 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-amber-900 mb-4 flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                记忆镜像引擎
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">选择年代风格</label>
                  <select
                    value={selectedEra}
                    onChange={(e) => setSelectedEra(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="1960s">1960年代</option>
                    <option value="1970s">1970年代</option>
                    <option value="1980s">1980年代</option>
                    <option value="1990s">1990年代</option>
                    <option value="2000s">2000年代</option>
                  </select>
                </div>

                <div>
                  <button
                    onClick={handleGenerateMemoryMirror}
                    disabled={generatingImage}
                    className="w-full px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ImageIcon className="w-5 h-5" />
                    {generatingImage ? 'AI正在生成中...' : '✨ AI生成记忆镜像'}
                  </button>
                  <p className="text-xs text-amber-600 mt-2 text-center">
                    根据您的对话内容，AI将自动生成符合年代风格的美好回忆
                  </p>
                </div>

                {memoryMirrorUrl && (
                  <div className="space-y-3">
                    <div className="relative">
                      <img 
                        src={memoryMirrorUrl} 
                        alt="记忆镜像" 
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                        {selectedEra}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 text-center">
                      AI生成的{selectedEra}年代风格记忆镜像
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 时代背景锚点 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-amber-900 mb-4">时代背景</h3>
              <div className="grid grid-cols-2 gap-3">
                {eraSymbols.map((symbol, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg">
                    <div className="w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center">
                      <span className="text-sm">📷</span>
                    </div>
                    <span className="text-sm text-gray-700">{symbol}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
