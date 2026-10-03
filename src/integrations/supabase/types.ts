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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agent_audit: {
        Row: {
          arguments: Json
          created_at: string
          dry_run: boolean
          id: number
          result_summary: string | null
          rows_affected: number | null
          token_id: string | null
          tool_name: string
          user_id: string
        }
        Insert: {
          arguments: Json
          created_at?: string
          dry_run: boolean
          id?: number
          result_summary?: string | null
          rows_affected?: number | null
          token_id?: string | null
          tool_name: string
          user_id: string
        }
        Update: {
          arguments?: Json
          created_at?: string
          dry_run?: boolean
          id?: number
          result_summary?: string | null
          rows_affected?: number | null
          token_id?: string | null
          tool_name?: string
          user_id?: string
        }
        Relationships: []
      }
      api_tokens: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          label: string | null
          last_used_at: string | null
          revoked_at: string | null
          scope: string
          token_hash: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          label?: string | null
          last_used_at?: string | null
          revoked_at?: string | null
          scope: string
          token_hash: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          label?: string | null
          last_used_at?: string | null
          revoked_at?: string | null
          scope?: string
          token_hash?: string
          user_id?: string
        }
        Relationships: []
      }
      body_metrics: {
        Row: {
          bmi: number | null
          bmr_kcal: number | null
          body_fat_pct: number | null
          body_water_pct: number | null
          bone_mass_kg: number | null
          created_at: string
          date: string
          fat_free_mass_kg: number | null
          id: string
          metabolic_age: number | null
          muscle_mass_kg: number | null
          muscle_mass_pct: number | null
          protein_pct: number | null
          skeletal_muscle_pct: number | null
          subcutaneous_fat_pct: number | null
          user_id: string
          visceral_fat: number | null
          weight: number | null
        }
        Insert: {
          bmi?: number | null
          bmr_kcal?: number | null
          body_fat_pct?: number | null
          body_water_pct?: number | null
          bone_mass_kg?: number | null
          created_at?: string
          date?: string
          fat_free_mass_kg?: number | null
          id?: string
          metabolic_age?: number | null
          muscle_mass_kg?: number | null
          muscle_mass_pct?: number | null
          protein_pct?: number | null
          skeletal_muscle_pct?: number | null
          subcutaneous_fat_pct?: number | null
          user_id: string
          visceral_fat?: number | null
          weight?: number | null
        }
        Update: {
          bmi?: number | null
          bmr_kcal?: number | null
          body_fat_pct?: number | null
          body_water_pct?: number | null
          bone_mass_kg?: number | null
          created_at?: string
          date?: string
          fat_free_mass_kg?: number | null
          id?: string
          metabolic_age?: number | null
          muscle_mass_kg?: number | null
          muscle_mass_pct?: number | null
          protein_pct?: number | null
          skeletal_muscle_pct?: number | null
          subcutaneous_fat_pct?: number | null
          user_id?: string
          visceral_fat?: number | null
          weight?: number | null
        }
        Relationships: []
      }
      cardio_sessions: {
        Row: {
          activity: string
          created_at: string
          date: string
          distance_km: number | null
          duration_min: number
          ended_at: string | null
          id: string
          notes: string | null
          started_at: string | null
          user_id: string
        }
        Insert: {
          activity: string
          created_at?: string
          date?: string
          distance_km?: number | null
          duration_min: number
          ended_at?: string | null
          id?: string
          notes?: string | null
          started_at?: string | null
          user_id: string
        }
        Update: {
          activity?: string
          created_at?: string
          date?: string
          distance_km?: number | null
          duration_min?: number
          ended_at?: string | null
          id?: string
          notes?: string | null
          started_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      custom_exercises: {
        Row: {
          body_area: string | null
          created_at: string
          id: string
          module: string
          muscle_group: string
          name: string
          user_id: string
        }
        Insert: {
          body_area?: string | null
          created_at?: string
          id?: string
          module: string
          muscle_group: string
          name: string
          user_id: string
        }
        Update: {
          body_area?: string | null
          created_at?: string
          id?: string
          module?: string
          muscle_group?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_checkin: {
        Row: {
          date: string
          knee_left: number | null
          knee_right: number | null
          note: string | null
          sleep_felt: number | null
          soreness: number | null
          swelling: boolean | null
          user_id: string
        }
        Insert: {
          date: string
          knee_left?: number | null
          knee_right?: number | null
          note?: string | null
          sleep_felt?: number | null
          soreness?: number | null
          swelling?: boolean | null
          user_id: string
        }
        Update: {
          date?: string
          knee_left?: number | null
          knee_right?: number | null
          note?: string | null
          sleep_felt?: number | null
          soreness?: number | null
          swelling?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      daily_metrics: {
        Row: {
          body_fat_pct: number | null
          cardio_load: number | null
          date: string
          hrv_ms: number | null
          imported_at: string | null
          nonrem_hr: number | null
          resting_hr: number | null
          sleep_asleep_min: number | null
          sleep_deep_min: number | null
          sleep_efficiency: number | null
          sleep_end: string | null
          sleep_in_bed_min: number | null
          sleep_light_min: number | null
          sleep_rem_min: number | null
          sleep_score: number | null
          sleep_start: string | null
          sleep_wake_min: number | null
          source: string | null
          steps: number | null
          user_id: string
          vo2max: number | null
          weight_kg: number | null
          workout_min: number | null
          workout_peak_min: number | null
          workouts: string | null
        }
        Insert: {
          body_fat_pct?: number | null
          cardio_load?: number | null
          date: string
          hrv_ms?: number | null
          imported_at?: string | null
          nonrem_hr?: number | null
          resting_hr?: number | null
          sleep_asleep_min?: number | null
          sleep_deep_min?: number | null
          sleep_efficiency?: number | null
          sleep_end?: string | null
          sleep_in_bed_min?: number | null
          sleep_light_min?: number | null
          sleep_rem_min?: number | null
          sleep_score?: number | null
          sleep_start?: string | null
          sleep_wake_min?: number | null
          source?: string | null
          steps?: number | null
          user_id: string
          vo2max?: number | null
          weight_kg?: number | null
          workout_min?: number | null
          workout_peak_min?: number | null
          workouts?: string | null
        }
        Update: {
          body_fat_pct?: number | null
          cardio_load?: number | null
          date?: string
          hrv_ms?: number | null
          imported_at?: string | null
          nonrem_hr?: number | null
          resting_hr?: number | null
          sleep_asleep_min?: number | null
          sleep_deep_min?: number | null
          sleep_efficiency?: number | null
          sleep_end?: string | null
          sleep_in_bed_min?: number | null
          sleep_light_min?: number | null
          sleep_rem_min?: number | null
          sleep_score?: number | null
          sleep_start?: string | null
          sleep_wake_min?: number | null
          source?: string | null
          steps?: number | null
          user_id?: string
          vo2max?: number | null
          weight_kg?: number | null
          workout_min?: number | null
          workout_peak_min?: number | null
          workouts?: string | null
        }
        Relationships: []
      }
      exercises: {
        Row: {
          created_at: string
          created_by: string | null
          equipment: string
          exercise_type: string
          id: string
          instructions: string | null
          is_custom: boolean
          muscle_group: string
          name: string
          secondary_muscles: string[]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          equipment: string
          exercise_type?: string
          id?: string
          instructions?: string | null
          is_custom?: boolean
          muscle_group: string
          name: string
          secondary_muscles?: string[]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          equipment?: string
          exercise_type?: string
          id?: string
          instructions?: string | null
          is_custom?: boolean
          muscle_group?: string
          name?: string
          secondary_muscles?: string[]
        }
        Relationships: []
      }
      favorite_exercises: {
        Row: {
          created_at: string
          exercise_name: string
          id: string
          module: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exercise_name: string
          id?: string
          module: string
          user_id: string
        }
        Update: {
          created_at?: string
          exercise_name?: string
          id?: string
          module?: string
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          target_body_fat_pct: number | null
          target_muscle_mass_pct: number | null
          target_weight: number | null
          updated_at: string
          user_id: string
          weekly_cardio: number
          weekly_gym: number
          weekly_pt: number
          weekly_sport: number
        }
        Insert: {
          target_body_fat_pct?: number | null
          target_muscle_mass_pct?: number | null
          target_weight?: number | null
          updated_at?: string
          user_id: string
          weekly_cardio?: number
          weekly_gym?: number
          weekly_pt?: number
          weekly_sport?: number
        }
        Update: {
          target_body_fat_pct?: number | null
          target_muscle_mass_pct?: number | null
          target_weight?: number | null
          updated_at?: string
          user_id?: string
          weekly_cardio?: number
          weekly_gym?: number
          weekly_pt?: number
          weekly_sport?: number
        }
        Relationships: []
      }
      gym_sessions: {
        Row: {
          created_at: string
          date: string
          ended_at: string | null
          exercises: Json
          id: string
          notes: string | null
          started_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          ended_at?: string | null
          exercises?: Json
          id?: string
          notes?: string | null
          started_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          ended_at?: string | null
          exercises?: Json
          id?: string
          notes?: string | null
          started_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      meal_logs: {
        Row: {
          calories: number | null
          carbs_g: number | null
          created_at: string
          date: string
          fat_g: number | null
          id: string
          meal_name: string
          meal_type: string
          protein_g: number
          user_id: string
        }
        Insert: {
          calories?: number | null
          carbs_g?: number | null
          created_at?: string
          date?: string
          fat_g?: number | null
          id?: string
          meal_name: string
          meal_type?: string
          protein_g: number
          user_id: string
        }
        Update: {
          calories?: number | null
          carbs_g?: number | null
          created_at?: string
          date?: string
          fat_g?: number | null
          id?: string
          meal_name?: string
          meal_type?: string
          protein_g?: number
          user_id?: string
        }
        Relationships: []
      }
      meal_presets: {
        Row: {
          calories: number | null
          carbs_g: number | null
          created_at: string
          fat_g: number | null
          id: string
          meal_type: string
          name: string
          protein_g: number
          user_id: string
        }
        Insert: {
          calories?: number | null
          carbs_g?: number | null
          created_at?: string
          fat_g?: number | null
          id?: string
          meal_type?: string
          name: string
          protein_g: number
          user_id: string
        }
        Update: {
          calories?: number | null
          carbs_g?: number | null
          created_at?: string
          fat_g?: number | null
          id?: string
          meal_type?: string
          name?: string
          protein_g?: number
          user_id?: string
        }
        Relationships: []
      }
      nutrition_goals: {
        Row: {
          daily_calories: number | null
          daily_carbs_g: number | null
          daily_fat_g: number | null
          daily_protein_g: number
          updated_at: string
          user_id: string
        }
        Insert: {
          daily_calories?: number | null
          daily_carbs_g?: number | null
          daily_fat_g?: number | null
          daily_protein_g?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          daily_calories?: number | null
          daily_carbs_g?: number | null
          daily_fat_g?: number | null
          daily_protein_g?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      plan_schedule: {
        Row: {
          day_of_week: number
          id: string
          label: string | null
          module: string
          template_id: string | null
          user_id: string
        }
        Insert: {
          day_of_week: number
          id?: string
          label?: string | null
          module: string
          template_id?: string | null
          user_id: string
        }
        Update: {
          day_of_week?: number
          id?: string
          label?: string | null
          module?: string
          template_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      plan_skips: {
        Row: {
          created_at: string
          day_of_week: number
          id: string
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          id?: string
          user_id: string
          week_start: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          id?: string
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          rest_timer_seconds: number
          unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          rest_timer_seconds?: number
          unit?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          rest_timer_seconds?: number
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      program_templates: {
        Row: {
          active: boolean
          code: string
          day_of_week: number | null
          id: string
          name: string
          notes: string | null
          session_type: string
          sort_order: number
          target_minutes: number | null
          user_id: string
        }
        Insert: {
          active?: boolean
          code: string
          day_of_week?: number | null
          id?: string
          name: string
          notes?: string | null
          session_type: string
          sort_order?: number
          target_minutes?: number | null
          user_id: string
        }
        Update: {
          active?: boolean
          code?: string
          day_of_week?: number | null
          id?: string
          name?: string
          notes?: string | null
          session_type?: string
          sort_order?: number
          target_minutes?: number | null
          user_id?: string
        }
        Relationships: []
      }
      pt_sessions: {
        Row: {
          created_at: string
          date: string
          ended_at: string | null
          exercises: Json
          id: string
          overall_notes: string | null
          started_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          ended_at?: string | null
          exercises?: Json
          id?: string
          overall_notes?: string | null
          started_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          ended_at?: string | null
          exercises?: Json
          id?: string
          overall_notes?: string | null
          started_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      share_tokens: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          last_used_at: string | null
          name: string
          revoked_at: string | null
          token_hash: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          last_used_at?: string | null
          name?: string
          revoked_at?: string | null
          token_hash: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          last_used_at?: string | null
          name?: string
          revoked_at?: string | null
          token_hash?: string
          user_id?: string
        }
        Relationships: []
      }
      template_exercises: {
        Row: {
          coaching_cue: string | null
          exercise_name: string
          id: string
          is_knee_critical: boolean
          load_note: string | null
          reps: string | null
          sets: number | null
          sort_order: number
          template_id: string
        }
        Insert: {
          coaching_cue?: string | null
          exercise_name: string
          id?: string
          is_knee_critical?: boolean
          load_note?: string | null
          reps?: string | null
          sets?: number | null
          sort_order: number
          template_id: string
        }
        Update: {
          coaching_cue?: string | null
          exercise_name?: string
          id?: string
          is_knee_critical?: boolean
          load_note?: string | null
          reps?: string | null
          sets?: number | null
          sort_order?: number
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_exercises_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "program_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_templates: {
        Row: {
          created_at: string
          emoji: string | null
          id: string
          module: string
          name: string
          payload: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji?: string | null
          id?: string
          module: string
          name: string
          payload?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string | null
          id?: string
          module?: string
          name?: string
          payload?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      mcp_set_template_exercises: {
        Args: { p_code: string; p_exercises: Json; p_user: string }
        Returns: number
      }
      mcp_upsert_daily_metrics: {
        Args: { p_rows: Json; p_user: string }
        Returns: number
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
