// Types para Supabase Database
// Regenerar con: npx supabase gen types typescript --local

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type TripStatus = 'draft' | 'planning' | 'ready' | 'completed' | 'archived'
export type PhaseType = 'investigation' | 'budget' | 'documentation' | 'flights' | 'lodging' | 'transport' | 'itinerary' | 'packing'
export type PhaseStatus = 'pending' | 'in_progress' | 'completed' | 'skipped'
export type MessageRole = 'user' | 'assistant' | 'system'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string | null
          default_origin: string | null
          created_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          default_origin?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          default_origin?: string | null
          created_at?: string
        }
      }
      trips: {
        Row: {
          id: string
          user_id: string
          destination: string
          origin: string
          start_date: string | null
          end_date: string | null
          travelers: number
          status: TripStatus
          current_phase: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          destination: string
          origin: string
          start_date?: string | null
          end_date?: string | null
          travelers?: number
          status?: TripStatus
          current_phase?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          destination?: string
          origin?: string
          start_date?: string | null
          end_date?: string | null
          travelers?: number
          status?: TripStatus
          current_phase?: number
          created_at?: string
          updated_at?: string
        }
      }
      phases: {
        Row: {
          id: string
          trip_id: string
          type: PhaseType
          phase_number: number
          status: PhaseStatus
          data: Json
          notes: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          type: PhaseType
          phase_number: number
          status?: PhaseStatus
          data?: Json
          notes?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          type?: PhaseType
          phase_number?: number
          status?: PhaseStatus
          data?: Json
          notes?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          trip_id: string
          role: MessageRole
          content: string
          phase: string | null
          created_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          role: MessageRole
          content: string
          phase?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          role?: MessageRole
          content?: string
          phase?: string | null
          created_at?: string
        }
      }
      checklist_items: {
        Row: {
          id: string
          trip_id: string
          phase: string
          category: string | null
          text: string
          checked: boolean
          sort_order: number
          is_ai_suggested: boolean
          created_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          phase: string
          category?: string | null
          text: string
          checked?: boolean
          sort_order?: number
          is_ai_suggested?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          phase?: string
          category?: string | null
          text?: string
          checked?: boolean
          sort_order?: number
          is_ai_suggested?: boolean
          created_at?: string
        }
      }
    }
  }
}

// Helper types
export type Trip = Database['public']['Tables']['trips']['Row']
export type Phase = Database['public']['Tables']['phases']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type ChecklistItem = Database['public']['Tables']['checklist_items']['Row']
