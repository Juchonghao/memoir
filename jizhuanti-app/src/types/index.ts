// 类型定义

export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  created_at: string
}

export interface InterviewSession {
  id: string
  user_id: string
  chapter: 'childhood' | 'youth' | 'career' | 'family' | 'reflection'
  status: 'in_progress' | 'completed' | 'paused'
  started_at: string
  ended_at?: string
  total_rounds: number
}

export interface InterviewResponse {
  id: string
  session_id: string
  round_number: number
  question: string
  answer?: string
  emotion_tag?: string
  created_at: string
}

export interface Biography {
  id: string
  user_id: string
  title: string
  content?: string
  writing_style?: 'moyan' | 'liucixin' | 'yiqiuyu'
  status: 'draft' | 'published'
  version: number
  created_at: string
  updated_at: string
}

export interface MediaFile {
  id: string
  user_id: string
  file_type: 'image' | 'audio'
  file_url: string
  related_entity_type?: string
  related_entity_id?: string
  decade?: string
  created_at: string
}
