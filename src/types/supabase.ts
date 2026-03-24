// Tipos gerados automaticamente pelo Supabase
// Para regenerar: npx supabase gen types typescript --project-id blietvjzchjrzbmkitha > src/types/supabase.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          first_name: string
          last_name: string
          phone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          first_name: string
          last_name: string
          phone: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          phone?: string
          created_at?: string
          updated_at?: string
        }
      }
      obras: {
        Row: {
          id: string
          user_id: string
          nome: string
          nome_cliente: string | null
          tipo: 'construcao' | 'reforma'
          area: number
          localizacao: Json
          orcamento: number | null
          valor_contratado: number | null
          data_inicio: string | null
          data_termino: string | null
          criada_em: string
          atualizada_em: string
        }
        Insert: {
          id?: string
          user_id: string
          nome: string
          nome_cliente?: string | null
          tipo: 'construcao' | 'reforma'
          area: number
          localizacao: Json
          orcamento?: number | null
          valor_contratado?: number | null
          data_inicio?: string | null
          data_termino?: string | null
          criada_em?: string
          atualizada_em?: string
        }
        Update: {
          id?: string
          user_id?: string
          nome?: string
          nome_cliente?: string | null
          tipo?: 'construcao' | 'reforma'
          area?: number
          localizacao?: Json
          orcamento?: number | null
          valor_contratado?: number | null
          data_inicio?: string | null
          data_termino?: string | null
          criada_em?: string
          atualizada_em?: string
        }
      }
      despesas: {
        Row: {
          id: string
          user_id: string
          obra_id: string
          descricao: string
          valor: number
          categoria: string
          data: string
          forma_pagamento: string | null
          profissional_id: string | null
          observacao: string | null
          criada_em: string
          atualizada_em: string
        }
        Insert: {
          id?: string
          user_id: string
          obra_id: string
          descricao: string
          valor: number
          categoria: string
          data: string
          forma_pagamento?: string | null
          profissional_id?: string | null
          observacao?: string | null
          criada_em?: string
          atualizada_em?: string
        }
        Update: {
          id?: string
          user_id?: string
          obra_id?: string
          descricao?: string
          valor?: number
          categoria?: string
          data?: string
          forma_pagamento?: string | null
          profissional_id?: string | null
          observacao?: string | null
          criada_em?: string
          atualizada_em?: string
        }
      }
      profissionais: {
        Row: {
          id: string
          user_id: string
          obra_id: string
          nome: string
          funcao: string
          telefone: string | null
          email: string | null
          cpf: string | null
          observacoes: string | null
          criado_em: string
          atualizado_em: string
        }
        Insert: {
          id?: string
          user_id: string
          obra_id: string
          nome: string
          funcao: string
          telefone?: string | null
          email?: string | null
          cpf?: string | null
          observacoes?: string | null
          criado_em?: string
          atualizado_em?: string
        }
        Update: {
          id?: string
          user_id?: string
          obra_id?: string
          nome?: string
          funcao?: string
          telefone?: string | null
          email?: string | null
          cpf?: string | null
          observacoes?: string | null
          criado_em?: string
          atualizado_em?: string
        }
      }
      pagamentos: {
        Row: {
          id: string
          user_id: string
          obra_id: string
          profissional_id: string
          valor: number
          data: string
          forma_pagamento: string
          observacao: string | null
          criado_em: string
          atualizado_em: string
        }
        Insert: {
          id?: string
          user_id: string
          obra_id: string
          profissional_id: string
          valor: number
          data: string
          forma_pagamento: string
          observacao?: string | null
          criado_em?: string
          atualizado_em?: string
        }
        Update: {
          id?: string
          user_id?: string
          obra_id?: string
          profissional_id?: string
          valor?: number
          data?: string
          forma_pagamento?: string
          observacao?: string | null
          criado_em?: string
          atualizado_em?: string
        }
      }
      recebimentos: {
        Row: {
          id: string
          user_id: string
          obra_id: string
          valor: number
          data: string
          forma_pagamento: string
          observacao: string | null
          criado_em: string
        }
        Insert: {
          id?: string
          user_id: string
          obra_id: string
          valor: number
          data: string
          forma_pagamento: string
          observacao?: string | null
          criado_em?: string
        }
        Update: {
          id?: string
          user_id?: string
          obra_id?: string
          valor?: number
          data?: string
          forma_pagamento?: string
          observacao?: string | null
          criado_em?: string
        }
      }
    }
    Views: {
      // Suas views aqui
    }
    Functions: {
      // Suas functions aqui
    }
    Enums: {
      // Seus enums aqui
    }
  }
}
