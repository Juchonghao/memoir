// ChatTTS 高质量语音合成 Hook
// 优先使用本地ChatTTS服务器，如果不可用则回退到浏览器TTS

import { useState, useRef } from 'react'

interface ChatTTSHook {
  isSpeaking: boolean
  speak: (text: string) => Promise<void>
  stop: () => void
  isSupported: boolean
  isUsingChatTTS: boolean
}

const CHATTTS_SERVER_URL = 'http://localhost:8080'

export const useChatTTS = (): ChatTTSHook => {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isUsingChatTTS, setIsUsingChatTTS] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // 检查ChatTTS服务器是否可用
  const checkChatTTSServer = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${CHATTTS_SERVER_URL}/health`, { 
        method: 'GET',
        signal: AbortSignal.timeout(2000) // 2秒超时
      })
      return response.ok
    } catch {
      return false
    }
  }

  const speak = async (text: string) => {
    if (!text) return

    // 先停止当前播放
    stop()

    // 检查ChatTTS服务器是否可用
    const chatTTSAvailable = await checkChatTTSServer()
    
    if (chatTTSAvailable) {
      try {
        setIsUsingChatTTS(true)
        setIsSpeaking(true)

        // 调用ChatTTS API
        const response = await fetch(`${CHATTTS_SERVER_URL}/api/tts_base64`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: text,
            speaker: 'female-shaonv', // 清甜少女音，适合老年人访谈
            speed: 0.9, // 稍慢的语速
            pitch: -2, // 稍微低一点的音调
            volume: 0.95
          })
        })

        if (!response.ok) {
          // 503状态码表示服务不可用，应该回退到浏览器TTS
          if (response.status === 503) {
            const errorData = await response.json().catch(() => ({}))
            console.log('ChatTTS服务不可用，回退到浏览器TTS:', errorData.details || '')
          }
          throw new Error('ChatTTS API error')
        }

        const data = await response.json()
        console.log('[ChatTTS] 收到响应:', { 
          success: data.success, 
          has_audio: !!data.audio_base64,
          audio_length: data.audio_base64?.length || 0,
          format: data.format,
          sample_rate: data.sample_rate
        })
        
        if (data.success && data.audio_base64) {
          // 创建音频对象
          const audioUrl = `data:audio/wav;base64,${data.audio_base64}`
          console.log('[ChatTTS] 创建音频对象，URL长度:', audioUrl.length)
          const audio = new Audio(audioUrl)
          audioRef.current = audio

          audio.onloadeddata = () => {
            console.log('[ChatTTS] 音频加载完成，准备播放')
          }

          audio.oncanplay = () => {
            console.log('[ChatTTS] 音频可以播放')
          }

          audio.onended = () => {
            console.log('[ChatTTS] 音频播放完成')
            setIsSpeaking(false)
          }

          audio.onerror = (e) => {
            console.error('[ChatTTS] 音频播放错误:', e, audio.error)
            setIsSpeaking(false)
            setIsUsingChatTTS(false)
            // 回退到浏览器TTS
            fallbackToBrowserTTS(text)
          }

          try {
            console.log('[ChatTTS] 开始播放音频...')
            await audio.play()
            console.log('[ChatTTS] 音频播放已启动')
          } catch (playError) {
            console.error('[ChatTTS] 播放失败:', playError)
            setIsSpeaking(false)
            setIsUsingChatTTS(false)
            fallbackToBrowserTTS(text)
          }
          return
        } else {
          console.warn('[ChatTTS] 响应中没有音频数据:', data)
          setIsUsingChatTTS(false)
          fallbackToBrowserTTS(text)
        }
      } catch (error) {
        console.log('ChatTTS不可用，回退到浏览器TTS:', error)
        setIsUsingChatTTS(false)
        // 回退到浏览器TTS
        fallbackToBrowserTTS(text)
        return
      }
    } else {
      // ChatTTS不可用，使用浏览器TTS
      setIsUsingChatTTS(false)
      fallbackToBrowserTTS(text)
    }
  }

  const fallbackToBrowserTTS = (text: string) => {
    if (!('speechSynthesis' in window)) {
      console.error('浏览器不支持语音合成')
      return
    }

    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'zh-CN'
    utterance.rate = 0.85
    utterance.pitch = 0.90
    utterance.volume = 0.90

    // 选择最佳语音
    const voices = window.speechSynthesis.getVoices()
    const priorityVoice = 
      voices.find(voice => 
        voice.lang.includes('zh') && 
        voice.name.includes('Yaoyao')
      ) ||
      voices.find(voice => 
        voice.lang.includes('zh') && 
        (voice.name.includes('XiaoxiaoNeural') || 
         voice.name.includes('Neural'))
      ) ||
      voices.find(voice => 
        voice.lang.includes('zh') && 
        !voice.name.includes('Male') && 
        !voice.name.includes('男')
      ) ||
      voices.find(voice => voice.lang.includes('zh'))

    if (priorityVoice) {
      utterance.voice = priorityVoice
    }

    utterance.onstart = () => {
      setIsSpeaking(true)
    }

    utterance.onend = () => {
      setIsSpeaking(false)
    }

    utterance.onerror = () => {
      setIsSpeaking(false)
    }

    window.speechSynthesis.speak(utterance)
  }

  const stop = () => {
    // 停止ChatTTS音频
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }

    // 停止浏览器TTS
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }

    setIsSpeaking(false)
  }

  return {
    isSpeaking,
    speak,
    stop,
    isSupported: true, // 总是支持（有回退方案）
    isUsingChatTTS
  }
}

