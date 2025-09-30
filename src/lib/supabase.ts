import { createClient } from '@supabase/supabase-js'

// Use dummy values during build time, real values at runtime
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          chips: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          chips?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          chips?: number
          updated_at?: string
        }
      }
      game_history: {
        Row: {
          id: string
          user_id: string
          bet_amount: number
          player_hand: string
          dealer_hand: string
          player_score: number
          dealer_score: number
          result: 'win' | 'lose' | 'push'
          chips_change: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          bet_amount: number
          player_hand: string
          dealer_hand: string
          player_score: number
          dealer_score: number
          result: 'win' | 'lose' | 'push'
          chips_change: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          bet_amount?: number
          player_hand?: string
          dealer_hand?: string
          player_score?: number
          dealer_score?: number
          result?: 'win' | 'lose' | 'push'
          chips_change?: number
        }
      }
    }
  }
}
