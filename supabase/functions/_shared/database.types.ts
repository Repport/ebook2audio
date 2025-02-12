
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
          processed_chunks: number | null
          total_chunks: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          storage_path?: string | null
          expires_at?: string
          status?: string
          processed_chunks?: number | null
          total_chunks?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          storage_path?: string | null
          expires_at?: string
          status?: string
          processed_chunks?: number | null
          total_chunks?: number | null
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
