export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          updated_at: string | null
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          agency_role: string | null
          agency_location: string | null
          language: string
        }
        Insert: {
          id: string
          updated_at?: string | null
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          agency_role?: string | null
          agency_location?: string | null
          language?: string
        }
        Update: {
          id?: string
          updated_at?: string | null
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          agency_role?: string | null
          agency_location?: string | null
          language?: string
        }
      }
    }
  }
}
