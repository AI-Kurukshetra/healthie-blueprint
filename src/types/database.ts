export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          booked_by: string
          cancel_reason: string | null
          cancelled_at: string | null
          created_at: string
          duration: number
          id: string
          meeting_room_id: string | null
          notes: string | null
          patient_id: string
          provider_id: string
          reason: string | null
          scheduled_at: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          booked_by?: string
          cancel_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          duration?: number
          id?: string
          meeting_room_id?: string | null
          notes?: string | null
          patient_id: string
          provider_id: string
          reason?: string | null
          scheduled_at: string
          status?: string
          type?: string
          updated_at?: string
        }
        Update: {
          booked_by?: string
          cancel_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          duration?: number
          id?: string
          meeting_room_id?: string | null
          notes?: string | null
          patient_id?: string
          provider_id?: string
          reason?: string | null
          scheduled_at?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      care_plans: {
        Row: {
          created_at: string
          diet_notes: string | null
          end_date: string | null
          exercise: string | null
          follow_up: string | null
          goals: string | null
          id: string
          instructions: string | null
          patient_id: string
          provider_id: string
          start_date: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          diet_notes?: string | null
          end_date?: string | null
          exercise?: string | null
          follow_up?: string | null
          goals?: string | null
          id?: string
          instructions?: string | null
          patient_id: string
          provider_id: string
          start_date?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          diet_notes?: string | null
          end_date?: string | null
          exercise?: string | null
          follow_up?: string | null
          goals?: string | null
          id?: string
          instructions?: string | null
          patient_id?: string
          provider_id?: string
          start_date?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_plans_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_plans_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      care_team: {
        Row: {
          added_at: string
          id: string
          patient_id: string
          provider_id: string
          role: string
        }
        Insert: {
          added_at?: string
          id?: string
          patient_id: string
          provider_id: string
          role?: string
        }
        Update: {
          added_at?: string
          id?: string
          patient_id?: string
          provider_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_team_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_team_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_notes: {
        Row: {
          appointment_id: string | null
          assessment: string | null
          bp_diastolic: number | null
          bp_systolic: number | null
          created_at: string
          diagnosis_codes: string[] | null
          heart_rate: number | null
          height: number | null
          id: string
          note_type: string
          objective: string | null
          oxygen_sat: number | null
          patient_id: string
          plan: string | null
          provider_id: string
          signed_at: string | null
          status: string
          subjective: string | null
          temperature: number | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          appointment_id?: string | null
          assessment?: string | null
          bp_diastolic?: number | null
          bp_systolic?: number | null
          created_at?: string
          diagnosis_codes?: string[] | null
          heart_rate?: number | null
          height?: number | null
          id?: string
          note_type?: string
          objective?: string | null
          oxygen_sat?: number | null
          patient_id: string
          plan?: string | null
          provider_id: string
          signed_at?: string | null
          status?: string
          subjective?: string | null
          temperature?: number | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          appointment_id?: string | null
          assessment?: string | null
          bp_diastolic?: number | null
          bp_systolic?: number | null
          created_at?: string
          diagnosis_codes?: string[] | null
          heart_rate?: number | null
          height?: number | null
          id?: string
          note_type?: string
          objective?: string | null
          oxygen_sat?: number | null
          patient_id?: string
          plan?: string | null
          provider_id?: string
          signed_at?: string | null
          status?: string
          subjective?: string | null
          temperature?: number | null
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "clinical_notes_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_notes_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_records: {
        Row: {
          consent_type: string
          consented: boolean
          consented_at: string
          id: string
          ip_address: string | null
          patient_profile_id: string
        }
        Insert: {
          consent_type?: string
          consented?: boolean
          consented_at?: string
          id?: string
          ip_address?: string | null
          patient_profile_id: string
        }
        Update: {
          consent_type?: string
          consented?: boolean
          consented_at?: string
          id?: string
          ip_address?: string | null
          patient_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consent_records_patient_profile_id_fkey"
            columns: ["patient_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_orders: {
        Row: {
          appointment_id: string | null
          created_at: string
          id: string
          instructions: string | null
          order_number: string
          ordered_at: string
          patient_id: string
          priority: string
          provider_id: string
          status: string
          test_name: string
          test_type: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          id?: string
          instructions?: string | null
          order_number: string
          ordered_at?: string
          patient_id: string
          priority?: string
          provider_id: string
          status?: string
          test_name: string
          test_type: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          id?: string
          instructions?: string | null
          order_number?: string
          ordered_at?: string
          patient_id?: string
          priority?: string
          provider_id?: string
          status?: string
          test_name?: string
          test_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lab_orders_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_orders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_orders_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_results: {
        Row: {
          created_at: string
          file_url: string | null
          findings: string | null
          id: string
          is_abnormal: boolean
          lab_order_id: string
          notes: string | null
          patient_id: string
          provider_id: string
          reported_at: string
          result_summary: string
        }
        Insert: {
          created_at?: string
          file_url?: string | null
          findings?: string | null
          id?: string
          is_abnormal?: boolean
          lab_order_id: string
          notes?: string | null
          patient_id: string
          provider_id: string
          reported_at?: string
          result_summary: string
        }
        Update: {
          created_at?: string
          file_url?: string | null
          findings?: string | null
          id?: string
          is_abnormal?: boolean
          lab_order_id?: string
          notes?: string | null
          patient_id?: string
          provider_id?: string
          reported_at?: string
          result_summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "lab_results_lab_order_id_fkey"
            columns: ["lab_order_id"]
            isOneToOne: false
            referencedRelation: "lab_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_results_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_results_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_history: {
        Row: {
          created_at: string
          date_occurred: string | null
          description: string | null
          history_type: string
          id: string
          is_resolved: boolean | null
          patient_id: string
          provider_id: string | null
          title: string
        }
        Insert: {
          created_at?: string
          date_occurred?: string | null
          description?: string | null
          history_type: string
          id?: string
          is_resolved?: boolean | null
          patient_id: string
          provider_id?: string | null
          title: string
        }
        Update: {
          created_at?: string
          date_occurred?: string | null
          description?: string | null
          history_type?: string
          id?: string
          is_resolved?: boolean | null
          patient_id?: string
          provider_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_history_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_history_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          created_at: string
          dosage: string
          end_date: string | null
          frequency: string
          id: string
          is_active: boolean
          name: string
          notes: string | null
          patient_id: string
          provider_id: string
          reason: string | null
          route: string | null
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dosage: string
          end_date?: string | null
          frequency: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          patient_id: string
          provider_id: string
          reason?: string | null
          route?: string | null
          start_date?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dosage?: string
          end_date?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          patient_id?: string
          provider_id?: string
          reason?: string | null
          route?: string | null
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medications_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medications_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          patient_id: string | null
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          patient_id?: string | null
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          patient_id?: string | null
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          allergies: string[] | null
          blood_group: string | null
          chronic_conditions: string[] | null
          created_at: string
          emergency_contact: string | null
          emergency_phone: string | null
          id: string
          insurance_id: string | null
          insurance_provider: string | null
          patient_id: string
          primary_provider_id: string | null
          profile_id: string
          updated_at: string
        }
        Insert: {
          allergies?: string[] | null
          blood_group?: string | null
          chronic_conditions?: string[] | null
          created_at?: string
          emergency_contact?: string | null
          emergency_phone?: string | null
          id?: string
          insurance_id?: string | null
          insurance_provider?: string | null
          patient_id: string
          primary_provider_id?: string | null
          profile_id: string
          updated_at?: string
        }
        Update: {
          allergies?: string[] | null
          blood_group?: string | null
          chronic_conditions?: string[] | null
          created_at?: string
          emergency_contact?: string | null
          emergency_phone?: string | null
          id?: string
          insurance_id?: string | null
          insurance_provider?: string | null
          patient_id?: string
          primary_provider_id?: string | null
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_primary_provider_id_fkey"
            columns: ["primary_provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          appointment_id: string | null
          created_at: string
          expires_at: string | null
          id: string
          instructions: string | null
          issued_at: string
          medications: Json
          patient_id: string
          provider_id: string
          rx_number: string
          status: string
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          instructions?: string | null
          issued_at?: string
          medications?: Json
          patient_id: string
          provider_id: string
          rx_number: string
          status?: string
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          instructions?: string | null
          issued_at?: string
          medications?: Json
          patient_id?: string
          provider_id?: string
          rx_number?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          created_at: string
          date_of_birth: string | null
          email: string
          full_name: string
          gender: string | null
          id: string
          phone: string | null
          role: string
          state: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          email: string
          full_name: string
          gender?: string | null
          id: string
          phone?: string | null
          role?: string
          state?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          full_name?: string
          gender?: string | null
          id?: string
          phone?: string | null
          role?: string
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      providers: {
        Row: {
          available_days: string[] | null
          bio: string | null
          consultation_fee: number
          created_at: string
          id: string
          is_accepting: boolean
          license_number: string
          license_state: string
          profile_id: string
          rating: number | null
          slot_duration: number
          specialty: string
          total_reviews: number | null
          updated_at: string
        }
        Insert: {
          available_days?: string[] | null
          bio?: string | null
          consultation_fee?: number
          created_at?: string
          id?: string
          is_accepting?: boolean
          license_number: string
          license_state: string
          profile_id: string
          rating?: number | null
          slot_duration?: number
          specialty: string
          total_reviews?: number | null
          updated_at?: string
        }
        Update: {
          available_days?: string[] | null
          bio?: string | null
          consultation_fee?: number
          created_at?: string
          id?: string
          is_accepting?: boolean
          license_number?: string
          license_state?: string
          profile_id?: string
          rating?: number | null
          slot_duration?: number
          specialty?: string
          total_reviews?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "providers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
      Row: infer Row
    }
    ? Row
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer Row
      }
      ? Row
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
      Insert: infer Insert
    }
    ? Insert
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer Insert
      }
      ? Insert
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
      Update: infer Update
    }
    ? Update
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer Update
      }
      ? Update
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
