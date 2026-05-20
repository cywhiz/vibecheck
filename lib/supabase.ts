import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// ── Types ──────────────────────────────────────────────────────────────────────
export type Attendee = {
  id: string
  name: string
  role: string | null
  mandate: string
  telegram_username: string | null
  wallet_address?: string | null
  attestation_id?: string | null
  match_cache: Record<string, unknown>

  created_at: string
}

export type AttendeeMatch = Pick<
  Attendee,
  'id' | 'name' | 'role' | 'mandate' | 'telegram_username' | 'wallet_address' | 'attestation_id'
> & {
  similarity: number
  explanation?: string
}

export type Connection = {
  id: string
  from_id: string
  to_id: string
  match_score: number
  attestation_id: string | null
  tx_hash: string | null
  event_name: string
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      attendees: {
        Row: Attendee
        Insert: Omit<Attendee, 'id' | 'created_at' | 'match_cache'>
        Update: Partial<Omit<Attendee, 'id' | 'created_at'>>
        Relationships: []
      }
      connections: {
        Row: Connection
        Insert: Omit<Connection, 'id' | 'created_at'>
        Update: Partial<Omit<Connection, 'id' | 'created_at'>>
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      count_connections: {
        Args: { event?: string }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// ── Browser client (anon key — safe to expose) ─────────────────────────────────
let browserClient: ReturnType<typeof createSupabaseClient<Database>> | null = null

export function createClient() {
  if (!browserClient) {
    browserClient = createSupabaseClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return browserClient
}

// ── Server / API client (service role — NEVER import in client components) ─────
export function createServerClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
