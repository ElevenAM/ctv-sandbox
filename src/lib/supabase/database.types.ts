/**
 * GENERATED — do not hand-edit.
 *
 * This file is THE contract between `supabase/migrations/` and the app. Every
 * migration regenerates it in the same commit, or the types drift from the
 * database and a bad `.select()` ships silently (PostgREST returns null data,
 * not an error, for a column that does not exist).
 *
 *   pnpm db:types
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      board_note: {
        Row: {
          author_id: string
          author_label: string
          body: string
          created_at: string
          id: string
          tone: string
          updated_at: string
        }
        Insert: {
          author_id?: string
          author_label: string
          body: string
          created_at?: string
          id?: string
          tone?: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          author_label?: string
          body?: string
          created_at?: string
          id?: string
          tone?: string
          updated_at?: string
        }
        Relationships: []
      }
      prototype_signal: {
        Row: {
          created_at: string
          id: number
          name: string
          payload: Json
          prototype_slug: string
        }
        Insert: {
          created_at?: string
          id?: never
          name: string
          payload?: Json
          prototype_slug: string
        }
        Update: {
          created_at?: string
          id?: never
          name?: string
          payload?: Json
          prototype_slug?: string
        }
        Relationships: []
      }
      prototype_state: {
        Row: {
          created_at: string
          id: string
          key: string
          owner_id: string
          prototype_slug: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          owner_id?: string
          prototype_slug: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          owner_id?: string
          prototype_slug?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

type DefaultSchema = Database['public']

/** Row type for a public table, e.g. `Tables<'board_note'>`. */
export type Tables<T extends keyof DefaultSchema['Tables']> = DefaultSchema['Tables'][T]['Row']
/** Insert payload for a public table, e.g. `TablesInsert<'board_note'>`. */
export type TablesInsert<T extends keyof DefaultSchema['Tables']> = DefaultSchema['Tables'][T]['Insert']
/** Update payload for a public table, e.g. `TablesUpdate<'board_note'>`. */
export type TablesUpdate<T extends keyof DefaultSchema['Tables']> = DefaultSchema['Tables'][T]['Update']
