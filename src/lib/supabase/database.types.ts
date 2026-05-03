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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string
          country: string
          created_at: string
          full_name: string
          id: string
          is_default: boolean
          label: string
          line1: string
          line2: string | null
          phone: string | null
          postal_code: string
          user_id: string
        }
        Insert: {
          city: string
          country?: string
          created_at?: string
          full_name: string
          id?: string
          is_default?: boolean
          label?: string
          line1: string
          line2?: string | null
          phone?: string | null
          postal_code: string
          user_id: string
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          full_name?: string
          id?: string
          is_default?: boolean
          label?: string
          line1?: string
          line2?: string | null
          phone?: string | null
          postal_code?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      color_options: {
        Row: {
          created_at: string
          hex: string | null
          id: string
          in_stock: boolean
          is_active: boolean
          material_id: string | null
          name: string
        }
        Insert: {
          created_at?: string
          hex?: string | null
          id: string
          in_stock?: boolean
          is_active?: boolean
          material_id?: string | null
          name: string
        }
        Update: {
          created_at?: string
          hex?: string | null
          id?: string
          in_stock?: boolean
          is_active?: boolean
          material_id?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "color_options_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "material_options"
            referencedColumns: ["id"]
          },
        ]
      }
      deliveries: {
        Row: {
          address_id: string | null
          created_at: string
          id: string
          method: string
          notes: string | null
          order_id: string
          status: Database["public"]["Enums"]["delivery_status"]
          tracking_reference: string | null
          updated_at: string
        }
        Insert: {
          address_id?: string | null
          created_at?: string
          id?: string
          method: string
          notes?: string | null
          order_id: string
          status?: Database["public"]["Enums"]["delivery_status"]
          tracking_reference?: string | null
          updated_at?: string
        }
        Update: {
          address_id?: string | null
          created_at?: string
          id?: string
          method?: string
          notes?: string | null
          order_id?: string
          status?: Database["public"]["Enums"]["delivery_status"]
          tracking_reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      material_options: {
        Row: {
          created_at: string
          description: Json
          id: string
          is_active: boolean
          multiplier: number
          name: string
        }
        Insert: {
          created_at?: string
          description?: Json
          id: string
          is_active?: boolean
          multiplier?: number
          name: string
        }
        Update: {
          created_at?: string
          description?: Json
          id?: string
          is_active?: boolean
          multiplier?: number
          name?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          is_internal: boolean
          order_id: string | null
          project_id: string | null
          user_id: string | null
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_internal?: boolean
          order_id?: string | null
          project_id?: string | null
          user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_internal?: boolean
          order_id?: string | null
          project_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          id: string
          order_id: string
          provider: string
          provider_reference: string | null
          status: string
          amount_dkk: number
          currency: string
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          provider: string
          provider_reference?: string | null
          status?: string
          amount_dkk: number
          currency?: string
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          provider?: string
          provider_reference?: string | null
          status?: string
          amount_dkk?: number
          currency?: string
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          item_type: string
          metadata: Json
          order_id: string
          quantity: number
          title: string
          unit_price_dkk: number
        }
        Insert: {
          created_at?: string
          id?: string
          item_type: string
          metadata?: Json
          order_id: string
          quantity?: number
          title: string
          unit_price_dkk?: number
        }
        Update: {
          created_at?: string
          id?: string
          item_type?: string
          metadata?: Json
          order_id?: string
          quantity?: number
          title?: string
          unit_price_dkk?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          currency: string
          customer_email: string | null
          id: string
          project_id: string | null
          quote_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          total_dkk: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          currency?: string
          customer_email?: string | null
          id?: string
          project_id?: string | null
          quote_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_dkk?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          currency?: string
          customer_email?: string | null
          id?: string
          project_id?: string | null
          quote_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_dkk?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      print_jobs: {
        Row: {
          actual_minutes: number | null
          color: string | null
          created_at: string
          estimated_minutes: number | null
          failure_reason: string | null
          id: string
          material_id: string | null
          order_id: string | null
          printer_name: string | null
          project_id: string | null
          status: Database["public"]["Enums"]["print_job_status"]
          updated_at: string
        }
        Insert: {
          actual_minutes?: number | null
          color?: string | null
          created_at?: string
          estimated_minutes?: number | null
          failure_reason?: string | null
          id?: string
          material_id?: string | null
          order_id?: string | null
          printer_name?: string | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["print_job_status"]
          updated_at?: string
        }
        Update: {
          actual_minutes?: number | null
          color?: string | null
          created_at?: string
          estimated_minutes?: number | null
          failure_reason?: string | null
          id?: string
          material_id?: string | null
          order_id?: string | null
          printer_name?: string | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["print_job_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "print_jobs_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "material_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "print_jobs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "print_jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          base_price_dkk: number
          category: string | null
          created_at: string
          description: Json
          id: string
          image_path: string | null
          is_active: boolean
          metadata: Json
          name: Json
          slug: string
          updated_at: string
        }
        Insert: {
          base_price_dkk: number
          category?: string | null
          created_at?: string
          description?: Json
          id?: string
          image_path?: string | null
          is_active?: boolean
          metadata?: Json
          name: Json
          slug: string
          updated_at?: string
        }
        Update: {
          base_price_dkk?: number
          category?: string | null
          created_at?: string
          description?: Json
          id?: string
          image_path?: string | null
          is_active?: boolean
          metadata?: Json
          name?: Json
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string
          customer_type: Database["public"]["Enums"]["customer_type"]
          cvr: string | null
          ean: string | null
          email: string | null
          full_name: string | null
          id: string
          invoice_email: string | null
          is_admin: boolean
          phone: string | null
          preferred_locale: string
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          customer_type?: Database["public"]["Enums"]["customer_type"]
          cvr?: string | null
          ean?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          invoice_email?: string | null
          is_admin?: boolean
          phone?: string | null
          preferred_locale?: string
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          customer_type?: Database["public"]["Enums"]["customer_type"]
          cvr?: string | null
          ean?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          invoice_email?: string | null
          is_admin?: boolean
          phone?: string | null
          preferred_locale?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_files: {
        Row: {
          bucket: string
          created_at: string
          id: string
          metadata: Json
          mime_type: string | null
          original_name: string
          path: string
          project_id: string
          role: Database["public"]["Enums"]["file_role"]
          size_bytes: number
          storage_provider: string
          user_id: string | null
        }
        Insert: {
          bucket: string
          created_at?: string
          id?: string
          metadata?: Json
          mime_type?: string | null
          original_name: string
          path: string
          project_id: string
          role?: Database["public"]["Enums"]["file_role"]
          size_bytes: number
          storage_provider?: string
          user_id?: string | null
        }
        Update: {
          bucket?: string
          created_at?: string
          id?: string
          metadata?: Json
          mime_type?: string | null
          original_name?: string
          path?: string
          project_id?: string
          role?: Database["public"]["Enums"]["file_role"]
          size_bytes?: number
          storage_provider?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_files_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          delivery_method: string | null
          estimate_high_dkk: number | null
          estimate_low_dkk: number | null
          id: string
          metadata: Json
          notes: string | null
          quantity: number
          selected_color: string | null
          selected_material: string | null
          selected_quality: string | null
          status: Database["public"]["Enums"]["project_status"]
          title: string | null
          type: Database["public"]["Enums"]["project_type"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          delivery_method?: string | null
          estimate_high_dkk?: number | null
          estimate_low_dkk?: number | null
          id?: string
          metadata?: Json
          notes?: string | null
          quantity?: number
          selected_color?: string | null
          selected_material?: string | null
          selected_quality?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          title?: string | null
          type: Database["public"]["Enums"]["project_type"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          delivery_method?: string | null
          estimate_high_dkk?: number | null
          estimate_low_dkk?: number | null
          id?: string
          metadata?: Json
          notes?: string | null
          quantity?: number
          selected_color?: string | null
          selected_material?: string | null
          selected_quality?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          title?: string | null
          type?: Database["public"]["Enums"]["project_type"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_selected_material_fkey"
            columns: ["selected_material"]
            isOneToOne: false
            referencedRelation: "material_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          admin_notes: string | null
          amount_dkk: number
          created_at: string
          created_by: string | null
          currency: string
          customer_notes: string | null
          expected_completion_at: string | null
          expires_at: string | null
          id: string
          project_id: string
          status: Database["public"]["Enums"]["quote_status"]
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          amount_dkk: number
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_notes?: string | null
          expected_completion_at?: string | null
          expires_at?: string | null
          id?: string
          project_id: string
          status?: Database["public"]["Enums"]["quote_status"]
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          amount_dkk?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_notes?: string | null
          expected_completion_at?: string | null
          expires_at?: string | null
          id?: string
          project_id?: string
          status?: Database["public"]["Enums"]["quote_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_is_admin: { Args: never; Returns: boolean }
      set_default_address: { Args: { p_address_id: string }; Returns: void }
    }
    Enums: {
      customer_type: "private" | "business"
      delivery_status:
        | "not_required"
        | "pickup_ready"
        | "out_for_delivery"
        | "shipped"
        | "delivered"
        | "failed"
      file_role:
        | "original_upload"
        | "reference_image"
        | "generated_model"
        | "repaired_model"
        | "sliced_file"
        | "preview_image"
        | "final_photo"
      order_status:
        | "pending_payment"
        | "paid"
        | "in_production"
        | "ready"
        | "fulfilled"
        | "refunded"
        | "cancelled"
      print_job_status:
        | "queued"
        | "printing"
        | "post_processing"
        | "ready"
        | "failed"
        | "reprinting"
        | "done"
      project_status:
        | "draft"
        | "uploaded"
        | "needs_review"
        | "quoted"
        | "approved"
        | "in_production"
        | "completed"
        | "cancelled"
      project_type:
        | "print_existing_model"
        | "image_to_model"
        | "text_to_model"
        | "custom_design"
        | "product_customization"
        | "business_batch"
      quote_status:
        | "draft"
        | "sent"
        | "accepted"
        | "declined"
        | "expired"
        | "cancelled"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      customer_type: ["private", "business"],
      delivery_status: [
        "not_required",
        "pickup_ready",
        "out_for_delivery",
        "shipped",
        "delivered",
        "failed",
      ],
      file_role: [
        "original_upload",
        "reference_image",
        "generated_model",
        "repaired_model",
        "sliced_file",
        "preview_image",
        "final_photo",
      ],
      order_status: [
        "pending_payment",
        "paid",
        "in_production",
        "ready",
        "fulfilled",
        "refunded",
        "cancelled",
      ],
      print_job_status: [
        "queued",
        "printing",
        "post_processing",
        "ready",
        "failed",
        "reprinting",
        "done",
      ],
      project_status: [
        "draft",
        "uploaded",
        "needs_review",
        "quoted",
        "approved",
        "in_production",
        "completed",
        "cancelled",
      ],
      project_type: [
        "print_existing_model",
        "image_to_model",
        "text_to_model",
        "custom_design",
        "product_customization",
        "business_batch",
      ],
      quote_status: [
        "draft",
        "sent",
        "accepted",
        "declined",
        "expired",
        "cancelled",
      ],
    },
  },
} as const
