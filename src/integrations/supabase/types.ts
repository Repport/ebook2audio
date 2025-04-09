export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      chapters: {
        Row: {
          conversion_id: string
          created_at: string
          id: string
          start_index: number
          timestamp: number | null
          title: string
        }
        Insert: {
          conversion_id: string
          created_at?: string
          id?: string
          start_index: number
          timestamp?: number | null
          title: string
        }
        Update: {
          conversion_id?: string
          created_at?: string
          id?: string
          start_index?: number
          timestamp?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapters_conversion_id_fkey"
            columns: ["conversion_id"]
            isOneToOne: false
            referencedRelation: "text_conversions"
            referencedColumns: ["id"]
          },
        ]
      }
      conversion_chunks: {
        Row: {
          audio_path: string | null
          character_count: number | null
          chunk_index: number
          content: string
          conversion_id: string
          created_at: string
          error_message: string | null
          id: string
          processed_at: string | null
          retries: number | null
          status: string
          updated_at: string
        }
        Insert: {
          audio_path?: string | null
          character_count?: number | null
          chunk_index: number
          content: string
          conversion_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          processed_at?: string | null
          retries?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          audio_path?: string | null
          character_count?: number | null
          chunk_index?: number
          content?: string
          conversion_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          processed_at?: string | null
          retries?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversion_chunks_conversion_id_fkey"
            columns: ["conversion_id"]
            isOneToOne: false
            referencedRelation: "text_conversions"
            referencedColumns: ["id"]
          },
        ]
      }
      conversion_logs: {
        Row: {
          conversion_timestamp: string | null
          file_name: string | null
          file_size: number | null
          id: string
          ip_address: string
          output_duration: number | null
          successful: boolean | null
          user_id: string | null
        }
        Insert: {
          conversion_timestamp?: string | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          ip_address: string
          output_duration?: number | null
          successful?: boolean | null
          user_id?: string | null
        }
        Update: {
          conversion_timestamp?: string | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          ip_address?: string
          output_duration?: number | null
          successful?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      conversion_notifications: {
        Row: {
          conversion_id: string
          created_at: string
          email: string
          id: string
          sent_at: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          conversion_id: string
          created_at?: string
          email: string
          id?: string
          sent_at?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          conversion_id?: string
          created_at?: string
          email?: string
          id?: string
          sent_at?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversion_notifications_conversion_id_fkey"
            columns: ["conversion_id"]
            isOneToOne: false
            referencedRelation: "text_conversions"
            referencedColumns: ["id"]
          },
        ]
      }
      conversion_progress: {
        Row: {
          conversion_id: string
          created_at: string
          current_chunk: string | null
          error_message: string | null
          processed_characters: number
          processed_chunks: number
          progress: number
          status: string
          total_characters: number
          total_chunks: number
          updated_at: string
          warning_message: string | null
        }
        Insert: {
          conversion_id: string
          created_at?: string
          current_chunk?: string | null
          error_message?: string | null
          processed_characters?: number
          processed_chunks?: number
          progress?: number
          status?: string
          total_characters?: number
          total_chunks?: number
          updated_at?: string
          warning_message?: string | null
        }
        Update: {
          conversion_id?: string
          created_at?: string
          current_chunk?: string | null
          error_message?: string | null
          processed_characters?: number
          processed_chunks?: number
          progress?: number
          status?: string
          total_characters?: number
          total_chunks?: number
          updated_at?: string
          warning_message?: string | null
        }
        Relationships: []
      }
      email_change_history: {
        Row: {
          changed_at: string | null
          id: string
          new_email: string
          old_email: string
          user_id: string
        }
        Insert: {
          changed_at?: string | null
          id?: string
          new_email: string
          old_email: string
          user_id: string
        }
        Update: {
          changed_at?: string | null
          id?: string
          new_email?: string
          old_email?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_email_preferences"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "email_preferences"
            referencedColumns: ["user_id"]
          },
        ]
      }
      email_preferences: {
        Row: {
          clear_email: string | null
          created_at: string | null
          id: string
          marketing_emails: boolean | null
          newsletter: boolean | null
          notification_emails: boolean | null
          user_id: string
        }
        Insert: {
          clear_email?: string | null
          created_at?: string | null
          id?: string
          marketing_emails?: boolean | null
          newsletter?: boolean | null
          notification_emails?: boolean | null
          user_id: string
        }
        Update: {
          clear_email?: string | null
          created_at?: string | null
          id?: string
          marketing_emails?: boolean | null
          newsletter?: boolean | null
          notification_emails?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      site_config: {
        Row: {
          created_at: string | null
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      storage_logs: {
        Row: {
          content_type: string | null
          conversion_id: string | null
          created_at: string | null
          error_message: string | null
          file_size: number | null
          id: string
          operation: string
          status: string
          storage_path: string | null
          user_id: string | null
        }
        Insert: {
          content_type?: string | null
          conversion_id?: string | null
          created_at?: string | null
          error_message?: string | null
          file_size?: number | null
          id?: string
          operation: string
          status: string
          storage_path?: string | null
          user_id?: string | null
        }
        Update: {
          content_type?: string | null
          conversion_id?: string | null
          created_at?: string | null
          error_message?: string | null
          file_size?: number | null
          id?: string
          operation?: string
          status?: string
          storage_path?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "storage_logs_conversion_id_fkey"
            columns: ["conversion_id"]
            isOneToOne: false
            referencedRelation: "text_conversions"
            referencedColumns: ["id"]
          },
        ]
      }
      system_logs: {
        Row: {
          created_at: string | null
          details: Json | null
          entity_id: string | null
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      terms_acceptance_logs: {
        Row: {
          accepted_at: string
          captcha_token: string | null
          cookies_acceptance_date: string | null
          cookies_all_accepted: boolean | null
          cookies_necessary_only: boolean | null
          file_name: string | null
          file_type: string | null
          id: string
          ip_address: string
          recaptcha_score: number | null
          retention_period_accepted: boolean | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          accepted_at?: string
          captcha_token?: string | null
          cookies_acceptance_date?: string | null
          cookies_all_accepted?: boolean | null
          cookies_necessary_only?: boolean | null
          file_name?: string | null
          file_type?: string | null
          id?: string
          ip_address: string
          recaptcha_score?: number | null
          retention_period_accepted?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          accepted_at?: string
          captcha_token?: string | null
          cookies_acceptance_date?: string | null
          cookies_all_accepted?: boolean | null
          cookies_necessary_only?: boolean | null
          file_name?: string | null
          file_type?: string | null
          id?: string
          ip_address?: string
          recaptcha_score?: number | null
          retention_period_accepted?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      text_cache: {
        Row: {
          audio_path: string | null
          created_at: string | null
          error_message: string | null
          expires_at: string
          id: string
          status: string | null
          text_hash: string
        }
        Insert: {
          audio_path?: string | null
          created_at?: string | null
          error_message?: string | null
          expires_at: string
          id?: string
          status?: string | null
          text_hash: string
        }
        Update: {
          audio_path?: string | null
          created_at?: string | null
          error_message?: string | null
          expires_at?: string
          id?: string
          status?: string | null
          text_hash?: string
        }
        Relationships: []
      }
      text_conversions: {
        Row: {
          cache_created_at: string | null
          created_at: string
          duration: number | null
          elapsed_time: number | null
          error_message: string | null
          expires_at: string
          file_name: string | null
          file_size: number | null
          id: string
          is_cached: boolean | null
          notify_on_complete: boolean | null
          processed_characters: number | null
          processed_chunks: number | null
          progress: number | null
          started_at: string | null
          status: string
          storage_path: string | null
          text_hash: string
          total_characters: number | null
          total_chunks: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          cache_created_at?: string | null
          created_at?: string
          duration?: number | null
          elapsed_time?: number | null
          error_message?: string | null
          expires_at?: string
          file_name?: string | null
          file_size?: number | null
          id?: string
          is_cached?: boolean | null
          notify_on_complete?: boolean | null
          processed_characters?: number | null
          processed_chunks?: number | null
          progress?: number | null
          started_at?: string | null
          status?: string
          storage_path?: string | null
          text_hash: string
          total_characters?: number | null
          total_chunks?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          cache_created_at?: string | null
          created_at?: string
          duration?: number | null
          elapsed_time?: number | null
          error_message?: string | null
          expires_at?: string
          file_name?: string | null
          file_size?: number | null
          id?: string
          is_cached?: boolean | null
          notify_on_complete?: boolean | null
          processed_characters?: number | null
          processed_chunks?: number | null
          progress?: number | null
          started_at?: string | null
          status?: string
          storage_path?: string | null
          text_hash?: string
          total_characters?: number | null
          total_chunks?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_consents: {
        Row: {
          accepted_at: string | null
          id: string
          ip_address: string | null
          marketing_accepted: boolean | null
          privacy_accepted: boolean | null
          terms_accepted: boolean | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          id?: string
          ip_address?: string | null
          marketing_accepted?: boolean | null
          privacy_accepted?: boolean | null
          terms_accepted?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          id?: string
          ip_address?: string | null
          marketing_accepted?: boolean | null
          privacy_accepted?: boolean | null
          terms_accepted?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      vw_system_logs_recent: {
        Row: {
          created_at: string | null
          details: Json | null
          entity_id: string | null
          event_type: string | null
          file_name: string | null
          id: string | null
          ip_address: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          event_type?: string | null
          file_name?: never
          id?: string | null
          ip_address?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          event_type?: string | null
          file_name?: never
          id?: string | null
          ip_address?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_chunk_progress: {
        Args: { p_conversion_id: string }
        Returns: {
          processed_characters: number
          total_characters: number
          progress: number
        }[]
      }
      check_conversion_rate_limit: {
        Args:
          | {
              p_ip_address: string
              max_conversions?: number
              window_hours?: number
            }
          | {
              p_ip_address: string
              chunk_count?: number
              max_conversions?: number
              window_hours?: number
            }
        Returns: boolean
      }
      cleanup_duplicate_conversions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      increment_processed_characters: {
        Args: {
          p_conversion_id: string
          p_increment: number
          p_progress: number
          p_total_characters: number
          p_processed_chunks: number
          p_total_chunks: number
        }
        Returns: undefined
      }
      migrate_logs_to_system_logs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      migrate_text_cache_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      set_statement_timeout: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_chunk_status: {
        Args: {
          p_chunk_id: string
          p_status: string
          p_audio_path?: string
          p_error_message?: string
        }
        Returns: undefined
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
