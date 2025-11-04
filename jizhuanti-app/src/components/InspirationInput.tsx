// 灵感输入模块 - 让用户可以自由记录经历，不受问题限制
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { Mic, MicOff, Sparkles, Save, X } from 'lucide-react'
import { useVoiceRecognition } from '../hooks/useVoiceRecognition'
// import { useChatTTS } from '../hooks/useChatTTS' // 暂时不需要，灵感输入不需要TTS

interface InspirationInputProps {
  chapter: string
  userId: string
  onSaved?: () => void
}

const CHAPTER_NAMES: Record<string, string> = {
  childhood: '童年故里',
  youth: '青春之歌',
  career: '事业征程',
  family: '家庭港湾',
  reflection: '流金岁月',
}

export default function InspirationInput({ chapter, userId, onSaved }: InspirationInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [content, setContent] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [category, setCategory] = useState<string>('')
  const [isClassifying, setIsClassifying] = useState(false)

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSupported: voiceSupported,
    resetTranscript
  } = useVoiceRecognition()

  // 自动分类内容
  const classifyContent = async (text: string): Promise<string> => {
    if (!text.trim()) return ''

    setIsClassifying(true)
    try {
      // 使用DeepSeek API进行内容分类
      const { data, error } = await supabase.functions.invoke('ai-interviewer-smart', {
        body: {
          action: 'classifyContent',
          text: text,
          chapter: CHAPTER_NAMES[chapter] || '童年故里'
        }
      })

      if (error || !data) {
        // 如果API失败，使用简单的关键词分类
        return simpleKeywordClassification(text)
      }

      // 处理返回的数据结构
      const responseData = data?.data || data
      return responseData?.category || simpleKeywordClassification(text)
    } catch (err) {
      console.error('分类失败:', err)
      return simpleKeywordClassification(text)
    } finally {
      setIsClassifying(false)
    }
  }

  // 简单的关键词分类（备用方案）
  const simpleKeywordClassification = (text: string): string => {
    const lowerText = text.toLowerCase()
    
    if (lowerText.includes('工作') || lowerText.includes('同事') || lowerText.includes('办公室') || 
        lowerText.includes('公司') || lowerText.includes('职业') || lowerText.includes('事业')) {
      return 'career'
    }
    
    if (lowerText.includes('家庭') || lowerText.includes('家人') || lowerText.includes('父母') || 
        lowerText.includes('孩子') || lowerText.includes('妻子') || lowerText.includes('丈夫') || 
        lowerText.includes('结婚') || lowerText.includes('婚礼')) {
      return 'family'
    }
    
    if (lowerText.includes('童年') || lowerText.includes('小时候') || lowerText.includes('学校') || 
        lowerText.includes('同学') || lowerText.includes('老师') || lowerText.includes('玩具')) {
      return 'childhood'
    }
    
    if (lowerText.includes('青春') || lowerText.includes('大学') || lowerText.includes('恋爱') || 
        lowerText.includes('朋友') || lowerText.includes('梦想')) {
      return 'youth'
    }
    
    if (lowerText.includes('退休') || lowerText.includes('感悟') || lowerText.includes('人生') || 
        lowerText.includes('回忆') || lowerText.includes('总结')) {
      return 'reflection'
    }

    // 默认使用当前章节
    return chapter || 'childhood'
  }

  // 处理语音识别结果
  useEffect(() => {
    if (transcript && !isListening) {
      setContent(prev => prev + (prev ? ' ' : '') + transcript)
      resetTranscript()
    }
  }, [transcript, isListening, resetTranscript])

  // 开始录音
  const handleStartRecording = () => {
    if (voiceSupported) {
      startListening()
      setIsRecording(true)
    } else {
      alert('您的浏览器不支持语音识别功能')
    }
  }

  // 停止录音
  const handleStopRecording = () => {
    stopListening()
    setIsRecording(false)
  }

  // 保存灵感记录
  const handleSave = async () => {
    if (!content.trim()) {
      alert('请输入内容')
      return
    }

    setIsSaving(true)
    try {
      // 自动分类（在保存时分类，并显示分类结果）
      setIsClassifying(true)
      const detectedCategory = await classifyContent(content)
      const finalCategory = detectedCategory || chapter
      setCategory(finalCategory)
      setIsClassifying(false)

      // 保存到数据库
      const { error } = await supabase
        .from('inspiration_records')
        .insert({
          user_id: userId,
          chapter: CHAPTER_NAMES[finalCategory] || CHAPTER_NAMES[chapter] || '童年故里',
          content: content,
          category: finalCategory,
          created_at: new Date().toISOString()
        })

      if (error) {
        throw error
      }

      // 清空内容
      setContent('')
      setCategory('')
      setIsOpen(false)
      
      // 通知父组件
      if (onSaved) {
        onSaved()
      }

      // 使用更友好的提示
      const toast = document.createElement('div')
      toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2'
      toast.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <span>灵感记录已保存！已自动分类到：${CHAPTER_NAMES[finalCategory] || '当前章节'}</span>
      `
      document.body.appendChild(toast)
      setTimeout(() => {
        toast.remove()
      }, 3000)
    } catch (err) {
      console.error('保存失败:', err)
      alert('保存失败，请重试')
    } finally {
      setIsSaving(false)
    }
  }

  // 关闭面板
  const handleClose = () => {
    if (isRecording) {
      handleStopRecording()
    }
    setContent('')
    setCategory('')
    setIsOpen(false)
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-2xl hover:shadow-purple-500/50 transition-all flex items-center justify-center hover:scale-110 z-50"
        title="记录灵感"
      >
        <Sparkles className="w-8 h-8" />
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              记录灵感
            </h2>
            <p className="text-sm text-purple-100 mt-1">自由记录您的人生经历，不受问题限制</p>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* 分类显示 */}
          {isClassifying && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-600 flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span>正在分析内容并自动分类...</span>
              </p>
            </div>
          )}
          {category && !isClassifying && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <p className="text-sm text-purple-600">
                <span className="font-semibold">自动分类：</span>
                {CHAPTER_NAMES[category] || category}
              </p>
              <p className="text-xs text-purple-500 mt-1">将保存到该章节</p>
            </div>
          )}

          {/* 文本输入区 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              记录内容
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="在这里输入或说出您想记录的经历...&#10;&#10;例如：&#10;• 小时候在院子里种花的日子&#10;• 第一次出远门的经历&#10;• 和朋友们一起的快乐时光"
              className="w-full h-64 p-4 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 resize-none text-lg leading-relaxed"
              autoFocus
            />
          </div>

          {/* 语音控制 */}
          <div className="flex items-center gap-4">
            {!isRecording ? (
              <button
                onClick={handleStartRecording}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all font-medium shadow-lg"
              >
                <Mic className="w-5 h-5" />
                开始录音
              </button>
            ) : (
              <button
                onClick={handleStopRecording}
                className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all font-medium shadow-lg animate-pulse"
              >
                <MicOff className="w-5 h-5" />
                停止录音
              </button>
            )}
            {isListening && (
              <div className="flex items-center gap-2 text-red-500">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm">正在录音...</span>
              </div>
            )}
          </div>
        </div>

        {/* 底部操作 */}
        <div className="border-t border-gray-200 p-6 flex items-center justify-between bg-gray-50">
          <button
            onClick={handleClose}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!content.trim() || isSaving || isClassifying}
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving || isClassifying ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {isClassifying ? '分类中...' : '保存中...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                保存
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

