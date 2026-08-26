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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          activity_type: string
          created_at: string
          distance_km: number | null
          duration_minutes: number | null
          estimated_calories_burned: number | null
          id: string
          intensity: string | null
          notes: string | null
          occurred_at: string
          steps: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          distance_km?: number | null
          duration_minutes?: number | null
          estimated_calories_burned?: number | null
          id?: string
          intensity?: string | null
          notes?: string | null
          occurred_at?: string
          steps?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          distance_km?: number | null
          duration_minutes?: number | null
          estimated_calories_burned?: number | null
          id?: string
          intensity?: string | null
          notes?: string | null
          occurred_at?: string
          steps?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      body_measurements: {
        Row: {
          body_fat_pct: number | null
          created_at: string
          id: string
          measured_at: string
          notes: string | null
          user_id: string
          waist_cm: number | null
          weight_kg: number | null
        }
        Insert: {
          body_fat_pct?: number | null
          created_at?: string
          id?: string
          measured_at?: string
          notes?: string | null
          user_id: string
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Update: {
          body_fat_pct?: number | null
          created_at?: string
          id?: string
          measured_at?: string
          notes?: string | null
          user_id?: string
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      custom_foods: {
        Row: {
          added_sugar_g: number | null
          calories: number | null
          carbs_g: number | null
          created_at: string
          fat_g: number | null
          fiber_g: number | null
          id: string
          is_favorite: boolean
          name: string
          protein_g: number | null
          serving_description: string | null
          sodium_mg: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          added_sugar_g?: number | null
          calories?: number | null
          carbs_g?: number | null
          created_at?: string
          fat_g?: number | null
          fiber_g?: number | null
          id?: string
          is_favorite?: boolean
          name: string
          protein_g?: number | null
          serving_description?: string | null
          sodium_mg?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          added_sugar_g?: number | null
          calories?: number | null
          carbs_g?: number | null
          created_at?: string
          fat_g?: number | null
          fiber_g?: number | null
          id?: string
          is_favorite?: boolean
          name?: string
          protein_g?: number | null
          serving_description?: string | null
          sodium_mg?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_reviews: {
        Row: {
          completed_at: string
          confidence: string
          coverage_ratio: number
          daily_totals: Json
          generated_summary: string
          goal_id: string | null
          goal_snapshot: Json
          grade: string | null
          id: string
          is_stale: boolean
          local_date: string
          metric_scores: Json
          score: number | null
          scoring_algorithm_version: string
          top_opportunity: string | null
          top_strength: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at: string
          confidence: string
          coverage_ratio: number
          daily_totals: Json
          generated_summary: string
          goal_id?: string | null
          goal_snapshot: Json
          grade?: string | null
          id?: string
          is_stale?: boolean
          local_date: string
          metric_scores: Json
          score?: number | null
          scoring_algorithm_version: string
          top_opportunity?: string | null
          top_strength?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string
          confidence?: string
          coverage_ratio?: number
          daily_totals?: Json
          generated_summary?: string
          goal_id?: string | null
          goal_snapshot?: Json
          grade?: string | null
          id?: string
          is_stale?: boolean
          local_date?: string
          metric_scores?: Json
          score?: number | null
          scoring_algorithm_version?: string
          top_opportunity?: string | null
          top_strength?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_reviews_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "user_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      day_status: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          local_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          local_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          local_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hydration_logs: {
        Row: {
          calories: number | null
          consumed_at: string
          created_at: string
          drink_type: string
          id: string
          notes: string | null
          updated_at: string
          user_id: string
          volume_ml: number
        }
        Insert: {
          calories?: number | null
          consumed_at?: string
          created_at?: string
          drink_type?: string
          id?: string
          notes?: string | null
          updated_at?: string
          user_id: string
          volume_ml: number
        }
        Update: {
          calories?: number | null
          consumed_at?: string
          created_at?: string
          drink_type?: string
          id?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
          volume_ml?: number
        }
        Relationships: []
      }
      meal_items: {
        Row: {
          added_sugar_g: number | null
          calories: number | null
          carbs_g: number | null
          created_at: string
          fat_g: number | null
          fiber_g: number | null
          id: string
          meal_log_id: string
          portion_description: string | null
          protein_g: number | null
          sodium_mg: number | null
          title: string
          user_id: string
        }
        Insert: {
          added_sugar_g?: number | null
          calories?: number | null
          carbs_g?: number | null
          created_at?: string
          fat_g?: number | null
          fiber_g?: number | null
          id?: string
          meal_log_id: string
          portion_description?: string | null
          protein_g?: number | null
          sodium_mg?: number | null
          title: string
          user_id: string
        }
        Update: {
          added_sugar_g?: number | null
          calories?: number | null
          carbs_g?: number | null
          created_at?: string
          fat_g?: number | null
          fiber_g?: number | null
          id?: string
          meal_log_id?: string
          portion_description?: string | null
          protein_g?: number | null
          sodium_mg?: number | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_items_meal_log_id_fkey"
            columns: ["meal_log_id"]
            isOneToOne: false
            referencedRelation: "meal_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_logs: {
        Row: {
          added_sugar_g: number | null
          calories: number | null
          carbs_g: number | null
          created_at: string
          eaten_at: string
          fat_g: number | null
          fiber_g: number | null
          id: string
          meal_score: number | null
          meal_type: string | null
          notes: string | null
          nutrition_confidence: string
          nutrition_external_id: string | null
          nutrition_source: string
          portion_description: string | null
          protein_g: number | null
          quantity: number
          raw_description: string | null
          restaurant_name: string | null
          score_breakdown: Json
          sodium_mg: number | null
          source_type: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          added_sugar_g?: number | null
          calories?: number | null
          carbs_g?: number | null
          created_at?: string
          eaten_at?: string
          fat_g?: number | null
          fiber_g?: number | null
          id?: string
          meal_score?: number | null
          meal_type?: string | null
          notes?: string | null
          nutrition_confidence?: string
          nutrition_external_id?: string | null
          nutrition_source?: string
          portion_description?: string | null
          protein_g?: number | null
          quantity?: number
          raw_description?: string | null
          restaurant_name?: string | null
          score_breakdown?: Json
          sodium_mg?: number | null
          source_type?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          added_sugar_g?: number | null
          calories?: number | null
          carbs_g?: number | null
          created_at?: string
          eaten_at?: string
          fat_g?: number | null
          fiber_g?: number | null
          id?: string
          meal_score?: number | null
          meal_type?: string | null
          notes?: string | null
          nutrition_confidence?: string
          nutrition_external_id?: string | null
          nutrition_source?: string
          portion_description?: string | null
          protein_g?: number | null
          quantity?: number
          raw_description?: string | null
          restaurant_name?: string | null
          score_breakdown?: Json
          sodium_mg?: number | null
          source_type?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      period_reviews: {
        Row: {
          confidence: string
          coverage_ratio: number
          created_at: string
          id: string
          insights: Json
          period_end: string
          period_start: string
          period_type: string
          score: number | null
          scoring_algorithm_version: string
          summary: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence: string
          coverage_ratio: number
          created_at?: string
          id?: string
          insights?: Json
          period_end: string
          period_start: string
          period_type: string
          score?: number | null
          scoring_algorithm_version: string
          summary: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence?: string
          coverage_ratio?: number
          created_at?: string
          id?: string
          insights?: Json
          period_end?: string
          period_start?: string
          period_type?: string
          score?: number | null
          scoring_algorithm_version?: string
          summary?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          goal_weight_kg: number | null
          height_cm: number | null
          id: string
          preferred_unit_system: string
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          goal_weight_kg?: number | null
          height_cm?: number | null
          id: string
          preferred_unit_system?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          goal_weight_kg?: number | null
          height_cm?: number | null
          id?: string
          preferred_unit_system?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      saved_meals: {
        Row: {
          added_sugar_g: number | null
          calories: number | null
          carbs_g: number | null
          created_at: string
          fat_g: number | null
          fiber_g: number | null
          id: string
          is_favorite: boolean
          last_used_at: string | null
          portion_description: string | null
          protein_g: number | null
          restaurant_name: string | null
          sodium_mg: number | null
          source_type: string | null
          title: string
          updated_at: string
          use_count: number
          user_id: string
        }
        Insert: {
          added_sugar_g?: number | null
          calories?: number | null
          carbs_g?: number | null
          created_at?: string
          fat_g?: number | null
          fiber_g?: number | null
          id?: string
          is_favorite?: boolean
          last_used_at?: string | null
          portion_description?: string | null
          protein_g?: number | null
          restaurant_name?: string | null
          sodium_mg?: number | null
          source_type?: string | null
          title: string
          updated_at?: string
          use_count?: number
          user_id: string
        }
        Update: {
          added_sugar_g?: number | null
          calories?: number | null
          carbs_g?: number | null
          created_at?: string
          fat_g?: number | null
          fiber_g?: number | null
          id?: string
          is_favorite?: boolean
          last_used_at?: string | null
          portion_description?: string | null
          protein_g?: number | null
          restaurant_name?: string | null
          sodium_mg?: number | null
          source_type?: string | null
          title?: string
          updated_at?: string
          use_count?: number
          user_id?: string
        }
        Relationships: []
      }
      user_goals: {
        Row: {
          added_sugar_limit_g: number | null
          calorie_target: number | null
          carbs_target_g: number | null
          created_at: string
          effective_from: string
          effective_until: string | null
          fat_target_g: number | null
          fiber_target_g: number | null
          id: string
          late_meal_time: string
          primary_goal: string
          protein_target_g: number | null
          sodium_limit_mg: number | null
          step_target: number | null
          user_id: string
          water_target_ml: number | null
          weekly_workout_target: number | null
        }
        Insert: {
          added_sugar_limit_g?: number | null
          calorie_target?: number | null
          carbs_target_g?: number | null
          created_at?: string
          effective_from: string
          effective_until?: string | null
          fat_target_g?: number | null
          fiber_target_g?: number | null
          id?: string
          late_meal_time?: string
          primary_goal?: string
          protein_target_g?: number | null
          sodium_limit_mg?: number | null
          step_target?: number | null
          user_id: string
          water_target_ml?: number | null
          weekly_workout_target?: number | null
        }
        Update: {
          added_sugar_limit_g?: number | null
          calorie_target?: number | null
          carbs_target_g?: number | null
          created_at?: string
          effective_from?: string
          effective_until?: string | null
          fat_target_g?: number | null
          fiber_target_g?: number | null
          id?: string
          late_meal_time?: string
          primary_goal?: string
          protein_target_g?: number | null
          sodium_limit_mg?: number | null
          step_target?: number | null
          user_id?: string
          water_target_ml?: number | null
          weekly_workout_target?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      replace_active_goal: {
        Args: {
          p_added_sugar_limit_g: number
          p_calorie_target: number
          p_carbs_target_g: number
          p_effective_from: string
          p_fat_target_g: number
          p_fiber_target_g: number
          p_late_meal_time: string
          p_primary_goal: string
          p_protein_target_g: number
          p_sodium_limit_mg: number
          p_step_target: number
          p_water_target_ml: number
          p_weekly_workout_target: number
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
