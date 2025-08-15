export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_agent_packages: {
        Row: {
          created_at: string
          created_by: string | null
          deployment_target: string | null
          description: string | null
          features: Json | null
          file_name: string
          file_size: number | null
          id: string
          is_active: boolean | null
          is_recommended: boolean | null
          name: string
          platform: string
          updated_at: string
          version: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deployment_target?: string | null
          description?: string | null
          features?: Json | null
          file_name: string
          file_size?: number | null
          id?: string
          is_active?: boolean | null
          is_recommended?: boolean | null
          name: string
          platform: string
          updated_at?: string
          version: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deployment_target?: string | null
          description?: string | null
          features?: Json | null
          file_name?: string
          file_size?: number | null
          id?: string
          is_active?: boolean | null
          is_recommended?: boolean | null
          name?: string
          platform?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string | null
          created_by: string | null
          email: string
          id: string
          name: string
          role: string
          temp_password: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          email: string
          id?: string
          name: string
          role?: string
          temp_password?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          email?: string
          id?: string
          name?: string
          role?: string
          temp_password?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      agent_configurations: {
        Row: {
          agent_version: string
          auto_update_enabled: boolean | null
          created_at: string
          custom_tags: Json | null
          deployment_policies: Json | null
          epo_credentials: Json | null
          epo_server_url: string | null
          group_name: string | null
          id: string
          last_sync_at: string | null
          organization_id: string | null
          ou_groups: Json | null
          ou_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_version: string
          auto_update_enabled?: boolean | null
          created_at?: string
          custom_tags?: Json | null
          deployment_policies?: Json | null
          epo_credentials?: Json | null
          epo_server_url?: string | null
          group_name?: string | null
          id?: string
          last_sync_at?: string | null
          organization_id?: string | null
          ou_groups?: Json | null
          ou_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_version?: string
          auto_update_enabled?: boolean | null
          created_at?: string
          custom_tags?: Json | null
          deployment_policies?: Json | null
          epo_credentials?: Json | null
          epo_server_url?: string | null
          group_name?: string | null
          id?: string
          last_sync_at?: string | null
          organization_id?: string | null
          ou_groups?: Json | null
          ou_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_configurations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "user_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_downloads: {
        Row: {
          agent_name: string
          agent_version: string
          assigned_by_admin: string | null
          created_at: string
          download_url: string | null
          downloaded_at: string | null
          file_name: string
          file_size: number | null
          id: string
          installed_at: string | null
          platform: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_name: string
          agent_version: string
          assigned_by_admin?: string | null
          created_at?: string
          download_url?: string | null
          downloaded_at?: string | null
          file_name: string
          file_size?: number | null
          id?: string
          installed_at?: string | null
          platform: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_name?: string
          agent_version?: string
          assigned_by_admin?: string | null
          created_at?: string
          download_url?: string | null
          downloaded_at?: string | null
          file_name?: string
          file_size?: number | null
          id?: string
          installed_at?: string | null
          platform?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bulk_operations: {
        Row: {
          completed_items: number | null
          created_at: string
          error_log: string[] | null
          failed_items: number | null
          id: string
          operation_data: Json | null
          operation_type: string
          status: string | null
          total_items: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_items?: number | null
          created_at?: string
          error_log?: string[] | null
          failed_items?: number | null
          id?: string
          operation_data?: Json | null
          operation_type: string
          status?: string | null
          total_items?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_items?: number | null
          created_at?: string
          error_log?: string[] | null
          failed_items?: number | null
          id?: string
          operation_data?: Json | null
          operation_type?: string
          status?: string | null
          total_items?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
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
      date_posts: {
        Row: {
          created_at: string
          facebook: string | null
          id: string
          instagram: string | null
          is_public: boolean | null
          location: string | null
          person_name: string
          photo_url: string | null
          rating: number
          review: string | null
          tags: string[] | null
          twitter: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          facebook?: string | null
          id?: string
          instagram?: string | null
          is_public?: boolean | null
          location?: string | null
          person_name: string
          photo_url?: string | null
          rating: number
          review?: string | null
          tags?: string[] | null
          twitter?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          facebook?: string | null
          id?: string
          instagram?: string | null
          is_public?: boolean | null
          location?: string | null
          person_name?: string
          photo_url?: string | null
          rating?: number
          review?: string | null
          tags?: string[] | null
          twitter?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "date_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      date_reviews: {
        Row: {
          created_at: string
          date_post_id: string
          id: string
          is_verified: boolean | null
          rating: number
          review_text: string | null
          reviewer_user_id: string
        }
        Insert: {
          created_at?: string
          date_post_id: string
          id?: string
          is_verified?: boolean | null
          rating: number
          review_text?: string | null
          reviewer_user_id: string
        }
        Update: {
          created_at?: string
          date_post_id?: string
          id?: string
          is_verified?: boolean | null
          rating?: number
          review_text?: string | null
          reviewer_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "date_reviews_date_post_id_fkey"
            columns: ["date_post_id"]
            isOneToOne: false
            referencedRelation: "date_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "date_reviews_reviewer_user_id_fkey"
            columns: ["reviewer_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      endpoint_groups: {
        Row: {
          created_at: string
          description: string | null
          group_name: string
          id: string
          organization_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          group_name: string
          id?: string
          organization_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          group_name?: string
          id?: string
          organization_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "endpoint_groups_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "user_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      endpoints: {
        Row: {
          agent_version: string | null
          created_at: string
          deployment_status: string | null
          health_status: string | null
          id: string
          ip_address: string | null
          last_check_in: string | null
          mac_address: string | null
          machine_name: string
          organization_id: string
          os_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_version?: string | null
          created_at?: string
          deployment_status?: string | null
          health_status?: string | null
          id?: string
          ip_address?: string | null
          last_check_in?: string | null
          mac_address?: string | null
          machine_name: string
          organization_id: string
          os_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_version?: string | null
          created_at?: string
          deployment_status?: string | null
          health_status?: string | null
          id?: string
          ip_address?: string | null
          last_check_in?: string | null
          mac_address?: string | null
          machine_name?: string
          organization_id?: string
          os_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "endpoints_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "user_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      error_logs: {
        Row: {
          created_at: string
          details: Json
          id: string
          level: string
          message: string
          resolved: boolean
          session_id: string | null
          source: string | null
          tags: string[]
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json
          id?: string
          level: string
          message: string
          resolved?: boolean
          session_id?: string | null
          source?: string | null
          tags?: string[]
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json
          id?: string
          level?: string
          message?: string
          resolved?: boolean
          session_id?: string | null
          source?: string | null
          tags?: string[]
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "error_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      pricing_tiers: {
        Row: {
          created_at: string
          features: Json | null
          id: string
          is_active: boolean | null
          price_per_unit: number
          tier_name: string
          unit_size: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          features?: Json | null
          id?: string
          is_active?: boolean | null
          price_per_unit: number
          tier_name: string
          unit_size: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          features?: Json | null
          id?: string
          is_active?: boolean | null
          price_per_unit?: number
          tier_name?: string
          unit_size?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          department: string | null
          email: string | null
          id: string
          is_online: boolean | null
          last_seen: string | null
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
          department?: string | null
          email?: string | null
          id: string
          is_online?: boolean | null
          last_seen?: string | null
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
          department?: string | null
          email?: string | null
          id?: string
          is_online?: boolean | null
          last_seen?: string | null
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
      subscription_plans: {
        Row: {
          created_at: string
          display_name: string
          download_limit: number
          endpoint_limit: number
          features: Json | null
          id: string
          is_active: boolean | null
          is_free_trial: boolean | null
          plan_name: string
          price_monthly: number
          price_yearly: number
          trial_duration_days: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          download_limit?: number
          endpoint_limit?: number
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_free_trial?: boolean | null
          plan_name: string
          price_monthly?: number
          price_yearly?: number
          trial_duration_days?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          download_limit?: number
          endpoint_limit?: number
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_free_trial?: boolean | null
          plan_name?: string
          price_monthly?: number
          price_yearly?: number
          trial_duration_days?: number | null
          updated_at?: string
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
      user_custom_packages: {
        Row: {
          base_package_id: string
          created_at: string | null
          custom_config: Json | null
          id: string
          package_name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          base_package_id: string
          created_at?: string | null
          custom_config?: Json | null
          id?: string
          package_name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          base_package_id?: string
          created_at?: string | null
          custom_config?: Json | null
          id?: string
          package_name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_custom_packages_base_package_id_fkey"
            columns: ["base_package_id"]
            isOneToOne: false
            referencedRelation: "admin_agent_packages"
            referencedColumns: ["id"]
          },
        ]
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
      user_organizations: {
        Row: {
          created_at: string
          group_name: string
          id: string
          industry: string | null
          organization_name: string
          organization_size: string | null
          primary_contact_phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_name: string
          id?: string
          industry?: string | null
          organization_name: string
          organization_size?: string | null
          primary_contact_phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_name?: string
          id?: string
          industry?: string | null
          organization_name?: string
          organization_size?: string | null
          primary_contact_phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_pings: {
        Row: {
          created_at: string
          from_user_id: string
          id: string
          message: string | null
          ping_type: string | null
          to_user_id: string
        }
        Insert: {
          created_at?: string
          from_user_id: string
          id?: string
          message?: string | null
          ping_type?: string | null
          to_user_id: string
        }
        Update: {
          created_at?: string
          from_user_id?: string
          id?: string
          message?: string | null
          ping_type?: string | null
          to_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_pings_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_pings_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          auto_renew: boolean | null
          billing_cycle: string | null
          created_at: string | null
          downloads_used: number | null
          id: string
          max_downloads: number | null
          plan_id: string | null
          plan_type: string
          status: string
          trial_ends_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_renew?: boolean | null
          billing_cycle?: string | null
          created_at?: string | null
          downloads_used?: number | null
          id?: string
          max_downloads?: number | null
          plan_id?: string | null
          plan_type: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_renew?: boolean | null
          billing_cycle?: string | null
          created_at?: string | null
          downloads_used?: number | null
          id?: string
          max_downloads?: number | null
          plan_id?: string | null
          plan_type?: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
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
      assign_admin_role: {
        Args: { admin_email: string }
        Returns: string
      }
      assign_agent_to_users: {
        Args: {
          p_agent_id: string
          p_assigned_by: string
          p_user_ids: string[]
        }
        Returns: number
      }
      assign_free_trial: {
        Args: { p_user_id: string }
        Returns: string
      }
      calculate_driver_earnings: {
        Args: { p_platform_fee_rate?: number; p_ride_id: string }
        Returns: string
      }
      can_user_download: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      create_custom_package: {
        Args: {
          p_base_package_id: string
          p_custom_config?: Json
          p_package_name: string
          p_user_id: string
        }
        Returns: string
      }
      deploy_agent_to_users: {
        Args: {
          p_agent_id: string
          p_deployment_target: string
          p_target_user_ids?: string[]
        }
        Returns: {
          deployment_id: string
          message: string
          target_count: number
        }[]
      }
      find_nearby_drivers: {
        Args: {
          p_pickup_lat: number
          p_pickup_lng: number
          p_radius_km?: number
        }
        Returns: {
          current_location: Json
          distance_km: number
          driver_id: string
          driver_name: string
          driver_rating: number
          vehicle_info: string
        }[]
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_deployment_status: {
        Args: { p_deployment_id: string }
        Returns: {
          completed_users: number
          created_at: string
          deployment_id: string
          failed_users: number
          progress_percentage: number
          status: string
          total_users: number
        }[]
      }
      get_driver_weekly_earnings: {
        Args: { p_driver_id: string; p_week_start?: string }
        Returns: {
          total_bonus: number
          total_earnings: number
          total_platform_fees: number
          total_rides: number
        }[]
      }
      get_wallet_balance: {
        Args: { user_uuid: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_download_count: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      process_weekly_payout: {
        Args: {
          p_driver_id: string
          p_payout_period_end: string
          p_payout_period_start: string
        }
        Returns: string
      }
      sync_user_agent_config: {
        Args: {
          p_agent_version: string
          p_epo_config?: Json
          p_user_id: string
        }
        Returns: string
      }
      update_driver_status: {
        Args: {
          p_driver_id: string
          p_heading?: number
          p_location?: Json
          p_status: string
        }
        Returns: string
      }
      upgrade_user_subscription: {
        Args: {
          p_billing_cycle?: string
          p_plan_name: string
          p_user_id: string
        }
        Returns: string
      }
      upsert_user_location: {
        Args: {
          p_heading?: number
          p_is_online?: boolean
          p_latitude: number
          p_longitude: number
          p_user_id: string
          p_user_type?: string
        }
        Returns: string
      }
      user_has_paid_subscription: {
        Args: { p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
