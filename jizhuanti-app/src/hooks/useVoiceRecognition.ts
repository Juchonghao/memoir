import { useState, useEffect, useRef } from 'react'

interface VoiceRecognitionHook {
  isListening: boolean
  transcript: string
  startListening: () => void
  stopListening: () => void
  isSupported: boolean
  error: string | null
  resetTranscript: () => void
}

export const useVoiceRecognition = (): VoiceRecognitionHook => {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    // 检查浏览器是否支持 Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    
    if (SpeechRecognition) {
      setIsSupported(true)
      recognitionRef.current = new SpeechRecognition()
      
      // 配置语音识别
      recognitionRef.current.continuous = true // 持续识别
      recognitionRef.current.interimResults = true // 显示中间结果
      recognitionRef.current.lang = 'zh-CN' // 中文识别
      recognitionRef.current.maxAlternatives = 1

      // 识别结果处理
      recognitionRef.current.onresult = (event: any) => {
        let currentTranscript = ''
        let hasFinalResult = false
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            currentTranscript += transcript
            hasFinalResult = true
          }
        }
        
        // 只有在有最终结果时才更新transcript，避免中间结果的重复触发
        if (hasFinalResult && currentTranscript.trim()) {
          setTranscript(currentTranscript.trim())
        }
      }

      // 错误处理
      recognitionRef.current.onerror = (event: any) => {
        console.error('语音识别错误:', event.error)
        
        if (event.error === 'no-speech') {
          setError('未检测到语音，请重试')
        } else if (event.error === 'audio-capture') {
          setError('无法访问麦克风，请检查权限')
        } else if (event.error === 'not-allowed') {
          setError('麦克风权限被拒绝')
        } else {
          setError('语音识别错误: ' + event.error)
        }
        
        setIsListening(false)
      }

      // 识别结束
      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    } else {
      setIsSupported(false)
      setError('您的浏览器不支持语音识别功能，请使用Chrome、Edge或Safari浏览器')
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const startListening = () => {
    if (!isSupported || !recognitionRef.current) {
      setError('语音识别不可用')
      return
    }

    try {
      setTranscript('')
      setError(null)
      recognitionRef.current.start()
      setIsListening(true)
    } catch (err) {
      console.error('启动语音识别失败:', err)
      setError('启动语音识别失败')
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  const resetTranscript = () => {
    setTranscript('')
  }

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSupported,
    error,
    resetTranscript
  }
}
