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
      admin_trials: {
        Row: {
          code: string
          created_at: string | null
          days: number
          email: string | null
          expires_at: string | null
          id: string
          label: string | null
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code?: string
          created_at?: string | null
          days?: number
          email?: string | null
          expires_at?: string | null
          id?: string
          label?: string | null
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          days?: number
          email?: string | null
          expires_at?: string | null
          id?: string
          label?: string | null
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      clientes: {
        Row: {
          contrato_url: string | null
          contrato_valor: number | null
          criada_em: string | null
          id: string
          nome: string
          obra_id: string | null
          observacoes: string | null
          user_id: string | null
        }
        Insert: {
          contrato_url?: string | null
          contrato_valor?: number | null
          criada_em?: string | null
          id?: string
          nome: string
          obra_id?: string | null
          observacoes?: string | null
          user_id?: string | null
        }
        Update: {
          contrato_url?: string | null
          contrato_valor?: number | null
          criada_em?: string | null
          id?: string
          nome?: string
          obra_id?: string | null
          observacoes?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      despesas: {
        Row: {
          anexo: string | null
          atualizada_em: string | null
          atualizado_em: string | null
          categoria: string
          criada_em: string | null
          data: string
          descricao: string
          forma_pagamento: string | null
          fornecedor: string | null
          id: string
          obra_id: string
          observacao: string | null
          profissional_id: string | null
          updated_at: string | null
          user_id: string
          valor: number
        }
        Insert: {
          anexo?: string | null
          atualizada_em?: string | null
          atualizado_em?: string | null
          categoria: string
          criada_em?: string | null
          data: string
          descricao: string
          forma_pagamento?: string | null
          fornecedor?: string | null
          id?: string
          obra_id: string
          observacao?: string | null
          profissional_id?: string | null
          updated_at?: string | null
          user_id: string
          valor: number
        }
        Update: {
          anexo?: string | null
          atualizada_em?: string | null
          atualizado_em?: string | null
          categoria?: string
          criada_em?: string | null
          data?: string
          descricao?: string
          forma_pagamento?: string | null
          fornecedor?: string | null
          id?: string
          obra_id?: string
          observacao?: string | null
          profissional_id?: string | null
          updated_at?: string | null
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "despesas_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      diario_obra: {
        Row: {
          atualizado_em: string | null
          criado_em: string | null
          data_registro: string
          descricao: string | null
          foto_url: string
          id: string
          obra_id: string
          user_id: string
        }
        Insert: {
          atualizado_em?: string | null
          criado_em?: string | null
          data_registro?: string
          descricao?: string | null
          foto_url: string
          id?: string
          obra_id: string
          user_id: string
        }
        Update: {
          atualizado_em?: string | null
          criado_em?: string | null
          data_registro?: string
          descricao?: string | null
          foto_url?: string
          id?: string
          obra_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diario_obra_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      obras: {
        Row: {
          area: number
          atualizada_em: string | null
          atualizado_em: string | null
          criada_em: string | null
          data_inicio: string | null
          data_termino: string | null
          id: string
          localizacao: Json
          nome: string
          nome_cliente: string | null
          orcamento: number | null
          tipo: string
          updated_at: string | null
          user_id: string
          valor_contratado: number | null
        }
        Insert: {
          area: number
          atualizada_em?: string | null
          atualizado_em?: string | null
          criada_em?: string | null
          data_inicio?: string | null
          data_termino?: string | null
          id?: string
          localizacao: Json
          nome: string
          nome_cliente?: string | null
          orcamento?: number | null
          tipo: string
          updated_at?: string | null
          user_id: string
          valor_contratado?: number | null
        }
        Update: {
          area?: number
          atualizada_em?: string | null
          atualizado_em?: string | null
          criada_em?: string | null
          data_inicio?: string | null
          data_termino?: string | null
          id?: string
          localizacao?: Json
          nome?: string
          nome_cliente?: string | null
          orcamento?: number | null
          tipo?: string
          updated_at?: string | null
          user_id?: string
          valor_contratado?: number | null
        }
        Relationships: []
      }
      pagamentos: {
        Row: {
          atualizada_em: string | null
          atualizado_em: string | null
          comprovante_url: string | null
          criada_em: string | null
          data: string
          data_pagamento: string | null
          forma_pagamento: string
          id: string
          obra_id: string
          observacao: string | null
          profissional_id: string
          updated_at: string | null
          user_id: string
          valor: number
        }
        Insert: {
          atualizada_em?: string | null
          atualizado_em?: string | null
          comprovante_url?: string | null
          criada_em?: string | null
          data: string
          data_pagamento?: string | null
          forma_pagamento: string
          id?: string
          obra_id: string
          observacao?: string | null
          profissional_id: string
          updated_at?: string | null
          user_id: string
          valor: number
        }
        Update: {
          atualizada_em?: string | null
          atualizado_em?: string | null
          comprovante_url?: string | null
          criada_em?: string | null
          data?: string
          data_pagamento?: string | null
          forma_pagamento?: string
          id?: string
          obra_id?: string
          observacao?: string | null
          profissional_id?: string
          updated_at?: string | null
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
        ]
      }
      profissionais: {
        Row: {
          atualizado_em: string | null
          contrato: Json | null
          cpf: string | null
          criada_em: string | null
          data_inicio: string | null
          data_termino: string | null
          email: string | null
          funcao: string
          id: string
          nome: string
          obra_id: string
          observacoes: string | null
          telefone: string | null
          tipo_contrato: string | null
          updated_at: string | null
          user_id: string
          valor_combinado: number | null
          valor_previsto: number | null
        }
        Insert: {
          atualizado_em?: string | null
          contrato?: Json | null
          cpf?: string | null
          criada_em?: string | null
          data_inicio?: string | null
          data_termino?: string | null
          email?: string | null
          funcao: string
          id?: string
          nome: string
          obra_id: string
          observacoes?: string | null
          telefone?: string | null
          tipo_contrato?: string | null
          updated_at?: string | null
          user_id: string
          valor_combinado?: number | null
          valor_previsto?: number | null
        }
        Update: {
          atualizado_em?: string | null
          contrato?: Json | null
          cpf?: string | null
          criada_em?: string | null
          data_inicio?: string | null
          data_termino?: string | null
          email?: string | null
          funcao?: string
          id?: string
          nome?: string
          obra_id?: string
          observacoes?: string | null
          telefone?: string | null
          tipo_contrato?: string | null
          updated_at?: string | null
          user_id?: string
          valor_combinado?: number | null
          valor_previsto?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profissionais_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      recebimentos: {
        Row: {
          atualizada_em: string | null
          atualizado_em: string | null
          cliente_id: string | null
          comprovante_url: string | null
          criada_em: string | null
          data: string
          forma_pagamento: string
          id: string
          obra_id: string
          observacao: string | null
          updated_at: string | null
          user_id: string
          valor: number
        }
        Insert: {
          atualizada_em?: string | null
          atualizado_em?: string | null
          cliente_id?: string | null
          comprovante_url?: string | null
          criada_em?: string | null
          data: string
          forma_pagamento: string
          id?: string
          obra_id: string
          observacao?: string | null
          updated_at?: string | null
          user_id: string
          valor: number
        }
        Update: {
          atualizada_em?: string | null
          atualizado_em?: string | null
          cliente_id?: string | null
          comprovante_url?: string | null
          criada_em?: string | null
          data?: string
          forma_pagamento?: string
          id?: string
          obra_id?: string
          observacao?: string | null
          updated_at?: string | null
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "recebimentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recebimentos_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_history: {
        Row: {
          created_at: string | null
          id: string
          motivo: string | null
          plano_anterior: string | null
          plano_novo: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          motivo?: string | null
          plano_anterior?: string | null
          plano_novo: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          motivo?: string | null
          plano_anterior?: string | null
          plano_novo?: string
          user_id?: string
        }
        Relationships: []
      }
      user_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      guru_webhook_logs: {
        Row: {
          id: string
          webhook_type: string
          guru_id: string
          status_received: string
          raw_payload: Json | null
          processed_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          webhook_type: string
          guru_id: string
          status_received: string
          raw_payload?: Json | null
          processed_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          webhook_type?: string
          guru_id?: string
          status_received?: string
          raw_payload?: Json | null
          processed_at?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          billing_cycle: string | null
          cancelled_at: string | null
          converted_at: string | null
          created_at: string | null
          current_cycle: number | null
          cycle_end_date: string | null
          cycle_start_date: string | null
          first_name: string
          guru_offer_id: string | null
          guru_subscription_id: string | null
          id: string
          last_active_at: string | null
          last_name: string
          lead_source: string | null
          next_cycle_at: string | null
          overdue_since: string | null
          payment_method: string | null
          phone: string
          pix_expires_at: string | null
          plano: string | null
          plano_expira_em: string | null
          profile_type: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          billing_cycle?: string | null
          cancelled_at?: string | null
          converted_at?: string | null
          created_at?: string | null
          current_cycle?: number | null
          cycle_end_date?: string | null
          cycle_start_date?: string | null
          first_name: string
          guru_offer_id?: string | null
          guru_subscription_id?: string | null
          id: string
          last_active_at?: string | null
          last_name: string
          lead_source?: string | null
          next_cycle_at?: string | null
          overdue_since?: string | null
          payment_method?: string | null
          phone: string
          pix_expires_at?: string | null
          plano?: string | null
          plano_expira_em?: string | null
          profile_type?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          billing_cycle?: string | null
          cancelled_at?: string | null
          converted_at?: string | null
          created_at?: string | null
          current_cycle?: number | null
          cycle_end_date?: string | null
          cycle_start_date?: string | null
          first_name?: string
          guru_offer_id?: string | null
          guru_subscription_id?: string | null
          id?: string
          last_active_at?: string | null
          last_name?: string
          lead_source?: string | null
          next_cycle_at?: string | null
          overdue_since?: string | null
          payment_method?: string | null
          phone?: string
          pix_expires_at?: string | null
          plano?: string | null
          plano_expira_em?: string | null
          profile_type?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
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
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
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
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
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
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof Database
}
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
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof Database
}
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
