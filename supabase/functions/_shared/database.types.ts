
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
          is_cached: boolean | null
          cache_created_at: string | null
          text_hash: string
          file_name: string | null
          file_size: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          storage_path?: string | null
          expires_at?: string
          status?: string
          processed_chunks?: number | null
          total_chunks?: number | null
          is_cached?: boolean | null
          cache_created_at?: string | null
          text_hash: string
          file_name?: string | null
          file_size?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          storage_path?: string | null
          expires_at?: string
          status?: string
          processed_chunks?: number | null
          total_chunks?: number | null
          is_cached?: boolean | null
          cache_created_at?: string | null
          text_hash?: string
          file_name?: string | null
          file_size?: number | null
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
      system_logs: {
        Row: {
          id: string
          event_type: string
          entity_id: string | null
          user_id: string | null
          details: Json | null
          status: string | null
          created_at: string | null
          ip_address: string | null
        }
        Insert: {
          id?: string
          event_type: string
          entity_id?: string | null
          user_id?: string | null
          details?: Json | null
          status?: string | null
          created_at?: string | null
          ip_address?: string | null
        }
        Update: {
          id?: string
          event_type?: string
          entity_id?: string | null
          user_id?: string | null
          details?: Json | null
          status?: string | null
          created_at?: string | null
          ip_address?: string | null
        }
      }
    }
  }
}
