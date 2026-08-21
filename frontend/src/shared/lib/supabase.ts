import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** Local dev: set VITE_DEV_LOCAL_AUTH=true to use backend JWT instead of Supabase login. */
const devLocalAuth = import.meta.env.VITE_DEV_LOCAL_AUTH === 'true'

export const isSupabaseAuth = Boolean(url && anonKey) && !devLocalAuth

export const supabase: SupabaseClient | null =
  url && anonKey && !devLocalAuth
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
