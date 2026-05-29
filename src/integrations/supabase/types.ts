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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agency_profiles: {
        Row: {
          agency_name: string
          contact_email: string
          created_at: string
          hubspot_api_key: string | null
          id: string
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          agency_name: string
          contact_email: string
          created_at?: string
          hubspot_api_key?: string | null
          id?: string
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          agency_name?: string
          contact_email?: string
          created_at?: string
          hubspot_api_key?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      candidates: {
        Row: {
          consent_analysis: boolean
          consent_date: string | null
          consent_recruiter_sharing: boolean
          created_at: string
          email: string
          expires_at: string
          id: string
          location: string | null
          name: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          consent_analysis?: boolean
          consent_date?: string | null
          consent_recruiter_sharing?: boolean
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          location?: string | null
          name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          consent_analysis?: boolean
          consent_date?: string | null
          consent_recruiter_sharing?: boolean
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          location?: string | null
          name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      carbon_footprints: {
        Row: {
          badge_token: string
          company_name: string
          created_at: string
          employees: number
          energy_kwh: number
          id: string
          industry: string
          is_carbon_neutral: boolean
          offsets_kg: number
          period_label: string
          total_emissions_kg: number
          travel_km: number
          updated_at: string
          user_id: string
          waste_kg: number
        }
        Insert: {
          badge_token?: string
          company_name: string
          created_at?: string
          employees?: number
          energy_kwh?: number
          id?: string
          industry?: string
          is_carbon_neutral?: boolean
          offsets_kg?: number
          period_label?: string
          total_emissions_kg?: number
          travel_km?: number
          updated_at?: string
          user_id: string
          waste_kg?: number
        }
        Update: {
          badge_token?: string
          company_name?: string
          created_at?: string
          employees?: number
          energy_kwh?: number
          id?: string
          industry?: string
          is_carbon_neutral?: boolean
          offsets_kg?: number
          period_label?: string
          total_emissions_kg?: number
          travel_km?: number
          updated_at?: string
          user_id?: string
          waste_kg?: number
        }
        Relationships: []
      }
      consent_logs: {
        Row: {
          action: string
          candidate_id: string
          consent_type: string
          created_at: string
          id: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          candidate_id: string
          consent_type: string
          created_at?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          candidate_id?: string
          consent_type?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consent_logs_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_templates: {
        Row: {
          category: string
          created_at: string
          description: string | null
          file_name: string
          file_path: string
          id: string
          is_active: boolean
          name: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          file_name: string
          file_path: string
          id?: string
          is_active?: boolean
          name: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          file_name?: string
          file_path?: string
          id?: string
          is_active?: boolean
          name?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      cv_job_matches: {
        Row: {
          created_at: string
          cv_id: string
          id: string
          job_id: string
          match_score: number
          matched_skills: string[] | null
          missing_skills: string[] | null
          salary_fit: string | null
        }
        Insert: {
          created_at?: string
          cv_id: string
          id?: string
          job_id: string
          match_score?: number
          matched_skills?: string[] | null
          missing_skills?: string[] | null
          salary_fit?: string | null
        }
        Update: {
          created_at?: string
          cv_id?: string
          id?: string
          job_id?: string
          match_score?: number
          matched_skills?: string[] | null
          missing_skills?: string[] | null
          salary_fit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cv_job_matches_cv_id_fkey"
            columns: ["cv_id"]
            isOneToOne: false
            referencedRelation: "cv_uploads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cv_job_matches_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      cv_uploads: {
        Row: {
          ai_score: number | null
          candidate_id: string
          created_at: string
          education_level: string | null
          experience_years: number | null
          file_name: string
          file_path: string
          id: string
          raw_analysis: Json | null
          salary_currency: string | null
          salary_max: number | null
          salary_min: number | null
          skills: string[] | null
          status: string
          summary: string | null
          updated_at: string
        }
        Insert: {
          ai_score?: number | null
          candidate_id: string
          created_at?: string
          education_level?: string | null
          experience_years?: number | null
          file_name: string
          file_path: string
          id?: string
          raw_analysis?: Json | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          skills?: string[] | null
          status?: string
          summary?: string | null
          updated_at?: string
        }
        Update: {
          ai_score?: number | null
          candidate_id?: string
          created_at?: string
          education_level?: string | null
          experience_years?: number | null
          file_name?: string
          file_path?: string
          id?: string
          raw_analysis?: Json | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          skills?: string[] | null
          status?: string
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cv_uploads_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          ai_extracted_data: Json | null
          amount: number
          category: string
          created_at: string
          currency: string
          description: string | null
          expense_date: string
          id: string
          linked_invoice_id: string | null
          receipt_file_name: string | null
          receipt_file_path: string | null
          updated_at: string
          user_id: string
          vendor_name: string | null
        }
        Insert: {
          ai_extracted_data?: Json | null
          amount?: number
          category?: string
          created_at?: string
          currency?: string
          description?: string | null
          expense_date?: string
          id?: string
          linked_invoice_id?: string | null
          receipt_file_name?: string | null
          receipt_file_path?: string | null
          updated_at?: string
          user_id: string
          vendor_name?: string | null
        }
        Update: {
          ai_extracted_data?: Json | null
          amount?: number
          category?: string
          created_at?: string
          currency?: string
          description?: string | null
          expense_date?: string
          id?: string
          linked_invoice_id?: string | null
          receipt_file_name?: string | null
          receipt_file_path?: string | null
          updated_at?: string
          user_id?: string
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_linked_invoice_id_fkey"
            columns: ["linked_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_address: string | null
          client_email: string | null
          client_name: string
          created_at: string
          currency: string
          id: string
          invoice_number: string
          items: Json
          notes: string | null
          pdf_path: string | null
          status: string
          subtotal: number
          tax_amount: number
          tax_percent: number
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          client_address?: string | null
          client_email?: string | null
          client_name: string
          created_at?: string
          currency?: string
          id?: string
          invoice_number: string
          items?: Json
          notes?: string | null
          pdf_path?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_percent?: number
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          client_address?: string | null
          client_email?: string | null
          client_name?: string
          created_at?: string
          currency?: string
          id?: string
          invoice_number?: string
          items?: Json
          notes?: string | null
          pdf_path?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_percent?: number
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      job_listings: {
        Row: {
          created_at: string
          description: string
          employer_email: string
          employer_id: string | null
          employer_name: string | null
          experience_min: number | null
          id: string
          is_active: boolean
          location: string | null
          preferred_skills: string[] | null
          remote_option: string | null
          required_skills: string[] | null
          salary_currency: string | null
          salary_max: number | null
          salary_min: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          employer_email: string
          employer_id?: string | null
          employer_name?: string | null
          experience_min?: number | null
          id?: string
          is_active?: boolean
          location?: string | null
          preferred_skills?: string[] | null
          remote_option?: string | null
          required_skills?: string[] | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          employer_email?: string
          employer_id?: string | null
          employer_name?: string | null
          experience_min?: number | null
          id?: string
          is_active?: boolean
          location?: string | null
          preferred_skills?: string[] | null
          remote_option?: string | null
          required_skills?: string[] | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          free_scans_used: number
          id: string
          is_blocked: boolean
          is_pro: boolean
          subscription_product_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          free_scans_used?: number
          id?: string
          is_blocked?: boolean
          is_pro?: boolean
          subscription_product_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          free_scans_used?: number
          id?: string
          is_blocked?: boolean
          is_pro?: boolean
          subscription_product_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recurring_invoice_templates: {
        Row: {
          bank_account: string | null
          client_address: string | null
          client_email: string | null
          client_name: string
          client_tax_id: string | null
          created_at: string
          currency: string
          id: string
          invoice_type: string
          is_active: boolean
          items: Json
          last_generated_at: string | null
          next_generate_at: string
          notes: string | null
          payment_method: string | null
          reverse_charge: boolean
          schedule_day: number
          schedule_months_interval: number
          schedule_type: string
          schedule_weekday: number | null
          seller_address: string | null
          seller_email: string | null
          seller_name: string | null
          seller_tax_id: string | null
          send_on_generate: boolean
          tax_percent: number
          template_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bank_account?: string | null
          client_address?: string | null
          client_email?: string | null
          client_name: string
          client_tax_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          invoice_type?: string
          is_active?: boolean
          items?: Json
          last_generated_at?: string | null
          next_generate_at?: string
          notes?: string | null
          payment_method?: string | null
          reverse_charge?: boolean
          schedule_day?: number
          schedule_months_interval?: number
          schedule_type?: string
          schedule_weekday?: number | null
          seller_address?: string | null
          seller_email?: string | null
          seller_name?: string | null
          seller_tax_id?: string | null
          send_on_generate?: boolean
          tax_percent?: number
          template_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bank_account?: string | null
          client_address?: string | null
          client_email?: string | null
          client_name?: string
          client_tax_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          invoice_type?: string
          is_active?: boolean
          items?: Json
          last_generated_at?: string | null
          next_generate_at?: string
          notes?: string | null
          payment_method?: string | null
          reverse_charge?: boolean
          schedule_day?: number
          schedule_months_interval?: number
          schedule_type?: string
          schedule_weekday?: number | null
          seller_address?: string | null
          seller_email?: string | null
          seller_name?: string | null
          seller_tax_id?: string | null
          send_on_generate?: boolean
          tax_percent?: number
          template_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scan_history: {
        Row: {
          clauses: Json | null
          created_at: string
          document_type: string | null
          file_name: string
          id: string
          risk_score: number | null
          summary: string | null
          user_id: string
        }
        Insert: {
          clauses?: Json | null
          created_at?: string
          document_type?: string | null
          file_name: string
          id?: string
          risk_score?: number | null
          summary?: string | null
          user_id: string
        }
        Update: {
          clauses?: Json | null
          created_at?: string
          document_type?: string | null
          file_name?: string
          id?: string
          risk_score?: number | null
          summary?: string | null
          user_id?: string
        }
        Relationships: []
      }
      shared_reports: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          is_active: boolean
          note: string | null
          recipient_email: string | null
          scan_id: string
          share_token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          note?: string | null
          recipient_email?: string | null
          scan_id: string
          share_token?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          note?: string | null
          recipient_email?: string | null
          scan_id?: string
          share_token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_reports_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scan_history"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_estimates: {
        Row: {
          ai_advice: string | null
          company_name: string
          country: string
          created_at: string
          currency: string
          deductible_expenses: number
          effective_rate: number
          estimated_tax: number
          gross_income: number
          id: string
          quarter_label: string
          tax_regime: string
          taxable_income: number
          updated_at: string
          user_id: string
          vat_amount: number
          vat_applicable: boolean
          vat_rate: number
        }
        Insert: {
          ai_advice?: string | null
          company_name: string
          country?: string
          created_at?: string
          currency?: string
          deductible_expenses?: number
          effective_rate?: number
          estimated_tax?: number
          gross_income?: number
          id?: string
          quarter_label?: string
          tax_regime?: string
          taxable_income?: number
          updated_at?: string
          user_id: string
          vat_amount?: number
          vat_applicable?: boolean
          vat_rate?: number
        }
        Update: {
          ai_advice?: string | null
          company_name?: string
          country?: string
          created_at?: string
          currency?: string
          deductible_expenses?: number
          effective_rate?: number
          estimated_tax?: number
          gross_income?: number
          id?: string
          quarter_label?: string
          tax_regime?: string
          taxable_income?: number
          updated_at?: string
          user_id?: string
          vat_amount?: number
          vat_applicable?: boolean
          vat_rate?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_templates: {
        Row: {
          created_at: string
          custom_content: string
          id: string
          template_id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_content: string
          id?: string
          template_id: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_content?: string
          id?: string
          template_id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_templates_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "contract_templates"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      reset_monthly_scan_counters: { Args: never; Returns: undefined }
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
