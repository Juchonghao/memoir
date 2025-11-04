import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Loader2 } from 'lucide-react'

const writingStyles = [
  {
    id: 'moyan',
    name: '莫言',
    subtitle: '乡土魔幻',
    description: '运用感官细节、乡土语言、魔幻现实主义手法，将生活的粗粝与温情并呈',
    sample: '那是一个飘着炊烟的小山村，泥土的气息混合着青草的味道...',
  },
  {
    id: 'liucixin',
    name: '刘慈欣',
    subtitle: '宏大叙事',
    description: '理性思维、宏观视角、科技与人文结合，在广阔的时空中审视人生',
    sample: '在时间的长河中，每个个体都是一颗微小但独特的星辰...',
  },
  {
    id: 'yiqiuyu',
    name: '余秋雨',
    subtitle: '文化哲思',
    description: '文化意象、历史典故、沉静思辨，从文化视角解读生命历程',
    sample: '人生如一场文化的朝圣，每一步都踏在历史的回响之上...',
  },
]

export default function StyleSelection() {
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleGenerate = async () => {
    if (!selectedStyle) return
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/auth')
        return
      }

      // 获取所有访谈数据
      const { data: sessions } = await supabase
        .from('interview_sessions')
        .select(`
          *,
          interview_responses(*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'in_progress')

      if (!sessions || sessions.length === 0) {
        throw new Error('没有找到访谈记录')
      }

      // 调用传记生成函数
      const { data: biographyData, error: funcError } = await supabase.functions.invoke('generate-biography', {
        body: {
          interviewData: sessions,
          writingStyle: selectedStyle,
          title: `${user.email?.split('@')[0]}的人生故事`
        }
      })

      if (funcError) throw funcError

      // 保存传记
      const { data: biography, error: saveError } = await supabase
        .from('biographies')
        .insert({
          user_id: user.id,
          title: `${user.email?.split('@')[0]}的人生故事`,
          content: biographyData.content,
          writing_style: selectedStyle,
          status: 'published'
        })
        .select()
        .single()

      if (saveError) throw saveError

      // 更新访谈状态
      await supabase
        .from('interview_sessions')
        .update({ status: 'completed' })
        .eq('user_id', user.id)

      navigate(`/biography/${biography.id}`)
    } catch (err) {
      console.error('生成传记失败:', err)
      alert('生成传记失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen px-6 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="font-display text-5xl font-bold mb-4">
            选择您的文风
          </h1>
          <p className="font-body text-xl text-text-secondary">
            让大师的笔触，为您的故事增添独特的文学魅力
          </p>
        </div>

        <div className="space-y-6 mb-12">
          {writingStyles.map((style) => (
            <StyleCard
              key={style.id}
              style={style}
              selected={selectedStyle === style.id}
              onSelect={() => setSelectedStyle(style.id)}
            />
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={handleGenerate}
            disabled={!selectedStyle || loading}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                生成中...
              </>
            ) : (
              '生成我的传记'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function StyleCard({ style, selected, onSelect }: { 
  style: typeof writingStyles[0]; 
  selected: boolean; 
  onSelect: () => void 
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full card p-8 text-left transition-all duration-300 ${
        selected ? 'ring-4 ring-accent-primary shadow-card-hover' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-display text-3xl font-semibold mb-2">
            {style.name}
          </h3>
          <p className="font-ui text-sm text-accent-primary uppercase tracking-wide">
            {style.subtitle}
          </p>
        </div>
        <div
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
            selected
              ? 'border-accent-primary bg-accent-primary'
              : 'border-bg-divider'
          }`}
        >
          {selected && <div className="w-3 h-3 rounded-full bg-white" />}
        </div>
      </div>

      <p className="font-body text-lg text-text-secondary mb-6 leading-relaxed">
        {style.description}
      </p>

      <div className="p-6 bg-bg-surface rounded-sm border-l-4 border-accent-light">
        <p className="font-body text-lg text-text-tertiary italic leading-relaxed">
          {style.sample}
        </p>
      </div>
    </button>
  )
}
