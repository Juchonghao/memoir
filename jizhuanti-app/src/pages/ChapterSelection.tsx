import { useNavigate } from 'react-router-dom'
import { Mountain, Music, Briefcase, Home, Sparkles } from 'lucide-react'

const chapters = [
  {
    id: 'childhood',
    title: '童年故里',
    subtitle: '关于家乡、童年记忆、家庭成员',
    icon: Home,
    image: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    prompt: '闭上眼睛，还记得老家门口那条路吗？'
  },
  {
    id: 'youth',
    title: '青春之歌',
    subtitle: '关于校园、青春时光、友情爱情',
    icon: Music,
    image: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    prompt: '那些青春岁月里，最让你难忘的是什么？'
  },
  {
    id: 'career',
    title: '事业征程',
    subtitle: '关于职业发展、工作经历、成就',
    icon: Briefcase,
    image: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    prompt: '回顾职业生涯，哪个时刻最让你骄傲？'
  },
  {
    id: 'family',
    title: '家庭港湾',
    subtitle: '关于家庭生活、亲情支持',
    icon: Mountain,
    image: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    prompt: '家，对你来说意味着什么？'
  },
  {
    id: 'reflection',
    title: '流金岁月',
    subtitle: '关于人生感悟、经验智慧',
    icon: Sparkles,
    image: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    prompt: '如果用一句话总结人生，你会说什么？'
  },
]

export default function ChapterSelection() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="font-display text-5xl font-bold mb-4">
            选择您的人生篇章
          </h1>
          <p className="font-body text-xl text-text-secondary">
            每个篇章都是您独特生命的重要组成部分
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {chapters.map((chapter) => (
            <ChapterCard
              key={chapter.id}
              chapter={chapter}
              onClick={() => navigate(`/interview/${chapter.id}`)}
            />
          ))}
        </div>

        <div className="mt-16 text-center">
          <button
            onClick={() => navigate('/style')}
            className="btn-secondary"
          >
            跳过访谈，直接查看传记
          </button>
        </div>
      </div>
    </div>
  )
}

function ChapterCard({ chapter, onClick }: { chapter: typeof chapters[0]; onClick: () => void }) {
  const Icon = chapter.icon

  return (
    <button
      onClick={onClick}
      className="card card-hover group overflow-hidden text-left transition-all duration-300"
    >
      <div 
        className="h-48 relative flex items-center justify-center"
        style={{ background: chapter.image }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <Icon className="w-16 h-16 text-white relative z-10" />
      </div>
      <div className="p-6">
        <h3 className="font-display text-2xl font-semibold mb-2 group-hover:text-accent-primary transition-colors">
          {chapter.title}
        </h3>
        <p className="font-body text-text-secondary mb-4">
          {chapter.subtitle}
        </p>
        <p className="font-body text-sm text-text-tertiary italic">
          "{chapter.prompt}"
        </p>
      </div>
    </button>
  )
}
