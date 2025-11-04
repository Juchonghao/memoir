import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ChapterSelection from './pages/ChapterSelection'
import InterviewPage from './pages/InterviewPage'
import StyleSelection from './pages/StyleSelection'
import BiographyView from './pages/BiographyView'
import AuthPage from './pages/AuthPage'

function App() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/chapters" element={<ChapterSelection />} />
        <Route path="/interview/:chapter" element={<InterviewPage />} />
        <Route path="/style" element={<StyleSelection />} />
        <Route path="/biography/:id" element={<BiographyView />} />
      </Routes>
    </div>
  )
}

export default App
