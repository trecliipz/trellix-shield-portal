export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      cyberattacks: {
        Row: {
          affected_products: string[] | null
          attack_type: string | null
          attack_vectors: string[] | null
          business_impact: string | null
          created_at: string
          cvss_score: number | null
          cwe_id: string | null
          date_detected: string
          description: string | null
          external_url: string | null
          id: string
          indicators: Json | null
          industries: string[] | null
          mitigation_steps: string[] | null
          severity: string
          source: string
          source_credibility_score: number | null
          title: string
          updated_at: string
          vendor_info: Json | null
        }
        Insert: {
          affected_products?: string[] | null
          attack_type?: string | null
          attack_vectors?: string[] | null
          business_impact?: string | null
          created_at?: string
          cvss_score?: number | null
          cwe_id?: string | null
          date_detected?: string
          description?: string | null
          external_url?: string | null
          id?: string
          indicators?: Json | null
          industries?: string[] | null
          mitigation_steps?: string[] | null
          severity?: string
          source: string
          source_credibility_score?: number | null
          title: string
          updated_at?: string
          vendor_info?: Json | null
        }
        Update: {
          affected_products?: string[] | null
          attack_type?: string | null
          attack_vectors?: string[] | null
          business_impact?: string | null
          created_at?: string
          cvss_score?: number | null
          cwe_id?: string | null
          date_detected?: string
          description?: string | null
          external_url?: string | null
          id?: string
          indicators?: Json | null
          industries?: string[] | null
          mitigation_steps?: string[] | null
          severity?: string
          source?: string
          source_credibility_score?: number | null
          title?: string
          updated_at?: string
          vendor_info?: Json | null
        }
        Relationships: []
      }
      driver_earnings: {
        Row: {
          bonus_amount: number | null
          created_at: string
          driver_earnings: number
          driver_id: string
          gross_fare: number
          id: string
          platform_fee: number
          ride_id: string | null
          updated_at: string
        }
        Insert: {
          bonus_amount?: number | null
          created_at?: string
          driver_earnings: number
          driver_id: string
          gross_fare: number
          id?: string
          platform_fee?: number
          ride_id?: string | null
          updated_at?: string
        }
        Update: {
          bonus_amount?: number | null
          created_at?: string
          driver_earnings?: number
          driver_id?: string
          gross_fare?: number
          id?: string
          platform_fee?: number
          ride_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_earnings_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_payouts: {
        Row: {
          created_at: string
          driver_id: string
          id: string
          payout_amount: number
          payout_method: string | null
          payout_period_end: string
          payout_period_start: string
          processed_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          driver_id: string
          id?: string
          payout_amount: number
          payout_method?: string | null
          payout_period_end: string
          payout_period_start: string
          processed_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          driver_id?: string
          id?: string
          payout_amount?: number
          payout_method?: string | null
          payout_period_end?: string
          payout_period_start?: string
          processed_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      driver_status: {
        Row: {
          created_at: string | null
          current_location: Json | null
          driver_id: string
          heading: number | null
          id: string
          is_available: boolean | null
          last_ping: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_location?: Json | null
          driver_id: string
          heading?: number | null
          id?: string
          is_available?: boolean | null
          last_ping?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_location?: Json | null
          driver_id?: string
          heading?: number | null
          id?: string
          is_available?: boolean | null
          last_ping?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      driver_vehicles: {
        Row: {
          color: string
          created_at: string | null
          id: string
          make: string
          model: string
          plate: string
          updated_at: string | null
          user_id: string | null
          year: string
        }
        Insert: {
          color: string
          created_at?: string | null
          id?: string
          make: string
          model: string
          plate: string
          updated_at?: string | null
          user_id?: string | null
          year: string
        }
        Update: {
          color?: string
          created_at?: string | null
          id?: string
          make?: string
          model?: string
          plate?: string
          updated_at?: string | null
          user_id?: string | null
          year?: string
        }
        Relationships: []
      }
      ml_metrics: {
        Row: {
          id: string
          metadata: Json | null
          metric_type: string
          metric_value: number
          model_id: string
          timestamp: string
        }
        Insert: {
          id?: string
          metadata?: Json | null
          metric_type: string
          metric_value: number
          model_id: string
          timestamp?: string
        }
        Update: {
          id?: string
          metadata?: Json | null
          metric_type?: string
          metric_value?: number
          model_id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "ml_metrics_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ml_models"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_models: {
        Row: {
          accuracy_rate: number
          created_at: string
          deployment_date: string
          false_positive_rate: number
          id: string
          last_updated: string
          model_type: string
          name: string
          training_status: string
          version: string
        }
        Insert: {
          accuracy_rate?: number
          created_at?: string
          deployment_date?: string
          false_positive_rate?: number
          id?: string
          last_updated?: string
          model_type: string
          name: string
          training_status?: string
          version: string
        }
        Update: {
          accuracy_rate?: number
          created_at?: string
          deployment_date?: string
          false_positive_rate?: number
          id?: string
          last_updated?: string
          model_type?: string
          name?: string
          training_status?: string
          version?: string
        }
        Relationships: []
      }
      model_training_logs: {
        Row: {
          accuracy: number | null
          completed_at: string | null
          dataset_size: number | null
          epoch: number | null
          id: string
          loss_value: number | null
          model_id: string
          started_at: string
          status: string
          training_session_id: string
          training_time_minutes: number | null
        }
        Insert: {
          accuracy?: number | null
          completed_at?: string | null
          dataset_size?: number | null
          epoch?: number | null
          id?: string
          loss_value?: number | null
          model_id: string
          started_at?: string
          status?: string
          training_session_id: string
          training_time_minutes?: number | null
        }
        Update: {
          accuracy?: number | null
          completed_at?: string | null
          dataset_size?: number | null
          epoch?: number | null
          id?: string
          loss_value?: number | null
          model_id?: string
          started_at?: string
          status?: string
          training_session_id?: string
          training_time_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "model_training_logs_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ml_models"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          brand: string
          created_at: string | null
          id: string
          is_default: boolean | null
          last4: string
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          brand: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          last4: string
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          brand?: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          last4?: string
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          photo: string | null
          rating: number | null
          rides: number | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          name?: string
          phone?: string | null
          photo?: string | null
          rating?: number | null
          rides?: number | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          photo?: string | null
          rating?: number | null
          rides?: number | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      ride_requests: {
        Row: {
          assigned_driver_id: string | null
          created_at: string | null
          destination: string
          destination_coords: Json
          estimated_distance: number | null
          estimated_duration: number | null
          estimated_fare: number | null
          expires_at: string | null
          id: string
          pickup_coords: Json
          pickup_location: string
          ride_type: string | null
          rider_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_driver_id?: string | null
          created_at?: string | null
          destination: string
          destination_coords: Json
          estimated_distance?: number | null
          estimated_duration?: number | null
          estimated_fare?: number | null
          expires_at?: string | null
          id?: string
          pickup_coords: Json
          pickup_location: string
          ride_type?: string | null
          rider_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_driver_id?: string | null
          created_at?: string | null
          destination?: string
          destination_coords?: Json
          estimated_distance?: number | null
          estimated_duration?: number | null
          estimated_fare?: number | null
          expires_at?: string | null
          id?: string
          pickup_coords?: Json
          pickup_location?: string
          ride_type?: string | null
          rider_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rides: {
        Row: {
          created_at: string | null
          destination: string
          destination_coords: Json | null
          distance: number | null
          driver_eta: number | null
          driver_id: string | null
          driver_location: Json | null
          estimated_duration: number | null
          fare: number | null
          id: string
          pickup_coords: Json | null
          pickup_location: string
          ride_type: string | null
          rider_id: string | null
          route_data: Json | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          destination: string
          destination_coords?: Json | null
          distance?: number | null
          driver_eta?: number | null
          driver_id?: string | null
          driver_location?: Json | null
          estimated_duration?: number | null
          fare?: number | null
          id?: string
          pickup_coords?: Json | null
          pickup_location: string
          ride_type?: string | null
          rider_id?: string | null
          route_data?: Json | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          destination?: string
          destination_coords?: Json | null
          distance?: number | null
          driver_eta?: number | null
          driver_id?: string | null
          driver_location?: Json | null
          estimated_duration?: number | null
          fare?: number | null
          id?: string
          pickup_coords?: Json | null
          pickup_location?: string
          ride_type?: string | null
          rider_id?: string | null
          route_data?: Json | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      security_updates: {
        Row: {
          changelog: string | null
          compatibility_info: Json | null
          created_at: string
          criticality_level: string | null
          dependencies: Json | null
          deployment_notes: string | null
          description: string | null
          download_url: string | null
          file_name: string
          file_size: number
          id: string
          is_recommended: boolean
          name: string
          platform: string
          release_date: string
          sha256: string | null
          target_systems: Json | null
          threat_coverage: string[] | null
          type: string
          update_category: string | null
          updated_at: string
          version: string
        }
        Insert: {
          changelog?: string | null
          compatibility_info?: Json | null
          created_at?: string
          criticality_level?: string | null
          dependencies?: Json | null
          deployment_notes?: string | null
          description?: string | null
          download_url?: string | null
          file_name: string
          file_size?: number
          id?: string
          is_recommended?: boolean
          name: string
          platform: string
          release_date?: string
          sha256?: string | null
          target_systems?: Json | null
          threat_coverage?: string[] | null
          type: string
          update_category?: string | null
          updated_at?: string
          version: string
        }
        Update: {
          changelog?: string | null
          compatibility_info?: Json | null
          created_at?: string
          criticality_level?: string | null
          dependencies?: Json | null
          deployment_notes?: string | null
          description?: string | null
          download_url?: string | null
          file_name?: string
          file_size?: number
          id?: string
          is_recommended?: boolean
          name?: string
          platform?: string
          release_date?: string
          sha256?: string | null
          target_systems?: Json | null
          threat_coverage?: string[] | null
          type?: string
          update_category?: string | null
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      threat_classifications: {
        Row: {
          classification: string
          classified_at: string
          confidence_score: number
          id: string
          model_id: string
          source_data: Json | null
          threat_type: string
        }
        Insert: {
          classification: string
          classified_at?: string
          confidence_score: number
          id?: string
          model_id: string
          source_data?: Json | null
          threat_type: string
        }
        Update: {
          classification?: string
          classified_at?: string
          confidence_score?: number
          id?: string
          model_id?: string
          source_data?: Json | null
          threat_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "threat_classifications_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ml_models"
            referencedColumns: ["id"]
          },
        ]
      }
      update_logs: {
        Row: {
          api_response_time: number | null
          created_at: string
          error_message: string | null
          fetch_timestamp: string
          id: string
          new_updates: number
          status: string
          updates_found: number
        }
        Insert: {
          api_response_time?: number | null
          created_at?: string
          error_message?: string | null
          fetch_timestamp?: string
          id?: string
          new_updates?: number
          status?: string
          updates_found?: number
        }
        Update: {
          api_response_time?: number | null
          created_at?: string
          error_message?: string | null
          fetch_timestamp?: string
          id?: string
          new_updates?: number
          status?: string
          updates_found?: number
        }
        Relationships: []
      }
      user_locations: {
        Row: {
          created_at: string
          heading: number | null
          id: string
          is_online: boolean | null
          latitude: number
          longitude: number
          updated_at: string
          user_id: string
          user_type: string | null
        }
        Insert: {
          created_at?: string
          heading?: number | null
          id?: string
          is_online?: boolean | null
          latitude: number
          longitude: number
          updated_at?: string
          user_id: string
          user_type?: string | null
        }
        Update: {
          created_at?: string
          heading?: number | null
          id?: string
          is_online?: boolean | null
          latitude?: number
          longitude?: number
          updated_at?: string
          user_id?: string
          user_type?: string | null
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string
          id: string
          type: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          description: string
          id?: string
          type: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string
          id?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_driver_earnings: {
        Args: { p_ride_id: string; p_platform_fee_rate?: number }
        Returns: string
      }
      find_nearby_drivers: {
        Args: {
          p_pickup_lat: number
          p_pickup_lng: number
          p_radius_km?: number
        }
        Returns: {
          driver_id: string
          distance_km: number
          driver_name: string
          driver_rating: number
          vehicle_info: string
          current_location: Json
        }[]
      }
      get_driver_weekly_earnings: {
        Args: { p_driver_id: string; p_week_start?: string }
        Returns: {
          total_earnings: number
          total_rides: number
          total_bonus: number
          total_platform_fees: number
        }[]
      }
      get_wallet_balance: {
        Args: { user_uuid: string }
        Returns: number
      }
      process_weekly_payout: {
        Args: {
          p_driver_id: string
          p_payout_period_start: string
          p_payout_period_end: string
        }
        Returns: string
      }
      update_driver_status: {
        Args: {
          p_driver_id: string
          p_status: string
          p_location?: Json
          p_heading?: number
        }
        Returns: string
      }
      upsert_user_location: {
        Args: {
          p_user_id: string
          p_latitude: number
          p_longitude: number
          p_heading?: number
          p_user_type?: string
          p_is_online?: boolean
        }
        Returns: string
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
