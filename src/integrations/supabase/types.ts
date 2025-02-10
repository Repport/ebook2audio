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
      conversion_chunks: {
        Row: {
          audio_path: string | null
          chunk_index: number
          content: string
          conversion_id: string
          created_at: string
          error_message: string | null
          id: string
          retries: number | null
          status: string
          updated_at: string
        }
        Insert: {
          audio_path?: string | null
          chunk_index: number
          content: string
          conversion_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          retries?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          audio_path?: string | null
          chunk_index?: number
          content?: string
          conversion_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
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
        }
        Relationships: []
      }
      text_conversions: {
        Row: {
          created_at: string
          duration: number | null
          error_message: string | null
          expires_at: string
          file_name: string | null
          file_size: number | null
          id: string
          progress: number | null
          status: string
          storage_path: string | null
          text_hash: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          duration?: number | null
          error_message?: string | null
          expires_at?: string
          file_name?: string | null
          file_size?: number | null
          id?: string
          progress?: number | null
          status?: string
          storage_path?: string | null
          text_hash: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          duration?: number | null
          error_message?: string | null
          expires_at?: string
          file_name?: string | null
          file_size?: number | null
          id?: string
          progress?: number | null
          status?: string
          storage_path?: string | null
          text_hash?: string
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
      [_ in never]: never
    }
    Functions: {
      check_conversion_rate_limit:
        | {
            Args: {
              p_ip_address: string
              chunk_count?: number
              max_conversions?: number
              window_hours?: number
            }
            Returns: boolean
          }
        | {
            Args: {
              p_ip_address: string
              max_conversions?: number
              window_hours?: number
            }
            Returns: boolean
          }
      cleanup_duplicate_conversions: {
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
