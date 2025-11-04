import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Download, Share2 } from 'lucide-react'
import type { Biography } from '../types'

export default function BiographyView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [biography, setBiography] = useState<Biography | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBiography()
  }, [id])

  const loadBiography = async () => {
    try {
      const { data, error } = await supabase
        .from('biographies')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setBiography(data)
    } catch (err) {
      console.error('加载传记失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!biography) return
    const blob = new Blob([biography.content || ''], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${biography.title}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-ui text-text-secondary">加载中...</p>
        </div>
      </div>
    )
  }

  if (!biography) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="font-body text-xl text-text-secondary mb-4">未找到传记</p>
          <button onClick={() => navigate('/chapters')} className="btn-primary">
            返回首页
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Hero Section */}
      <div className="relative h-[70vh] flex items-center justify-center bg-gradient-to-b from-accent-light to-bg-surface">
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <h1 className="font-display text-6xl md:text-7xl font-bold mb-6 text-text-primary">
            {biography.title}
          </h1>
          <p className="font-ui text-lg text-text-tertiary uppercase tracking-wide">
            {new Date(biography.created_at).toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="sticky top-0 bg-bg-primary/95 backdrop-blur-sm border-b border-bg-divider z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/chapters')}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-ui">返回</span>
          </button>
          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 rounded-sm border border-bg-divider hover:bg-bg-surface transition-colors"
            >
              <Download className="w-5 h-5" />
              <span className="font-ui text-sm">下载</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-sm border border-bg-divider hover:bg-bg-surface transition-colors">
              <Share2 className="w-5 h-5" />
              <span className="font-ui text-sm">分享</span>
            </button>
          </div>
        </div>
      </div>

      {/* Biography Content */}
      <article className="max-w-[650px] mx-auto px-6 py-16">
        <div className="prose prose-lg">
          {biography.content?.split('\n\n').map((paragraph, index) => {
            if (index === 0) {
              return (
                <p key={index} className="drop-cap font-body text-body leading-relaxed mb-md text-text-primary">
                  {paragraph}
                </p>
              )
            }

            // 每3-5段插入一个Pull Quote
            if (index % 4 === 0 && paragraph.length > 50) {
              return (
                <blockquote key={index} className="pull-quote">
                  {paragraph.slice(0, 100)}...
                </blockquote>
              )
            }

            return (
              <p key={index} className="font-body text-body leading-relaxed mb-md text-text-primary">
                {paragraph}
              </p>
            )
          })}
        </div>

        <div className="mt-16 pt-8 border-t border-bg-divider">
          <p className="font-ui text-sm text-text-tertiary text-center">
            本传记由纪传体AI应用生成 · 采用{biography.writing_style === 'moyan' ? '莫言' : biography.writing_style === 'liucixin' ? '刘慈欣' : '余秋雨'}文风
          </p>
        </div>
      </article>
    </div>
  )
}
