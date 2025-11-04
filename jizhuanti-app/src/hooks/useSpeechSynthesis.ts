import { useState, useEffect, useRef } from 'react'

interface SpeechSynthesisHook {
  isSpeaking: boolean
  speak: (text: string) => void
  stop: () => void
  pause: () => void
  resume: () => void
  isSupported: boolean
  isPaused: boolean
}

export const useSpeechSynthesis = (): SpeechSynthesisHook => {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    // 检查浏览器是否支持语音合成
    setIsSupported('speechSynthesis' in window)

    return () => {
      // 清理：停止所有语音
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const speak = (text: string) => {
    if (!isSupported || !text) return

    // 停止当前播放
    window.speechSynthesis.cancel()

    // 创建新的语音实例
    const utterance = new SpeechSynthesisUtterance(text)
    utteranceRef.current = utterance

    // 配置语音参数 - 进一步优化更自然
    utterance.lang = 'zh-CN' // 中文
    utterance.rate = 0.85 // 更慢的语速，更接近真人对话节奏
    utterance.pitch = 0.90 // 更低的音调，更温和自然
    utterance.volume = 0.90 // 适中音量，避免过大或过小

    // 智能选择最自然的中文语音 - 优先选择Yaoyao
    const voices = window.speechSynthesis.getVoices()
    
    // 语音选择策略：优先选择Yaoyao
    // 1. 首选Yaoyao语音（用户指定）
    // 2. 其他高质量中文女声
    // 3. 任何中文语音
    const priorityVoice = 
      voices.find(voice => 
        voice.lang.includes('zh') && 
        voice.name.includes('Yaoyao')  // 优先选择Yaoyao
      ) ||
      // 1. 优先选择微软Azure Neural语音（最自然真实）
      voices.find(voice => 
        voice.lang.includes('zh') && 
        (voice.name.includes('XiaoxiaoNeural') || 
         voice.name.includes('Xiaoxiao') ||
         voice.name.includes('XiaoyiNeural') ||
         voice.name.includes('Xiaoyi') ||
         voice.name.includes('XiaohanNeural') ||
         voice.name.includes('Xiaohan') ||
         voice.name.includes('XiaomoNeural') ||
         voice.name.includes('Xiaomo') ||
         voice.name.includes('Neural'))
      ) ||
      // 2. macOS/iOS 系统语音（质量较好）
      voices.find(voice => 
        voice.lang.includes('zh') && 
        (voice.name.includes('Ting-Ting') || 
         voice.name.includes('Mei-Jia') ||
         voice.name.includes('Sinji'))
      ) ||
      // 3. 其他高质量中文女声
      voices.find(voice => 
        voice.lang.includes('zh') && 
        (voice.name.includes('Female') || 
         voice.name.includes('女') ||
         voice.name.includes('Girl') ||
         voice.name.includes('Woman'))
      ) ||
      // 4. 任何中文女声（排除男声）
      voices.find(voice => 
        voice.lang.includes('zh') && 
        !voice.name.includes('Male') && 
        !voice.name.includes('男') &&
        !voice.name.includes('Man')
      ) ||
      // 5. 任何中文语音（兜底）
      voices.find(voice => voice.lang.includes('zh'))
    
    if (priorityVoice) {
      utterance.voice = priorityVoice
      console.log('选择语音:', priorityVoice.name, '参数: rate=' + utterance.rate + ', pitch=' + utterance.pitch)
    } else {
      console.log('使用默认语音，参数: rate=' + utterance.rate + ', pitch=' + utterance.pitch)
    }

    // 事件监听
    utterance.onstart = () => {
      setIsSpeaking(true)
      setIsPaused(false)
    }

    utterance.onend = () => {
      setIsSpeaking(false)
      setIsPaused(false)
    }

    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      // 'interrupted' 和 'not-allowed' 错误通常是正常的，不需要记录为错误
      // 'interrupted': 新语音中断了旧语音（正常）
      // 'not-allowed': 浏览器权限问题或用户拒绝（静默处理）
      if (event.error !== 'interrupted' && event.error !== 'not-allowed') {
        console.error('语音合成错误:', event)
      }
      setIsSpeaking(false)
      setIsPaused(false)
    }

    utterance.onpause = () => {
      setIsPaused(true)
    }

    utterance.onresume = () => {
      setIsPaused(false)
    }

    // 开始播放
    window.speechSynthesis.speak(utterance)
  }

  const stop = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      setIsPaused(false)
    }
  }

  const pause = () => {
    if (window.speechSynthesis && isSpeaking && !isPaused) {
      window.speechSynthesis.pause()
      setIsPaused(true)
    }
  }

  const resume = () => {
    if (window.speechSynthesis && isSpeaking && isPaused) {
      window.speechSynthesis.resume()
      setIsPaused(false)
    }
  }

  return {
    isSpeaking,
    speak,
    stop,
    pause,
    resume,
    isSupported,
    isPaused
  }
}
