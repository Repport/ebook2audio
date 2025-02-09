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
      conversion_logs: {
        Row: {
          chunk_count: number | null
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
          chunk_count?: number | null
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
          chunk_count?: number | null
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
          audio_content: string | null
          audio_url: string | null
          content_type: string | null
          created_at: string
          duration: number | null
          expires_at: string
          file_name: string | null
          file_size: number | null
          id: string
          storage_path: string | null
          text_hash: string
        }
        Insert: {
          audio_content?: string | null
          audio_url?: string | null
          content_type?: string | null
          created_at?: string
          duration?: number | null
          expires_at?: string
          file_name?: string | null
          file_size?: number | null
          id?: string
          storage_path?: string | null
          text_hash: string
        }
        Update: {
          audio_content?: string | null
          audio_url?: string | null
          content_type?: string | null
          created_at?: string
          duration?: number | null
          expires_at?: string
          file_name?: string | null
          file_size?: number | null
          id?: string
          storage_path?: string | null
          text_hash?: string
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
