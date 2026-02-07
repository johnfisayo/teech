'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { signIn, signUp } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (isLogin) {
      const { error } = await signIn(email, password)
      if (error) {
        setError(error.message)
      } else {
        router.push('/dashboard')
      }
    } else {
      const { error } = await signUp(email, password, fullName)
      if (error) {
        setError(error.message)
      } else {
        setError('Check your email to confirm your account!')
      }
    }
    
    setLoading(false)
  }

  const handleGoogleSignIn = async () => {
    const supabase = getSupabase()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    })
    if (error) {
      setError(error.message)
    }
  }

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
  }

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    color: 'rgba(167, 243, 208, 0.7)',
    marginBottom: '8px',
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      background: 'linear-gradient(135deg, #021a13 0%, #0a0f0d 50%, #031510 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'fixed',
        top: '-50%',
        right: '-20%',
        width: '800px',
        height: '800px',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed',
        bottom: '-30%',
        left: '-10%',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(5, 150, 105, 0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '32px',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
          }}>
            <span style={{ fontSize: '24px' }}>📚</span>
          </div>
          <h1 style={{
            fontSize: '36px',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #10b981 0%, #a7f3d0 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: 'Space Grotesk, sans-serif',
            margin: 0,
          }}>Teech</h1>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '20px',
          padding: '32px',
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 600,
            textAlign: 'center',
            marginBottom: '8px',
            color: '#f0fdf4',
            fontFamily: 'Space Grotesk, sans-serif',
            marginTop: 0,
          }}>
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h2>
          <p style={{
            color: 'rgba(167, 243, 208, 0.6)',
            textAlign: 'center',
            marginBottom: '24px',
            fontSize: '15px',
          }}>
            {isLogin ? 'Sign in to continue learning' : 'Start your learning journey'}
          </p>

          <button
            onClick={handleGoogleSignIn}
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: 'white',
              color: '#374151',
              fontWeight: 500,
              borderRadius: '12px',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              cursor: 'pointer',
              marginBottom: '24px',
              fontSize: '15px',
            }}
          >
            <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div style={{ position: 'relative', marginBottom: '24px' }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
            }}>
              <div style={{ width: '100%', borderTop: '1px solid rgba(16, 185, 129, 0.2)' }}></div>
            </div>
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
              <span style={{
                padding: '0 16px',
                backgroundColor: '#0d1512',
                color: 'rgba(167, 243, 208, 0.5)',
                fontSize: '14px',
              }}>or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={inputStyle}
                  placeholder="John Doe"
                  required={!isLogin}
                />
              </div>
            )}
            
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                placeholder="you@example.com"
                required
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <p style={{
                fontSize: '14px',
                marginBottom: '16px',
                color: error.includes('Check your email') ? '#10b981' : '#f87171',
              }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#022c22',
                fontWeight: 600,
                borderRadius: '12px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
                fontSize: '15px',
              }}
            >
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              style={{
                background: 'none',
                border: 'none',
                color: '#10b981',
                cursor: 'pointer',
                fontSize: '15px',
              }}
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}