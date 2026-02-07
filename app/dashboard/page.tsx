'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

interface Course {
  id: string
  name: string
  code: string
  color: string
  topics?: Topic[]
}

interface Topic {
  id: string
  course_id: string
  name: string
  notes?: Note[]
}

interface Note {
  id: string
  topic_id: string
  title: string
  content: string
  created_at: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  image_url?: string
  bookmarked: boolean
}

// Simple Modal Component
function Modal({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) {
  if (!isOpen) return null
  
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '16px',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #0a0f0d 0%, #0d1512 100%)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        borderRadius: '20px',
        padding: '24px',
        width: '100%',
        maxWidth: '420px',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}>
          <h3 style={{ fontSize: '20px', fontWeight: 600, margin: 0, color: '#f0fdf4' }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '8px',
              padding: '8px 12px',
              color: '#a7f3d0',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // State
  const [activeTab, setActiveTab] = useState('courses')
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Modal state
  const [showAddCourse, setShowAddCourse] = useState(false)
  const [showAddTopic, setShowAddTopic] = useState(false)
  const [showAddNote, setShowAddNote] = useState(false)
  const [selectedTopicForNote, setSelectedTopicForNote] = useState<string | null>(null)
  
  // Form state
  const [newCourseName, setNewCourseName] = useState('')
  const [newCourseCode, setNewCourseCode] = useState('')
  const [newTopicName, setNewTopicName] = useState('')
  const [newNoteTitle, setNewNoteTitle] = useState('')
  const [newNoteContent, setNewNoteContent] = useState('')
  
  // Chat state
  const [mode, setMode] = useState<'bounded' | 'expanded'>('bounded')
  const [chatInput, setChatInput] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hey! I'm Teech 👋 Upload a photo of your assignment or ask me to explain something from your notes. I'll help you understand it better!",
      bookmarked: false,
    }
  ])

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth')
    }
  }, [user, authLoading, router])

  // Fetch courses
  useEffect(() => {
    if (user) {
      fetchCourses()
    }
  }, [user])

  const fetchCourses = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        topics (
          *,
          notes (*)
        )
      `)
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setCourses(data)
    }
    setLoading(false)
  }

  const addCourse = async () => {
    if (!newCourseName || !newCourseCode) return
    
    const { error } = await supabase
      .from('courses')
      .insert({ user_id: user?.id, name: newCourseName, code: newCourseCode })

    if (!error) {
      fetchCourses()
      setNewCourseName('')
      setNewCourseCode('')
      setShowAddCourse(false)
    }
  }

  const addTopic = async () => {
    if (!newTopicName || !selectedCourse) return
    
    const { error } = await supabase
      .from('topics')
      .insert({ course_id: selectedCourse.id, name: newTopicName })

    if (!error) {
      fetchCourses()
      setNewTopicName('')
      setShowAddTopic(false)
    }
  }

  const addNote = async () => {
    if (!newNoteTitle || !selectedTopicForNote) return
    
    const { error } = await supabase
      .from('notes')
      .insert({ topic_id: selectedTopicForNote, title: newNoteTitle, content: newNoteContent })

    if (!error) {
      fetchCourses()
      setNewNoteTitle('')
      setNewNoteContent('')
      setSelectedTopicForNote(null)
      setShowAddNote(false)
    }
  }

  const toggleTopic = (topicId: string) => {
    setExpandedTopics(prev => ({ ...prev, [topicId]: !prev[topicId] }))
  }

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Remove selected image
  const removeSelectedImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Upload image to Supabase Storage
  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${user?.id}/${Date.now()}.${fileExt}`
    
    const { error } = await supabase.storage
      .from('uploads')
      .upload(fileName, file)

    if (error) {
      console.error('Upload error:', error)
      return null
    }

    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(fileName)

    return publicUrl
  }

  const handleSendMessage = async () => {
    if (!chatInput.trim() && !selectedImage) return

    setUploading(true)
    let imageUrl: string | undefined

    // Upload image if selected
    if (selectedImage) {
      const uploadedUrl = await uploadImage(selectedImage)
      if (uploadedUrl) {
        imageUrl = uploadedUrl
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput || 'Please help me with this image',
      image_url: imageUrl,
      bookmarked: false,
    }

    setMessages(prev => [...prev, userMessage])
    const currentInput = chatInput
    setChatInput('')
    removeSelectedImage()

    // Add loading message
    const loadingId = (Date.now() + 1).toString()
    setMessages(prev => [...prev, {
      id: loadingId,
      role: 'assistant',
      content: 'Thinking...',
      bookmarked: false,
    }])

    setUploading(false)

    try {
      // Gather notes from selected course
      let notesContent = ''
      if (selectedCourse?.topics) {
        selectedCourse.topics.forEach(topic => {
          topic.notes?.forEach(note => {
            notesContent += `\n## ${note.title}\n${note.content}\n`
          })
        })
      }

      const response = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentInput || 'Please analyze this image and help me understand it',
          mode: mode,
          notes: notesContent,
          courseName: selectedCourse?.name || 'General',
          imageUrl: imageUrl,
        }),
      })

      const data = await response.json()

      // Replace loading message with actual response
      setMessages(prev => prev.map(m => 
        m.id === loadingId 
          ? { ...m, content: data.reply || 'Sorry, something went wrong.' }
          : m
      ))
    } catch (error) {
      console.error('Error:', error)
      setMessages(prev => prev.map(m => 
        m.id === loadingId 
          ? { ...m, content: 'Sorry, I could not connect to the AI. Please try again.' }
          : m
      ))
    }
  }

  const toggleBookmark = (messageId: string) => {
    setMessages(prev =>
      prev.map(m => (m.id === messageId ? { ...m, bookmarked: !m.bookmarked } : m))
    )
  }

  // Styles
  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    borderRadius: '12px',
    color: '#f0fdf4',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box' as const,
    marginBottom: '12px',
  }

  const buttonPrimary = {
    width: '100%',
    padding: '12px',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: '#022c22',
    fontWeight: 600,
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '15px',
  }

  const buttonSecondary = {
    width: '100%',
    padding: '12px',
    background: 'transparent',
    color: '#a7f3d0',
    fontWeight: 500,
    borderRadius: '12px',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    cursor: 'pointer',
    fontSize: '15px',
    marginTop: '8px',
  }

  if (authLoading || !user) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #021a13 0%, #0a0f0d 50%, #031510 100%)',
        color: '#10b981',
      }}>
        Loading...
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #021a13 0%, #0a0f0d 50%, #031510 100%)',
      color: '#f0fdf4',
    }}>
      {/* Background effects */}
      <div style={{
        position: 'fixed',
        top: '-50%',
        right: '-20%',
        width: '800px',
        height: '800px',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(16, 185, 129, 0.1)',
        padding: '12px 16px',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{ fontSize: '18px' }}>📚</span>
            </div>
            <h1 style={{
              fontSize: '22px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #10b981 0%, #a7f3d0 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0,
            }}>Teech</h1>
          </div>

          {/* Desktop Navigation */}
          <nav style={{ 
            display: 'flex', 
            gap: '6px',
          }}>
            {[
              { id: 'courses', label: '📖', fullLabel: 'Courses' },
              { id: 'solve', label: '💬', fullLabel: 'Solve' },
              { id: 'saved', label: '🔖', fullLabel: 'Saved' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: activeTab === tab.id ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent',
                  background: activeTab === tab.id ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                  color: activeTab === tab.id ? '#a7f3d0' : 'rgba(167, 243, 208, 0.5)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{tab.label}</span>
                <span className="desktop-only" style={{ display: 'none' }}>{tab.fullLabel}</span>
              </button>
            ))}
          </nav>

          <button
            onClick={() => signOut()}
            style={{
              padding: '8px 14px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '10px',
              color: '#a7f3d0',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ 
        padding: '20px 16px', 
        maxWidth: '1200px', 
        margin: '0 auto',
        minHeight: 'calc(100vh - 70px)',
      }}>
        
        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              marginBottom: '24px',
            }}>
              <div>
                <h2 style={{ fontSize: '26px', fontWeight: 600, margin: 0 }}>Your Courses</h2>
                <p style={{ color: 'rgba(167, 243, 208, 0.6)', marginTop: '6px', fontSize: '14px' }}>
                  Click a course to expand topics and notes
                </p>
              </div>
              <button
                onClick={() => setShowAddCourse(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#022c22',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '14px',
                  width: '100%',
                  maxWidth: '200px',
                }}
              >
                + Add Course
              </button>
            </div>

            {loading ? (
              <p style={{ color: 'rgba(167, 243, 208, 0.5)', textAlign: 'center', padding: '40px' }}>
                Loading courses...
              </p>
            ) : courses.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1px dashed rgba(16, 185, 129, 0.2)',
                borderRadius: '16px',
              }}>
                <p style={{ color: 'rgba(167, 243, 208, 0.6)', fontSize: '16px' }}>
                  No courses yet. Add your first course to get started!
                </p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '16px',
              }}>
                {courses.map(course => (
                  <div
                    key={course.id}
                    onClick={() => setSelectedCourse(selectedCourse?.id === course.id ? null : course)}
                    style={{
                      background: selectedCourse?.id === course.id
                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)'
                        : 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.04) 100%)',
                      border: selectedCourse?.id === course.id
                        ? '1px solid rgba(16, 185, 129, 0.4)'
                        : '1px solid rgba(16, 185, 129, 0.15)',
                      borderRadius: '14px',
                      padding: '16px',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: '4px',
                      background: course.color || '#10b981',
                    }} />
                    
                    <div style={{ marginLeft: '10px' }}>
                      <span style={{
                        fontSize: '11px',
                        color: 'rgba(167, 243, 208, 0.6)',
                        fontFamily: 'monospace',
                      }}>{course.code}</span>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        marginTop: '4px',
                        marginBottom: '10px',
                      }}>{course.name}</h3>
                      
                      <span style={{
                        background: 'rgba(16, 185, 129, 0.2)',
                        color: '#a7f3d0',
                        padding: '4px 10px',
                        borderRadius: '16px',
                        fontSize: '11px',
                      }}>
                        {course.topics?.reduce((acc, t) => acc + (t.notes?.length || 0), 0) || 0} notes
                      </span>

                      {/* Expanded Topics */}
                      {selectedCourse?.id === course.id && (
                        <div style={{ marginTop: '14px' }} onClick={e => e.stopPropagation()}>
                          {course.topics?.map(topic => (
                            <div key={topic.id} style={{ marginBottom: '8px' }}>
                              <div
                                onClick={() => toggleTopic(topic.id)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '10px 12px',
                                  background: 'rgba(0, 0, 0, 0.2)',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                }}
                              >
                                <span style={{ fontSize: '13px' }}>
                                  {expandedTopics[topic.id] ? '▼' : '▶'} {topic.name}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontSize: '11px', color: 'rgba(167, 243, 208, 0.5)' }}>
                                    {topic.notes?.length || 0}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedTopicForNote(topic.id)
                                      setShowAddNote(true)
                                    }}
                                    style={{
                                      background: 'rgba(16, 185, 129, 0.2)',
                                      border: 'none',
                                      borderRadius: '4px',
                                      padding: '4px 8px',
                                      color: '#a7f3d0',
                                      cursor: 'pointer',
                                      fontSize: '11px',
                                    }}
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                              
                              {expandedTopics[topic.id] && topic.notes?.map(note => (
                                <div
                                  key={note.id}
                                  onClick={() => setSelectedNote(note)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '10px 12px',
                                    marginLeft: '16px',
                                    marginTop: '4px',
                                    background: 'rgba(16, 185, 129, 0.05)',
                                    border: '1px solid rgba(16, 185, 129, 0.1)',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <span style={{ fontSize: '12px' }}>📄</span>
                                  <span style={{ fontSize: '13px', flex: 1 }}>{note.title}</span>
                                </div>
                              ))}
                            </div>
                          ))}
                          
                          <button
                            onClick={() => setShowAddTopic(true)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '10px 12px',
                              width: '100%',
                              background: 'transparent',
                              border: '1px dashed rgba(16, 185, 129, 0.3)',
                              borderRadius: '8px',
                              color: '#10b981',
                              cursor: 'pointer',
                              fontSize: '13px',
                              marginTop: '8px',
                            }}
                          >
                            + Add Topic
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Solve Tab */}
        {activeTab === 'solve' && (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: 'calc(100vh - 140px)',
          }}>
            {/* Mode Toggle */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              marginBottom: '12px',
            }}>
              <div style={{
                display: 'flex',
                background: 'rgba(16, 185, 129, 0.1)',
                borderRadius: '12px',
                padding: '4px',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                width: '100%',
                maxWidth: '320px',
              }}>
                {[
                  { id: 'bounded', label: '📚 Bounded', desc: 'Notes only' },
                  { id: 'expanded', label: '🌐 Expanded', desc: 'Notes + AI' },
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id as 'bounded' | 'expanded')}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: 'none',
                      background: mode === m.id
                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                        : 'transparent',
                      color: mode === m.id ? '#022c22' : 'rgba(167, 243, 208, 0.6)',
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{m.label}</div>
                    <div style={{ fontSize: '10px', opacity: 0.8 }}>{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Course Selector */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              marginBottom: '12px',
            }}>
              <select
                value={selectedCourse?.id || ''}
                onChange={(e) => {
                  const course = courses.find(c => c.id === e.target.value)
                  setSelectedCourse(course || null)
                }}
                style={{
                  padding: '10px 16px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '10px',
                  color: '#a7f3d0',
                  fontSize: '13px',
                  cursor: 'pointer',
                  outline: 'none',
                  width: '100%',
                  maxWidth: '320px',
                }}
              >
                <option value="">Select a course</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                ))}
              </select>
            </div>

            {/* Messages */}
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              padding: '10px 0',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              {messages.map(msg => (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div style={{
                    maxWidth: '85%',
                    padding: '12px 16px',
                    borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                      : 'rgba(16, 185, 129, 0.1)',
                    border: msg.role === 'user' ? 'none' : '1px solid rgba(16, 185, 129, 0.2)',
                    position: 'relative',
                  }}>
                    {/* Image preview in message */}
                    {msg.image_url && (
                      <div style={{ marginBottom: '10px' }}>
                        <img 
                          src={msg.image_url} 
                          alt="Uploaded" 
                          style={{
                            maxWidth: '100%',
                            maxHeight: '200px',
                            borderRadius: '8px',
                            objectFit: 'contain',
                          }}
                        />
                      </div>
                    )}
                    <p style={{
                      margin: 0,
                      fontSize: '14px',
                      lineHeight: 1.6,
                      color: msg.role === 'user' ? '#022c22' : '#f0fdf4',
                      whiteSpace: 'pre-wrap',
                    }}>{msg.content}</p>
                    
                    {msg.role === 'assistant' && msg.id !== 'welcome' && (
                      <button
                        onClick={() => toggleBookmark(msg.id)}
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: msg.bookmarked ? '#10b981' : 'rgba(167, 243, 208, 0.4)',
                          fontSize: '14px',
                          padding: '4px',
                        }}
                      >
                        {msg.bookmarked ? '🔖' : '○'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div style={{
                padding: '10px',
                background: 'rgba(16, 185, 129, 0.1)',
                borderRadius: '12px',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  style={{
                    width: '60px',
                    height: '60px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                  }}
                />
                <span style={{ flex: 1, fontSize: '13px', color: '#a7f3d0' }}>
                  Image ready to send
                </span>
                <button
                  onClick={removeSelectedImage}
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#fca5a5',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Remove
                </button>
              </div>
            )}

            {/* Input */}
            <div style={{
              background: 'rgba(16, 185, 129, 0.05)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '16px',
              padding: '12px',
            }}>
              <div style={{ 
                display: 'flex', 
                gap: '8px', 
                alignItems: 'flex-end',
              }}>
                {/* Hidden file input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                
                {/* Image upload button */}
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  style={{
                    padding: '10px',
                    background: imagePreview ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: '10px',
                    color: '#a7f3d0',
                    cursor: 'pointer',
                    fontSize: '16px',
                    flexShrink: 0,
                  }}
                >
                  📷
                </button>
                
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="Ask a question or describe your problem..."
                  style={{
                    flex: 1,
                    padding: '12px 14px',
                    background: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(16, 185, 129, 0.15)',
                    borderRadius: '10px',
                    color: '#f0fdf4',
                    fontSize: '14px',
                    outline: 'none',
                    minWidth: 0,
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={(!chatInput.trim() && !selectedImage) || uploading}
                  style={{
                    padding: '12px 16px',
                    background: (chatInput.trim() || selectedImage) && !uploading
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                      : 'rgba(16, 185, 129, 0.2)',
                    border: 'none',
                    borderRadius: '10px',
                    color: (chatInput.trim() || selectedImage) && !uploading ? '#022c22' : 'rgba(167, 243, 208, 0.4)',
                    cursor: (chatInput.trim() || selectedImage) && !uploading ? 'pointer' : 'not-allowed',
                    fontWeight: 600,
                    fontSize: '14px',
                    flexShrink: 0,
                  }}
                >
                  {uploading ? '...' : '➤'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Saved Tab */}
        {activeTab === 'saved' && (
          <div>
            <h2 style={{ fontSize: '26px', fontWeight: 600, marginBottom: '20px' }}>Saved Items</h2>
            
            {messages.filter(m => m.bookmarked).length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1px dashed rgba(16, 185, 129, 0.2)',
                borderRadius: '16px',
              }}>
                <p style={{ color: 'rgba(167, 243, 208, 0.6)', fontSize: '15px' }}>
                  No saved items yet. Bookmark explanations to save them here!
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {messages.filter(m => m.bookmarked).map(bookmark => (
                  <div
                    key={bookmark.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '16px',
                      background: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.15)',
                      borderRadius: '12px',
                    }}
                  >
                    <div style={{
                      width: '36px',
                      height: '36px',
                      background: 'rgba(16, 185, 129, 0.2)',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      flexShrink: 0,
                    }}>
                      📄
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ 
                        margin: 0, 
                        fontSize: '14px', 
                        color: '#f0fdf4',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                      }}>
                        {bookmark.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Note Sidebar */}
      {selectedNote && (
        <div style={{
          position: 'fixed',
          right: 0,
          top: 0,
          bottom: 0,
          width: '100%',
          maxWidth: '400px',
          background: 'linear-gradient(180deg, #0a0f0d 0%, #0d1512 100%)',
          borderLeft: '1px solid rgba(16, 185, 129, 0.2)',
          padding: '20px',
          zIndex: 100,
          overflowY: 'auto',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '20px',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>{selectedNote.title}</h3>
              <span style={{ fontSize: '12px', color: 'rgba(167, 243, 208, 0.5)' }}>
                {new Date(selectedNote.created_at).toLocaleDateString()}
              </span>
            </div>
            <button
              onClick={() => setSelectedNote(null)}
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: '#a7f3d0',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>
          <div style={{
            background: 'rgba(16, 185, 129, 0.05)',
            border: '1px solid rgba(16, 185, 129, 0.15)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px',
          }}>
            <p style={{
              fontSize: '14px',
              lineHeight: 1.7,
              color: 'rgba(240, 253, 244, 0.85)',
              margin: 0,
              whiteSpace: 'pre-wrap',
            }}>
              {selectedNote.content || 'No content yet.'}
            </p>
          </div>
          <button
            onClick={() => {
              setChatInput(`Please explain this to me: "${selectedNote.title}" - ${selectedNote.content}`)
              setActiveTab('solve')
              setSelectedNote(null)
            }}
            style={{
              width: '100%',
              padding: '12px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '10px',
              color: '#022c22',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            ✨ Explain this to me
          </button>
        </div>
      )}

      {/* Add Course Modal */}
      <Modal isOpen={showAddCourse} onClose={() => setShowAddCourse(false)} title="Add New Course">
        <input
          type="text"
          value={newCourseName}
          onChange={(e) => setNewCourseName(e.target.value)}
          style={inputStyle}
          placeholder="Course Name (e.g. Calculus II)"
        />
        <input
          type="text"
          value={newCourseCode}
          onChange={(e) => setNewCourseCode(e.target.value)}
          style={inputStyle}
          placeholder="Course Code (e.g. MATH 201)"
        />
        <button onClick={addCourse} style={buttonPrimary}>Add Course</button>
        <button onClick={() => setShowAddCourse(false)} style={buttonSecondary}>Cancel</button>
      </Modal>

      {/* Add Topic Modal */}
      <Modal isOpen={showAddTopic} onClose={() => setShowAddTopic(false)} title="Add New Topic">
        <p style={{ color: 'rgba(167, 243, 208, 0.6)', marginBottom: '16px', fontSize: '14px' }}>
          Adding to {selectedCourse?.name}
        </p>
        <input
          type="text"
          value={newTopicName}
          onChange={(e) => setNewTopicName(e.target.value)}
          style={inputStyle}
          placeholder="Topic Name (e.g. Integration Techniques)"
        />
        <button onClick={addTopic} style={buttonPrimary}>Add Topic</button>
        <button onClick={() => setShowAddTopic(false)} style={buttonSecondary}>Cancel</button>
      </Modal>

      {/* Add Note Modal */}
      <Modal isOpen={showAddNote} onClose={() => { setShowAddNote(false); setSelectedTopicForNote(null); }} title="Add New Note">
        <input
          type="text"
          value={newNoteTitle}
          onChange={(e) => setNewNoteTitle(e.target.value)}
          style={inputStyle}
          placeholder="Note Title"
        />
        <textarea
          value={newNoteContent}
          onChange={(e) => setNewNoteContent(e.target.value)}
          style={{
            ...inputStyle,
            minHeight: '120px',
            resize: 'vertical',
          }}
          placeholder="Note content..."
        />
        <button onClick={addNote} style={buttonPrimary}>Add Note</button>
        <button onClick={() => { setShowAddNote(false); setSelectedTopicForNote(null); }} style={buttonSecondary}>Cancel</button>
      </Modal>
    </div>
  )
}