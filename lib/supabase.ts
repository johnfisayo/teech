import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gjuylouedkzneqjtagil.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqdXlsb3VlZGt6bmVxanRhZ2lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0Mzg0MDAsImV4cCI6MjA4MzAxNDQwMH0.pxR54TOHQJ2u4E8ISIAuSZuEwVAyYYRZ3TyTO5LK-kA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
