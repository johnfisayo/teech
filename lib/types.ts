export interface Profile {
    id: string
    email: string
    full_name: string
    created_at: string
  }
  
  export interface Course {
    id: string
    user_id: string
    name: string
    code: string
    color: string
    created_at: string
    topics?: Topic[]
  }
  
  export interface Topic {
    id: string
    course_id: string
    name: string
    created_at: string
    notes?: Note[]
  }
  
  export interface Note {
    id: string
    topic_id: string
    title: string
    content: string
    file_url?: string
    created_at: string
  }
  
  export interface Conversation {
    id: string
    user_id: string
    course_id?: string
    mode: 'bounded' | 'expanded'
    created_at: string
  }
  
  export interface Message {
    id: string
    conversation_id: string
    role: 'user' | 'assistant'
    content: string
    image_url?: string
    bookmarked: boolean
    created_at: string
  }
  
  export interface Bookmark {
    id: string
    user_id: string
    message_id: string
    title: string
    created_at: string
    message?: Message
  }