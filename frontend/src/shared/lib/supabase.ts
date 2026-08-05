import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseAuth = Boolean(url && anonKey)

export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          detectSessionInUrl: true,
          persistSession: true,
          autoRefreshToken: true,
        },
      })
    : null

export function authRedirectUrl() {
  if (typeof window === 'undefined') return undefined
  return `${window.location.origin}/auth/callback`
}
