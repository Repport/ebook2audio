
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
      text_conversions: {
        Row: {
          id: string
          created_at: string
          storage_path: string | null
          expires_at: string
          status: string
        }
        Insert: {
          id?: string
          created_at?: string
          storage_path?: string | null
          expires_at?: string
          status?: string
        }
        Update: {
          id?: string
          created_at?: string
          storage_path?: string | null
          expires_at?: string
          status?: string
        }
      }
      conversion_chunks: {
        Row: {
          id: string
          conversion_id: string
          content: string
          status: string
        }
        Insert: {
          id?: string
          conversion_id: string
          content: string
          status?: string
        }
        Update: {
          id?: string
          conversion_id?: string
          content?: string
          status?: string
        }
      }
    }
  }
}
