import { Link } from 'react-router-dom'
import { BookOpen, Sparkles, Heart } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center bg-gradient-to-b from-bg-surface to-bg-primary">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="font-display text-6xl md:text-7xl font-bold text-text-primary mb-6">
            纪传体
          </h1>
          <p className="font-body text-2xl md:text-3xl text-text-secondary mb-8">
            让每一段人生，都成为值得传承的故事
          </p>
          <p className="font-body text-xl text-text-tertiary mb-12 max-w-2xl mx-auto leading-relaxed">
            央视纪录片级的叙事能力 × 前沿AI技术<br/>
            为您打造有温度、有深度的数字生命遗产
          </p>
          <Link 
            to="/chapters"
            className="btn-primary inline-block"
          >
            开始记忆回溯
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-4xl font-semibold text-center mb-16">
            核心功能
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            <FeatureCard
              icon={<BookOpen className="w-12 h-12" />}
              title="记忆回溯访谈"
              description="AI记者温暖引导，从感官细节入手，让您的人生故事自然流淌"
            />
            <FeatureCard
              icon={<Sparkles className="w-12 h-12" />}
              title="文风模仿"
              description="莫言、刘慈欣、余秋雨等大师风格，让您的故事更具文学魅力"
            />
            <FeatureCard
              icon={<Heart className="w-12 h-12" />}
              title="记忆镜像"
              description="AI图生图技术，重现您不同年代的形象，唤醒珍贵记忆"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-bg-surface">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-4xl font-semibold mb-6">
            开启您的记忆之旅
          </h2>
          <p className="font-body text-xl text-text-secondary mb-8">
            每个人的一生都是一部独特的传记<br/>
            让我们帮您将它记录下来，永恒传承
          </p>
          <Link 
            to="/auth"
            className="btn-primary inline-block"
          >
            立即开始
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-bg-divider">
        <div className="max-w-6xl mx-auto text-center text-text-tertiary">
          <p className="font-ui text-sm">
            © 2025 纪传体AI应用 · 央视纪录片团队匠心打造
          </p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="card p-8 text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent-light mb-6 text-accent-primary">
        {icon}
      </div>
      <h3 className="font-display text-2xl font-semibold mb-4">{title}</h3>
      <p className="font-body text-lg text-text-secondary leading-relaxed">
        {description}
      </p>
    </div>
  )
}
