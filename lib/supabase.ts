import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseInstance: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gjuylouedkzneqjtagil.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqdXlsb3VlZGt6bmVxanRhZ2lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0Mzg0MDAsImV4cCI6MjA4MzAxNDQwMH0.pxR54TOHQJ2u4E8ISIAuSZuEwVAyYYRZ3TyTO5LK-kA'

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
  return supabaseInstance
}

// For backwards compatibility - but this will be called lazily
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return getSupabaseClient()[prop as keyof SupabaseClient]
  }
})