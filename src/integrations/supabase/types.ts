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
      acc_accounts: {
        Row: {
          balance: number | null
          code: string
          company_id: string | null
          created_at: string
          id: string
          name: string
          parent_id: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number | null
          code: string
          company_id?: string | null
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number | null
          code?: string
          company_id?: string | null
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "acc_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "acc_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      acc_expenses: {
        Row: {
          account_id: string | null
          amount: number
          category: string | null
          company_id: string | null
          created_at: string
          description: string | null
          expense_date: string
          id: string
          receipt_url: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount?: number
          category?: string | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          expense_date?: string
          id?: string
          receipt_url?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          category?: string | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          expense_date?: string
          id?: string
          receipt_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "acc_expenses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "acc_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_expenses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      acc_invoice_items: {
        Row: {
          amount: number | null
          cost_price: number | null
          description: string
          id: string
          invoice_id: string
          quantity: number | null
          unit_price: number | null
        }
        Insert: {
          amount?: number | null
          cost_price?: number | null
          description: string
          id?: string
          invoice_id: string
          quantity?: number | null
          unit_price?: number | null
        }
        Update: {
          amount?: number | null
          cost_price?: number | null
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "acc_invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "acc_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      acc_invoices: {
        Row: {
          company_id: string | null
          contact_id: string | null
          created_at: string
          due_date: string | null
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          sales_commission_amount: number | null
          sales_commission_pct: number | null
          salesperson_id: string | null
          status: string
          total: number | null
          total_cost: number | null
          total_margin: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_number: string
          issue_date?: string
          notes?: string | null
          sales_commission_amount?: number | null
          sales_commission_pct?: number | null
          salesperson_id?: string | null
          status?: string
          total?: number | null
          total_cost?: number | null
          total_margin?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          sales_commission_amount?: number | null
          sales_commission_pct?: number | null
          salesperson_id?: string | null
          status?: string
          total?: number | null
          total_cost?: number | null
          total_margin?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "acc_invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_invoices_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_invoices_salesperson_id_fkey"
            columns: ["salesperson_id"]
            isOneToOne: false
            referencedRelation: "hrm_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      acc_journal_entries: {
        Row: {
          company_id: string | null
          created_at: string
          description: string | null
          entry_date: string
          id: string
          reference: string | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          entry_date?: string
          id?: string
          reference?: string | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          entry_date?: string
          id?: string
          reference?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "acc_journal_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      acc_journal_lines: {
        Row: {
          account_id: string
          credit: number | null
          debit: number | null
          description: string | null
          entry_id: string
          id: string
        }
        Insert: {
          account_id: string
          credit?: number | null
          debit?: number | null
          description?: string | null
          entry_id: string
          id?: string
        }
        Update: {
          account_id?: string
          credit?: number | null
          debit?: number | null
          description?: string | null
          entry_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "acc_journal_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "acc_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_journal_lines_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "acc_journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      adm_calendar_events: {
        Row: {
          all_day: boolean
          color: string | null
          company_id: string
          created_at: string
          description: string | null
          end_time: string | null
          event_type: string
          id: string
          location: string | null
          source_id: string | null
          source_module: string | null
          start_time: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          all_day?: boolean
          color?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_type?: string
          id?: string
          location?: string | null
          source_id?: string | null
          source_module?: string | null
          start_time: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          all_day?: boolean
          color?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_type?: string
          id?: string
          location?: string | null
          source_id?: string | null
          source_module?: string | null
          start_time?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "adm_calendar_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      adm_documents: {
        Row: {
          category: string
          company_id: string
          created_at: string
          description: string | null
          document_number: string
          file_name: string | null
          file_size_bytes: number | null
          file_url: string | null
          id: string
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          company_id: string
          created_at?: string
          description?: string | null
          document_number: string
          file_name?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          id?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          company_id?: string
          created_at?: string
          description?: string | null
          document_number?: string
          file_name?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          id?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "adm_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_action_requests: {
        Row: {
          action_type: string
          created_at: string
          id: string
          payload: Json | null
          record_id: string | null
          requester_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          status: string
          table_name: string | null
          target_user_id: string
          updated_at: string
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          payload?: Json | null
          record_id?: string | null
          requester_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: string
          table_name?: string | null
          target_user_id: string
          updated_at?: string
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          payload?: Json | null
          record_id?: string | null
          requester_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: string
          table_name?: string | null
          target_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      alerts: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          reference_id: string | null
          severity: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          reference_id?: string | null
          severity?: string | null
          title: string
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          reference_id?: string | null
          severity?: string | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          scopes: string[] | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          scopes?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          scopes?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      app_32e4968292_credit_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      app_32e4968292_credits: {
        Row: {
          balance: number | null
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      app_32e4968292_hiring_candidates: {
        Row: {
          created_at: string
          id: string
          match_score: number | null
          request_id: string
          status: string
          talent_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_score?: number | null
          request_id: string
          status?: string
          talent_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          match_score?: number | null
          request_id?: string
          status?: string
          talent_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_32e4968292_hiring_candidates_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "app_32e4968292_hiring_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_32e4968292_hiring_candidates_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "app_32e4968292_talents"
            referencedColumns: ["id"]
          },
        ]
      }
      app_32e4968292_hiring_requests: {
        Row: {
          client_id: string
          created_at: string
          credit_cost: number
          deadline: string | null
          description: string | null
          experience_max: number | null
          experience_min: number | null
          id: string
          required_skills: string[] | null
          sla_type: string
          status: string
          team_size: number | null
          title: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          credit_cost?: number
          deadline?: string | null
          description?: string | null
          experience_max?: number | null
          experience_min?: number | null
          id?: string
          required_skills?: string[] | null
          sla_type?: string
          status?: string
          team_size?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          credit_cost?: number
          deadline?: string | null
          description?: string | null
          experience_max?: number | null
          experience_min?: number | null
          id?: string
          required_skills?: string[] | null
          sla_type?: string
          status?: string
          team_size?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_32e4968292_profiles: {
        Row: {
          avatar_url: string | null
          company_name: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id: string
          role?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_32e4968292_shortage_alerts: {
        Row: {
          action_taken: string | null
          created_at: string
          id: string
          request_id: string
          resolved_at: string | null
          severity: string
          skill: string
          status: string
        }
        Insert: {
          action_taken?: string | null
          created_at?: string
          id?: string
          request_id: string
          resolved_at?: string | null
          severity?: string
          skill: string
          status?: string
        }
        Update: {
          action_taken?: string | null
          created_at?: string
          id?: string
          request_id?: string
          resolved_at?: string | null
          severity?: string
          skill?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_32e4968292_shortage_alerts_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "app_32e4968292_hiring_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      app_32e4968292_talents: {
        Row: {
          availability: string
          bio: string | null
          certifications: string[] | null
          created_at: string
          experience_years: number | null
          id: string
          job_matching_score: number | null
          location: string | null
          performance_score: number | null
          salary_expectation: number | null
          skill_score: number | null
          skills: string[] | null
          training_completed: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          availability?: string
          bio?: string | null
          certifications?: string[] | null
          created_at?: string
          experience_years?: number | null
          id?: string
          job_matching_score?: number | null
          location?: string | null
          performance_score?: number | null
          salary_expectation?: number | null
          skill_score?: number | null
          skills?: string[] | null
          training_completed?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          availability?: string
          bio?: string | null
          certifications?: string[] | null
          created_at?: string
          experience_years?: number | null
          id?: string
          job_matching_score?: number | null
          location?: string | null
          performance_score?: number | null
          salary_expectation?: number | null
          skill_score?: number | null
          skills?: string[] | null
          training_completed?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      app_32e4968292_training_programs: {
        Row: {
          created_at: string
          description: string | null
          duration_days: number | null
          id: string
          is_active: boolean | null
          provider: string
          skills: string[] | null
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_days?: number | null
          id?: string
          is_active?: boolean | null
          provider: string
          skills?: string[] | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_days?: number | null
          id?: string
          is_active?: boolean | null
          provider?: string
          skills?: string[] | null
          title?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          description: string | null
          key: string
          label: string | null
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          description?: string | null
          key: string
          label?: string | null
          updated_at?: string
          updated_by?: string | null
          value: string
        }
        Update: {
          description?: string | null
          key?: string
          label?: string | null
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      article_purchases: {
        Row: {
          amount: number
          article_id: string
          currency: string
          id: string
          purchased_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          article_id: string
          currency?: string
          id?: string
          purchased_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          article_id?: string
          currency?: string
          id?: string
          purchased_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_purchases_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          author: string | null
          category: string
          content: string | null
          created_at: string
          currency: string
          date: string
          description: string
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          mini_viz: string | null
          price_cents: number
          read_time: string | null
          slug: string
          sort_order: number | null
          span: number | null
          stat: string | null
          stat_label: string | null
          thumbnail_url: string | null
          title: string
          trend: string | null
          trend_value: string | null
          updated_at: string
          viz_data: number[] | null
        }
        Insert: {
          author?: string | null
          category?: string
          content?: string | null
          created_at?: string
          currency?: string
          date: string
          description: string
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          mini_viz?: string | null
          price_cents?: number
          read_time?: string | null
          slug: string
          sort_order?: number | null
          span?: number | null
          stat?: string | null
          stat_label?: string | null
          thumbnail_url?: string | null
          title: string
          trend?: string | null
          trend_value?: string | null
          updated_at?: string
          viz_data?: number[] | null
        }
        Update: {
          author?: string | null
          category?: string
          content?: string | null
          created_at?: string
          currency?: string
          date?: string
          description?: string
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          mini_viz?: string | null
          price_cents?: number
          read_time?: string | null
          slug?: string
          sort_order?: number | null
          span?: number | null
          stat?: string | null
          stat_label?: string | null
          thumbnail_url?: string | null
          title?: string
          trend?: string | null
          trend_value?: string | null
          updated_at?: string
          viz_data?: number[] | null
        }
        Relationships: []
      }
      assessment_answers: {
        Row: {
          attempt_id: string
          created_at: string
          id: string
          is_correct: boolean | null
          points_earned: number | null
          question_id: string
          selected_answer: string | null
        }
        Insert: {
          attempt_id: string
          created_at?: string
          id?: string
          is_correct?: boolean | null
          points_earned?: number | null
          question_id: string
          selected_answer?: string | null
        }
        Update: {
          attempt_id?: string
          created_at?: string
          id?: string
          is_correct?: boolean | null
          points_earned?: number | null
          question_id?: string
          selected_answer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "assessment_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "assessment_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_attempts: {
        Row: {
          completed_at: string | null
          created_at: string
          earned_points: number | null
          id: string
          score: number | null
          started_at: string
          status: string
          test_id: string
          total_points: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          earned_points?: number | null
          id?: string
          score?: number | null
          started_at?: string
          status?: string
          test_id: string
          total_points?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          earned_points?: number | null
          id?: string
          score?: number | null
          started_at?: string
          status?: string
          test_id?: string
          total_points?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_attempts_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "competency_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_evidence: {
        Row: {
          created_at: string
          description: string | null
          file_name: string
          file_url: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          status: string
          test_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_name: string
          file_url: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: string
          test_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_name?: string
          file_url?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: string
          test_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_evidence_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "competency_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_orders: {
        Row: {
          admin_notes: string | null
          amount: number
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          currency: string
          id: string
          order_number: string
          payment_proof_url: string | null
          status: string
          test_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount?: number
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          currency?: string
          id?: string
          order_number?: string
          payment_proof_url?: string | null
          status?: string
          test_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          currency?: string
          id?: string
          order_number?: string
          payment_proof_url?: string | null
          status?: string
          test_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_orders_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "competency_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_questions: {
        Row: {
          correct_answer: string | null
          created_at: string
          id: string
          options: Json
          points: number
          question_text: string
          question_type: string
          skill_category: string | null
          sort_order: number
          test_id: string
        }
        Insert: {
          correct_answer?: string | null
          created_at?: string
          id?: string
          options?: Json
          points?: number
          question_text: string
          question_type?: string
          skill_category?: string | null
          sort_order?: number
          test_id: string
        }
        Update: {
          correct_answer?: string | null
          created_at?: string
          id?: string
          options?: Json
          points?: number
          question_text?: string
          question_type?: string
          skill_category?: string | null
          sort_order?: number
          test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_questions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "competency_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      author_profiles: {
        Row: {
          articles_count: number | null
          avatar_url: string | null
          bio: string
          created_at: string
          expertise: string[]
          id: string
          name: string
          role: string
          updated_at: string
        }
        Insert: {
          articles_count?: number | null
          avatar_url?: string | null
          bio: string
          created_at?: string
          expertise?: string[]
          id?: string
          name: string
          role: string
          updated_at?: string
        }
        Update: {
          articles_count?: number | null
          avatar_url?: string | null
          bio?: string
          created_at?: string
          expertise?: string[]
          id?: string
          name?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      blacklisted_emails: {
        Row: {
          blacklisted_at: string
          created_at: string
          email: string
          id: string
          reason: string | null
        }
        Insert: {
          blacklisted_at?: string
          created_at?: string
          email: string
          id?: string
          reason?: string | null
        }
        Update: {
          blacklisted_at?: string
          created_at?: string
          email?: string
          id?: string
          reason?: string | null
        }
        Relationships: []
      }
      business_claim_proofs: {
        Row: {
          claim_id: string
          created_at: string
          document_type: string
          file_name: string
          file_url: string
          id: string
          is_required: boolean
        }
        Insert: {
          claim_id: string
          created_at?: string
          document_type: string
          file_name: string
          file_url: string
          id?: string
          is_required?: boolean
        }
        Update: {
          claim_id?: string
          created_at?: string
          document_type?: string
          file_name?: string
          file_url?: string
          id?: string
          is_required?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "business_claim_proofs_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "business_claims"
            referencedColumns: ["id"]
          },
        ]
      }
      business_claims: {
        Row: {
          admin_notes: string | null
          business_id: string
          created_at: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          business_id: string
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          business_id?: string
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_claims_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_documents: {
        Row: {
          business_id: string
          created_at: string
          document_label: string | null
          document_type: string
          file_name: string
          file_size_bytes: number | null
          file_url: string
          id: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          business_id: string
          created_at?: string
          document_label?: string | null
          document_type: string
          file_name: string
          file_size_bytes?: number | null
          file_url: string
          id?: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          business_id?: string
          created_at?: string
          document_label?: string | null
          document_type?: string
          file_name?: string
          file_size_bytes?: number | null
          file_url?: string
          id?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_documents_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_kyc_submissions: {
        Row: {
          admin_notes: string | null
          business_id: string
          created_at: string
          id: string
          primary_doc_file_name: string
          primary_doc_file_url: string
          primary_doc_type: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_by: string
          support_doc1_file_name: string
          support_doc1_file_url: string
          support_doc1_label: string
          support_doc2_file_name: string
          support_doc2_file_url: string
          support_doc2_label: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          business_id: string
          created_at?: string
          id?: string
          primary_doc_file_name: string
          primary_doc_file_url: string
          primary_doc_type: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_by: string
          support_doc1_file_name: string
          support_doc1_file_url: string
          support_doc1_label: string
          support_doc2_file_name: string
          support_doc2_file_url: string
          support_doc2_label: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          business_id?: string
          created_at?: string
          id?: string
          primary_doc_file_name?: string
          primary_doc_file_url?: string
          primary_doc_type?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_by?: string
          support_doc1_file_name?: string
          support_doc1_file_url?: string
          support_doc1_label?: string
          support_doc2_file_name?: string
          support_doc2_file_url?: string
          support_doc2_label?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_kyc_submissions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_members: {
        Row: {
          business_id: string
          created_at: string
          id: string
          invited_by: string | null
          role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          invited_by?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          invited_by?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_members_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_profiles: {
        Row: {
          address: string | null
          akta_number: string | null
          business_type: string
          city: string | null
          company_size: string | null
          country: string | null
          created_at: string
          created_by: string
          description: string | null
          email: string | null
          facebook_url: string | null
          founded_year: number | null
          id: string
          industry: string | null
          instagram_url: string | null
          kyc_status: string
          latitude: number | null
          linkedin_url: string | null
          logo_url: string | null
          longitude: number | null
          name: string
          nib: string | null
          npwp: string | null
          oveercode: string | null
          phone: string | null
          slug: string
          twitter_url: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          akta_number?: string | null
          business_type?: string
          city?: string | null
          company_size?: string | null
          country?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          email?: string | null
          facebook_url?: string | null
          founded_year?: number | null
          id?: string
          industry?: string | null
          instagram_url?: string | null
          kyc_status?: string
          latitude?: number | null
          linkedin_url?: string | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          nib?: string | null
          npwp?: string | null
          oveercode?: string | null
          phone?: string | null
          slug: string
          twitter_url?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          akta_number?: string | null
          business_type?: string
          city?: string | null
          company_size?: string | null
          country?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          email?: string | null
          facebook_url?: string | null
          founded_year?: number | null
          id?: string
          industry?: string | null
          instagram_url?: string | null
          kyc_status?: string
          latitude?: number | null
          linkedin_url?: string | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          nib?: string | null
          npwp?: string | null
          oveercode?: string | null
          phone?: string | null
          slug?: string
          twitter_url?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      candidate_unlocks: {
        Row: {
          candidate_id: string
          company_id: string | null
          created_at: string | null
          credit_cost: number | null
          id: string
          target_user_id: string | null
          unlocked_by: string
        }
        Insert: {
          candidate_id: string
          company_id?: string | null
          created_at?: string | null
          credit_cost?: number | null
          id?: string
          target_user_id?: string | null
          unlocked_by: string
        }
        Update: {
          candidate_id?: string
          company_id?: string | null
          created_at?: string | null
          credit_cost?: number | null
          id?: string
          target_user_id?: string | null
          unlocked_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_unlocks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates_archive: {
        Row: {
          certifications: Json | null
          city: string | null
          country: string | null
          created_at: string | null
          current_company: string | null
          current_title: string | null
          education: Json | null
          email: string | null
          full_name: string
          id: string
          languages: Json | null
          nationality: string | null
          oveercode: string | null
          phone: string | null
          photo_url: string | null
          skills: string[] | null
          status: string | null
          summary: string | null
          uploaded_by: string | null
          work_experience: Json | null
          years_of_experience: number | null
        }
        Insert: {
          certifications?: Json | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          current_company?: string | null
          current_title?: string | null
          education?: Json | null
          email?: string | null
          full_name: string
          id: string
          languages?: Json | null
          nationality?: string | null
          oveercode?: string | null
          phone?: string | null
          photo_url?: string | null
          skills?: string[] | null
          status?: string | null
          summary?: string | null
          uploaded_by?: string | null
          work_experience?: Json | null
          years_of_experience?: number | null
        }
        Update: {
          certifications?: Json | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          current_company?: string | null
          current_title?: string | null
          education?: Json | null
          email?: string | null
          full_name?: string
          id?: string
          languages?: Json | null
          nationality?: string | null
          oveercode?: string | null
          phone?: string | null
          photo_url?: string | null
          skills?: string[] | null
          status?: string | null
          summary?: string | null
          uploaded_by?: string | null
          work_experience?: Json | null
          years_of_experience?: number | null
        }
        Relationships: []
      }
      career_assessment_results: {
        Row: {
          attempt_id: string | null
          career_path_id: string | null
          created_at: string
          id: string
          match_percentage: number
          recommendation: string | null
          selected_career: string
          skill_scores: Json
          user_id: string
        }
        Insert: {
          attempt_id?: string | null
          career_path_id?: string | null
          created_at?: string
          id?: string
          match_percentage?: number
          recommendation?: string | null
          selected_career: string
          skill_scores?: Json
          user_id: string
        }
        Update: {
          attempt_id?: string | null
          career_path_id?: string | null
          created_at?: string
          id?: string
          match_percentage?: number
          recommendation?: string | null
          selected_career?: string
          skill_scores?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "career_assessment_results_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "assessment_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "career_assessment_results_career_path_id_fkey"
            columns: ["career_path_id"]
            isOneToOne: false
            referencedRelation: "career_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      career_paths: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          skill_weights: Json
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          skill_weights?: Json
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          skill_weights?: Json
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      case_studies: {
        Row: {
          challenge: string | null
          client_logo_url: string | null
          company_name: string
          content: string | null
          created_at: string
          cta_label: string | null
          cta_url: string | null
          description: string | null
          id: string
          image_url: string | null
          industry: string | null
          is_active: boolean | null
          is_featured: boolean | null
          results: string | null
          slug: string
          solution: string | null
          sort_order: number | null
          testimonial_author: string | null
          testimonial_quote: string | null
          testimonial_role: string | null
          title: string
          updated_at: string
        }
        Insert: {
          challenge?: string | null
          client_logo_url?: string | null
          company_name: string
          content?: string | null
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          industry?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          results?: string | null
          slug: string
          solution?: string | null
          sort_order?: number | null
          testimonial_author?: string | null
          testimonial_quote?: string | null
          testimonial_role?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          challenge?: string | null
          client_logo_url?: string | null
          company_name?: string
          content?: string | null
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          industry?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          results?: string | null
          slug?: string
          solution?: string | null
          sort_order?: number | null
          testimonial_author?: string | null
          testimonial_quote?: string | null
          testimonial_role?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      case_study_sections: {
        Row: {
          body: string | null
          case_study_id: string
          created_at: string
          id: string
          image_url: string | null
          section_type: string
          sort_order: number
          title: string | null
        }
        Insert: {
          body?: string | null
          case_study_id: string
          created_at?: string
          id?: string
          image_url?: string | null
          section_type?: string
          sort_order?: number
          title?: string | null
        }
        Update: {
          body?: string | null
          case_study_id?: string
          created_at?: string
          id?: string
          image_url?: string | null
          section_type?: string
          sort_order?: number
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_study_sections_case_study_id_fkey"
            columns: ["case_study_id"]
            isOneToOne: false
            referencedRelation: "case_studies"
            referencedColumns: ["id"]
          },
        ]
      }
      case_study_services: {
        Row: {
          case_study_id: string
          created_at: string
          id: string
          service_id: string
        }
        Insert: {
          case_study_id: string
          created_at?: string
          id?: string
          service_id: string
        }
        Update: {
          case_study_id?: string
          created_at?: string
          id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_study_services_case_study_id_fkey"
            columns: ["case_study_id"]
            isOneToOne: false
            referencedRelation: "case_studies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_study_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          certificate_url: string | null
          certification_body: string | null
          created_at: string | null
          enrollment_id: string
          holder_name: string
          id: string
          instructor_id: string | null
          issued_at: string | null
          program_name: string
          serial_number: string
          user_id: string
        }
        Insert: {
          certificate_url?: string | null
          certification_body?: string | null
          created_at?: string | null
          enrollment_id: string
          holder_name: string
          id?: string
          instructor_id?: string | null
          issued_at?: string | null
          program_name: string
          serial_number: string
          user_id: string
        }
        Update: {
          certificate_url?: string | null
          certification_body?: string | null
          created_at?: string | null
          enrollment_id?: string
          holder_name?: string
          id?: string
          instructor_id?: string | null
          issued_at?: string | null
          program_name?: string
          serial_number?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          status: string
          updated_at: string
          user_email: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          status?: string
          updated_at?: string
          user_email?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          status?: string
          updated_at?: string
          user_email?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
          sender_type: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
          sender_type?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_profiles: {
        Row: {
          company_name: string
          company_size: string | null
          created_at: string | null
          description: string | null
          id: string
          industry: string | null
          updated_at: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          company_name: string
          company_size?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          industry?: string | null
          updated_at?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          company_name?: string
          company_size?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          industry?: string | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          address: string | null
          created_at: string
          currency: string | null
          date_format: string
          email: string | null
          id: string
          industry: string | null
          is_active: boolean
          locale: string
          logo_url: string | null
          name: string
          phone: string | null
          sales_commission_pct: number
          slug: string
          timezone: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          currency?: string | null
          date_format?: string
          email?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean
          locale?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          sales_commission_pct?: number
          slug: string
          timezone?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          currency?: string | null
          date_format?: string
          email?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean
          locale?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          sales_commission_pct?: number
          slug?: string
          timezone?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      company_credits: {
        Row: {
          balance: number
          business_id: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          balance?: number
          business_id: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          balance?: number
          business_id?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_credits_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_holidays: {
        Row: {
          company_id: string | null
          created_at: string | null
          holiday_date: string
          id: string
          is_national: boolean | null
          name: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          holiday_date: string
          id?: string
          is_national?: boolean | null
          name: string
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          holiday_date?: string
          id?: string
          is_national?: boolean | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_holidays_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_members: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["company_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["company_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["company_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_reviews: {
        Row: {
          business_id: string
          career_rating: number | null
          cons: string | null
          created_at: string
          culture_rating: number | null
          experience_id: string | null
          id: string
          is_anonymous: boolean | null
          management_rating: number | null
          overall_rating: number
          pros: string | null
          status: string
          title: string | null
          updated_at: string
          user_id: string
          worklife_rating: number | null
        }
        Insert: {
          business_id: string
          career_rating?: number | null
          cons?: string | null
          created_at?: string
          culture_rating?: number | null
          experience_id?: string | null
          id?: string
          is_anonymous?: boolean | null
          management_rating?: number | null
          overall_rating: number
          pros?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          user_id: string
          worklife_rating?: number | null
        }
        Update: {
          business_id?: string
          career_rating?: number | null
          cons?: string | null
          created_at?: string
          culture_rating?: number | null
          experience_id?: string | null
          id?: string
          is_anonymous?: boolean | null
          management_rating?: number | null
          overall_rating?: number
          pros?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string
          worklife_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "company_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_reviews_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "user_experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      competency_tests: {
        Row: {
          assessment_type: string
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          id: string
          is_active: boolean
          oveercode: string | null
          passing_score: number
          price_cents: number
          skill_name: string
          skill_weight_pct: number
          test_tier: string
          time_limit_minutes: number | null
          title: string
          total_questions: number
          updated_at: string
        }
        Insert: {
          assessment_type?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          oveercode?: string | null
          passing_score?: number
          price_cents?: number
          skill_name: string
          skill_weight_pct?: number
          test_tier?: string
          time_limit_minutes?: number | null
          title: string
          total_questions?: number
          updated_at?: string
        }
        Update: {
          assessment_type?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          oveercode?: string | null
          passing_score?: number
          price_cents?: number
          skill_name?: string
          skill_weight_pct?: number
          test_tier?: string
          time_limit_minutes?: number | null
          title?: string
          total_questions?: number
          updated_at?: string
        }
        Relationships: []
      }
      contact_inquiries: {
        Row: {
          admin_notes: string | null
          company_name: string | null
          company_size: string | null
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          service_interest: string | null
          status: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          company_name?: string | null
          company_size?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          service_interest?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          company_name?: string | null
          company_size?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          service_interest?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      content_drafts: {
        Row: {
          brand: string | null
          content: Json
          created_at: string
          id: string
          is_template: boolean
          name: string
          overlay_elements: Json
          size_id: string | null
          style: Json
          template_id: string | null
          thumbnail_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          brand?: string | null
          content?: Json
          created_at?: string
          id?: string
          is_template?: boolean
          name?: string
          overlay_elements?: Json
          size_id?: string | null
          style?: Json
          template_id?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          brand?: string | null
          content?: Json
          created_at?: string
          id?: string
          is_template?: boolean
          name?: string
          overlay_elements?: Json
          size_id?: string | null
          style?: Json
          template_id?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_balances: {
        Row: {
          balance: number
          id: string
          total_purchased: number
          total_used: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          id?: string
          total_purchased?: number
          total_used?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          id?: string
          total_purchased?: number
          total_used?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_orders: {
        Row: {
          admin_notes: string | null
          amount_cents: number
          business_id: string | null
          buyer_type: string
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          credits: number
          currency: string
          description: string | null
          id: string
          order_number: string
          package_id: string | null
          payment_proof_url: string | null
          status: string
          updated_at: string
          user_id: string
          xendit_checkout_url: string | null
          xendit_invoice_id: string | null
          xendit_paid_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          amount_cents: number
          business_id?: string | null
          buyer_type?: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          credits: number
          currency?: string
          description?: string | null
          id?: string
          order_number?: string
          package_id?: string | null
          payment_proof_url?: string | null
          status?: string
          updated_at?: string
          user_id: string
          xendit_checkout_url?: string | null
          xendit_invoice_id?: string | null
          xendit_paid_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          amount_cents?: number
          business_id?: string | null
          buyer_type?: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          credits?: number
          currency?: string
          description?: string | null
          id?: string
          order_number?: string
          package_id?: string | null
          payment_proof_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          xendit_checkout_url?: string | null
          xendit_invoice_id?: string | null
          xendit_paid_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_orders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_orders_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "credit_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_packages: {
        Row: {
          created_at: string
          credits: number
          currency: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          price_cents: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          credits: number
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          price_cents?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          credits?: number
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price_cents?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          balance_after: number
          client_id: string
          created_at: string | null
          description: string | null
          id: string
          reference_id: string | null
          type: string
        }
        Insert: {
          amount: number
          balance_after: number
          client_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          type: string
        }
        Update: {
          amount?: number
          balance_after?: number
          client_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      credits: {
        Row: {
          balance: number | null
          client_id: string
          id: string
          total_purchased: number | null
          total_spent: number | null
          updated_at: string | null
        }
        Insert: {
          balance?: number | null
          client_id: string
          id?: string
          total_purchased?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Update: {
          balance?: number | null
          client_id?: string
          id?: string
          total_purchased?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credits_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "client_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_activities: {
        Row: {
          activity_date: string
          company_id: string | null
          contact_id: string | null
          created_at: string
          deal_id: string | null
          description: string | null
          id: string
          subject: string
          type: string
          user_id: string
        }
        Insert: {
          activity_date?: string
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          deal_id?: string | null
          description?: string | null
          id?: string
          subject: string
          type?: string
          user_id: string
        }
        Update: {
          activity_date?: string
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          deal_id?: string | null
          description?: string | null
          id?: string
          subject?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_clients: {
        Row: {
          address: string | null
          company_id: string | null
          company_name: string | null
          contact_id: string | null
          created_at: string
          email: string | null
          id: string
          industry: string | null
          name: string
          notes: string | null
          phone: string | null
          source: string | null
          source_deal_id: string | null
          source_lead_id: string | null
          status: string
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          company_id?: string | null
          company_name?: string | null
          contact_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          industry?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          source?: string | null
          source_deal_id?: string | null
          source_lead_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          company_id?: string | null
          company_name?: string | null
          contact_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          industry?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          source?: string | null
          source_deal_id?: string | null
          source_lead_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_clients_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contacts: {
        Row: {
          company: string | null
          company_id: string | null
          created_at: string
          email: string | null
          id: string
          linked_business_id: string | null
          name: string
          notes: string | null
          phone: string | null
          position: string | null
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company?: string | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          linked_business_id?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          linked_business_id?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_linked_business_id_fkey"
            columns: ["linked_business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_deals: {
        Row: {
          company_id: string | null
          contact_id: string | null
          created_at: string
          currency: string | null
          expected_close: string | null
          id: string
          notes: string | null
          stage: string
          title: string
          updated_at: string
          user_id: string
          value: number | null
        }
        Insert: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          currency?: string | null
          expected_close?: string | null
          id?: string
          notes?: string | null
          stage?: string
          title: string
          updated_at?: string
          user_id: string
          value?: number | null
        }
        Update: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          currency?: string | null
          expected_close?: string | null
          id?: string
          notes?: string | null
          stage?: string
          title?: string
          updated_at?: string
          user_id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_form_responses: {
        Row: {
          answers: Json
          created_at: string
          form_id: string
          id: string
          metadata: Json | null
          respondent_email: string | null
          respondent_name: string | null
        }
        Insert: {
          answers?: Json
          created_at?: string
          form_id: string
          id?: string
          metadata?: Json | null
          respondent_email?: string | null
          respondent_name?: string | null
        }
        Update: {
          answers?: Json
          created_at?: string
          form_id?: string
          id?: string
          metadata?: Json | null
          respondent_email?: string | null
          respondent_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_form_responses_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "custom_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_forms: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          fields: Json
          id: string
          purpose: string
          response_count: number
          settings: Json
          slug: string
          status: string
          thank_you_message: string | null
          thank_you_title: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          fields?: Json
          id?: string
          purpose?: string
          response_count?: number
          settings?: Json
          slug: string
          status?: string
          thank_you_message?: string | null
          thank_you_title?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          fields?: Json
          id?: string
          purpose?: string
          response_count?: number
          settings?: Json
          slug?: string
          status?: string
          thank_you_message?: string | null
          thank_you_title?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      cv_upload_jobs: {
        Row: {
          created_at: string
          created_user_id: string | null
          error_message: string | null
          file_name: string
          file_url: string
          id: string
          parsed_data: Json | null
          parsing_status: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          created_user_id?: string | null
          error_message?: string | null
          file_name: string
          file_url: string
          id?: string
          parsed_data?: Json | null
          parsing_status?: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          created_user_id?: string | null
          error_message?: string | null
          file_name?: string
          file_url?: string
          id?: string
          parsed_data?: Json | null
          parsing_status?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      cv_uploads: {
        Row: {
          archived_at: string | null
          candidate_id: string | null
          created_at: string
          file_name: string
          file_size_bytes: number | null
          file_type: string
          file_url: string
          id: string
          parsing_error: string | null
          parsing_status: string
          raw_parsed_data: Json | null
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          archived_at?: string | null
          candidate_id?: string | null
          created_at?: string
          file_name: string
          file_size_bytes?: number | null
          file_type: string
          file_url: string
          id?: string
          parsing_error?: string | null
          parsing_status?: string
          raw_parsed_data?: Json | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          archived_at?: string | null
          candidate_id?: string | null
          created_at?: string
          file_name?: string
          file_size_bytes?: number | null
          file_type?: string
          file_url?: string
          id?: string
          parsing_error?: string | null
          parsing_status?: string
          raw_parsed_data?: Json | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      deep_search_requests: {
        Row: {
          business_id: string | null
          created_at: string
          credit_cost: number
          education: string | null
          experience_min: number | null
          id: string
          notes: string | null
          refunded_at: string | null
          requested_by: string
          result_notes: string | null
          search_keywords: string | null
          skills_required: string[] | null
          sla_deadline: string
          status: string
          updated_at: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          credit_cost?: number
          education?: string | null
          experience_min?: number | null
          id?: string
          notes?: string | null
          refunded_at?: string | null
          requested_by: string
          result_notes?: string | null
          search_keywords?: string | null
          skills_required?: string[] | null
          sla_deadline?: string
          status?: string
          updated_at?: string
        }
        Update: {
          business_id?: string | null
          created_at?: string
          credit_cost?: number
          education?: string | null
          experience_min?: number | null
          id?: string
          notes?: string | null
          refunded_at?: string | null
          requested_by?: string
          result_notes?: string | null
          search_keywords?: string | null
          skills_required?: string[] | null
          sla_deadline?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deep_search_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dept_approval_actions: {
        Row: {
          acted_at: string
          action: string
          approver_user_id: string
          id: string
          notes: string | null
          request_id: string
          tier_order: number
        }
        Insert: {
          acted_at?: string
          action: string
          approver_user_id: string
          id?: string
          notes?: string | null
          request_id: string
          tier_order: number
        }
        Update: {
          acted_at?: string
          action?: string
          approver_user_id?: string
          id?: string
          notes?: string | null
          request_id?: string
          tier_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "dept_approval_actions_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "dept_approval_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      dept_approval_requests: {
        Row: {
          created_at: string
          current_tier: number
          department_id: string
          description: string | null
          id: string
          reference_id: string | null
          reference_table: string | null
          request_type: string
          requested_by: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_tier?: number
          department_id: string
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_table?: string | null
          request_type?: string
          requested_by: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_tier?: number
          department_id?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_table?: string | null
          request_type?: string
          requested_by?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dept_approval_requests_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "hrm_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      dept_approval_tiers: {
        Row: {
          approver_user_id: string
          created_at: string
          department_id: string
          id: string
          label: string | null
          tier_order: number
        }
        Insert: {
          approver_user_id: string
          created_at?: string
          department_id: string
          id?: string
          label?: string | null
          tier_order?: number
        }
        Update: {
          approver_user_id?: string
          created_at?: string
          department_id?: string
          id?: string
          label?: string | null
          tier_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "dept_approval_tiers_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "hrm_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          audience_type: string
          content_ref_id: string | null
          content_type: string
          created_at: string | null
          id: string
          insight_id: string | null
          lead_category_id: string | null
          lead_category_ids: string[] | null
          lead_industry_id: string | null
          lead_industry_ids: string[] | null
          name: string
          recipients_count: number | null
          scheduled_at: string | null
          sent_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          audience_type?: string
          content_ref_id?: string | null
          content_type?: string
          created_at?: string | null
          id?: string
          insight_id?: string | null
          lead_category_id?: string | null
          lead_category_ids?: string[] | null
          lead_industry_id?: string | null
          lead_industry_ids?: string[] | null
          name: string
          recipients_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          audience_type?: string
          content_ref_id?: string | null
          content_type?: string
          created_at?: string | null
          id?: string
          insight_id?: string | null
          lead_category_id?: string | null
          lead_category_ids?: string[] | null
          lead_industry_id?: string | null
          lead_industry_ids?: string[] | null
          name?: string
          recipients_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_insight_id_fkey"
            columns: ["insight_id"]
            isOneToOne: false
            referencedRelation: "marketing_insights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaigns_lead_category_id_fkey"
            columns: ["lead_category_id"]
            isOneToOne: false
            referencedRelation: "lead_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaigns_lead_industry_id_fkey"
            columns: ["lead_industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sends: {
        Row: {
          body_html: string
          created_at: string
          error_message: string | null
          id: string
          recipient_email: string
          recipient_name: string | null
          recipient_user_id: string | null
          send_type: string
          sent_at: string | null
          sent_by: string | null
          status: string
          subject: string
          template_id: string | null
        }
        Insert: {
          body_html: string
          created_at?: string
          error_message?: string | null
          id?: string
          recipient_email: string
          recipient_name?: string | null
          recipient_user_id?: string | null
          send_type?: string
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          subject: string
          template_id?: string | null
        }
        Update: {
          body_html?: string
          created_at?: string
          error_message?: string | null
          id?: string
          recipient_email?: string
          recipient_name?: string | null
          recipient_user_id?: string | null
          send_type?: string
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          subject?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_sends_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          html_body: string
          id: string
          is_active: boolean | null
          name: string
          subject: string
          template_key: string
          updated_at: string | null
          variables: string[] | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          html_body: string
          id?: string
          is_active?: boolean | null
          name: string
          subject: string
          template_key: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          html_body?: string
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string
          template_key?: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Relationships: []
      }
      email_tracking_events: {
        Row: {
          campaign_id: string | null
          created_at: string
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          recipient_email: string
          user_agent: string | null
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          recipient_email: string
          user_agent?: string | null
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          recipient_email?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_tracking_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          check_in_method: string | null
          checked_in_at: string | null
          checked_in_by: string | null
          completed_at: string | null
          completion_notes: string | null
          created_at: string
          currency: string
          enrolled_by: string | null
          enrollment_date: string
          expiry_date: string | null
          id: string
          instructor_id: string | null
          notes: string | null
          package_type: string | null
          payment_amount: number | null
          payment_status: string
          program_name: string
          program_slug: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          check_in_method?: string | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string
          currency?: string
          enrolled_by?: string | null
          enrollment_date?: string
          expiry_date?: string | null
          id?: string
          instructor_id?: string | null
          notes?: string | null
          package_type?: string | null
          payment_amount?: number | null
          payment_status?: string
          program_name: string
          program_slug?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          check_in_method?: string | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string
          currency?: string
          enrolled_by?: string | null
          enrollment_date?: string
          expiry_date?: string | null
          id?: string
          instructor_id?: string | null
          notes?: string | null
          package_type?: string | null
          payment_amount?: number | null
          payment_status?: string
          program_name?: string
          program_slug?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      escrow_transactions: {
        Row: {
          amount: number
          contract_id: string | null
          created_at: string | null
          description: string | null
          fee_amount: number | null
          from_user_id: string | null
          id: string
          milestone_id: string | null
          status: string | null
          to_user_id: string | null
          type: string
        }
        Insert: {
          amount?: number
          contract_id?: string | null
          created_at?: string | null
          description?: string | null
          fee_amount?: number | null
          from_user_id?: string | null
          id?: string
          milestone_id?: string | null
          status?: string | null
          to_user_id?: string | null
          type?: string
        }
        Update: {
          amount?: number
          contract_id?: string | null
          created_at?: string | null
          description?: string | null
          fee_amount?: number | null
          from_user_id?: string | null
          id?: string
          milestone_id?: string | null
          status?: string | null
          to_user_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "escrow_transactions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "gig_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_transactions_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "gig_milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      event_orders: {
        Row: {
          amount: number
          check_in_method: string | null
          checked_in_at: string | null
          checked_in_by: string | null
          created_at: string
          currency: string
          discount_amount: number | null
          email: string
          event_id: string
          full_name: string
          id: string
          order_number: string
          original_amount: number | null
          phone: string
          status: string
          ticket_count: number
          updated_at: string
          user_id: string
          voucher_codes: string[] | null
          xendit_invoice_id: string | null
          xendit_invoice_url: string | null
          xendit_paid_at: string | null
          xendit_payment_method: string | null
        }
        Insert: {
          amount: number
          check_in_method?: string | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string
          currency?: string
          discount_amount?: number | null
          email: string
          event_id: string
          full_name: string
          id?: string
          order_number: string
          original_amount?: number | null
          phone?: string
          status?: string
          ticket_count?: number
          updated_at?: string
          user_id: string
          voucher_codes?: string[] | null
          xendit_invoice_id?: string | null
          xendit_invoice_url?: string | null
          xendit_paid_at?: string | null
          xendit_payment_method?: string | null
        }
        Update: {
          amount?: number
          check_in_method?: string | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string
          currency?: string
          discount_amount?: number | null
          email?: string
          event_id?: string
          full_name?: string
          id?: string
          order_number?: string
          original_amount?: number | null
          phone?: string
          status?: string
          ticket_count?: number
          updated_at?: string
          user_id?: string
          voucher_codes?: string[] | null
          xendit_invoice_id?: string | null
          xendit_invoice_url?: string | null
          xendit_paid_at?: string | null
          xendit_payment_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_orders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          address: string | null
          agenda: Json | null
          badge: string | null
          business_id: string | null
          capacity: number | null
          category: string
          city: string | null
          country: string | null
          created_at: string
          created_by: string
          currency: string
          description: string | null
          early_bird_deadline: string | null
          early_bird_price_cents: number | null
          end_date: string | null
          event_type: string
          faq: Json | null
          highlights: string[] | null
          id: string
          institution_id: string | null
          latitude: number | null
          level: string | null
          location: string | null
          longitude: number | null
          online_url: string | null
          organizer_logo_url: string | null
          organizer_name: string | null
          oveercode: string | null
          price_cents: number
          registered_count: number | null
          registration_deadline: string | null
          slug: string
          speakers: Json | null
          start_date: string | null
          status: string
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          venue_name: string | null
        }
        Insert: {
          address?: string | null
          agenda?: Json | null
          badge?: string | null
          business_id?: string | null
          capacity?: number | null
          category?: string
          city?: string | null
          country?: string | null
          created_at?: string
          created_by: string
          currency?: string
          description?: string | null
          early_bird_deadline?: string | null
          early_bird_price_cents?: number | null
          end_date?: string | null
          event_type?: string
          faq?: Json | null
          highlights?: string[] | null
          id?: string
          institution_id?: string | null
          latitude?: number | null
          level?: string | null
          location?: string | null
          longitude?: number | null
          online_url?: string | null
          organizer_logo_url?: string | null
          organizer_name?: string | null
          oveercode?: string | null
          price_cents?: number
          registered_count?: number | null
          registration_deadline?: string | null
          slug: string
          speakers?: Json | null
          start_date?: string | null
          status?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          venue_name?: string | null
        }
        Update: {
          address?: string | null
          agenda?: Json | null
          badge?: string | null
          business_id?: string | null
          capacity?: number | null
          category?: string
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          description?: string | null
          early_bird_deadline?: string | null
          early_bird_price_cents?: number | null
          end_date?: string | null
          event_type?: string
          faq?: Json | null
          highlights?: string[] | null
          id?: string
          institution_id?: string | null
          latitude?: number | null
          level?: string | null
          location?: string | null
          longitude?: number | null
          online_url?: string | null
          organizer_logo_url?: string | null
          organizer_name?: string | null
          oveercode?: string | null
          price_cents?: number
          registered_count?: number | null
          registration_deadline?: string | null
          slug?: string
          speakers?: Json | null
          start_date?: string | null
          status?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          venue_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      expertise_categories: {
        Row: {
          created_at: string
          description: string
          id: string
          label: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          label: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          label?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      expertise_items: {
        Row: {
          benefits: string[]
          category_id: string
          created_at: string
          deliverables: string[]
          description: string
          icon_name: string
          id: string
          industries: string[]
          is_active: boolean
          long_description: string
          process_steps: string[]
          slug: string
          sort_order: number
          title: string
          updated_at: string
          use_cases: string[]
        }
        Insert: {
          benefits?: string[]
          category_id: string
          created_at?: string
          deliverables?: string[]
          description: string
          icon_name: string
          id?: string
          industries?: string[]
          is_active?: boolean
          long_description: string
          process_steps?: string[]
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
          use_cases?: string[]
        }
        Update: {
          benefits?: string[]
          category_id?: string
          created_at?: string
          deliverables?: string[]
          description?: string
          icon_name?: string
          id?: string
          industries?: string[]
          is_active?: boolean
          long_description?: string
          process_steps?: string[]
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
          use_cases?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "expertise_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expertise_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      expertise_sub_services: {
        Row: {
          created_at: string
          description: string
          id: string
          item_id: string
          sort_order: number
          title: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          item_id: string
          sort_order?: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          item_id?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "expertise_sub_services_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "expertise_items"
            referencedColumns: ["id"]
          },
        ]
      }
      gig_contracts: {
        Row: {
          company_id: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          deposit_method: string | null
          deposit_paid_at: string | null
          deposit_reference: string | null
          deposit_status: string | null
          description: string | null
          id: string
          is_published: boolean | null
          job_id: string | null
          management_fee: number | null
          management_fee_pct: number | null
          started_at: string | null
          status: string | null
          talent_payout: number | null
          talent_user_id: string
          title: string
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          deposit_method?: string | null
          deposit_paid_at?: string | null
          deposit_reference?: string | null
          deposit_status?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          job_id?: string | null
          management_fee?: number | null
          management_fee_pct?: number | null
          started_at?: string | null
          status?: string | null
          talent_payout?: number | null
          talent_user_id: string
          title: string
          total_amount?: number
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          deposit_method?: string | null
          deposit_paid_at?: string | null
          deposit_reference?: string | null
          deposit_status?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          job_id?: string | null
          management_fee?: number | null
          management_fee_pct?: number | null
          started_at?: string | null
          status?: string | null
          talent_payout?: number | null
          talent_user_id?: string
          title?: string
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gig_contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gig_contracts_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      gig_deposits: {
        Row: {
          amount: number
          contract_id: string
          created_at: string | null
          deposit_number: string | null
          id: string
          method: string
          paid_at: string | null
          status: string | null
          user_id: string
          xendit_invoice_id: string | null
          xendit_invoice_url: string | null
        }
        Insert: {
          amount?: number
          contract_id: string
          created_at?: string | null
          deposit_number?: string | null
          id?: string
          method: string
          paid_at?: string | null
          status?: string | null
          user_id: string
          xendit_invoice_id?: string | null
          xendit_invoice_url?: string | null
        }
        Update: {
          amount?: number
          contract_id?: string
          created_at?: string | null
          deposit_number?: string | null
          id?: string
          method?: string
          paid_at?: string | null
          status?: string | null
          user_id?: string
          xendit_invoice_id?: string | null
          xendit_invoice_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gig_deposits_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "gig_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      gig_milestones: {
        Row: {
          amount: number
          approved_at: string | null
          contract_id: string
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          paid_at: string | null
          release_status: string | null
          released_at: string | null
          released_by: string | null
          review_note: string | null
          sort_order: number | null
          status: string | null
          submission_note: string | null
          submitted_at: string | null
          title: string
        }
        Insert: {
          amount?: number
          approved_at?: string | null
          contract_id: string
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          paid_at?: string | null
          release_status?: string | null
          released_at?: string | null
          released_by?: string | null
          review_note?: string | null
          sort_order?: number | null
          status?: string | null
          submission_note?: string | null
          submitted_at?: string | null
          title: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          contract_id?: string
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          paid_at?: string | null
          release_status?: string | null
          released_at?: string | null
          released_by?: string | null
          review_note?: string | null
          sort_order?: number | null
          status?: string | null
          submission_note?: string | null
          submitted_at?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "gig_milestones_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "gig_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      hiring_matched_candidates: {
        Row: {
          candidate_archive_id: string | null
          created_at: string
          hiring_request_id: string
          id: string
          match_score: number | null
          matched_by: string | null
          notes: string | null
          profile_user_id: string | null
          source_type: string
          status: string
          updated_at: string
        }
        Insert: {
          candidate_archive_id?: string | null
          created_at?: string
          hiring_request_id: string
          id?: string
          match_score?: number | null
          matched_by?: string | null
          notes?: string | null
          profile_user_id?: string | null
          source_type?: string
          status?: string
          updated_at?: string
        }
        Update: {
          candidate_archive_id?: string | null
          created_at?: string
          hiring_request_id?: string
          id?: string
          match_score?: number | null
          matched_by?: string | null
          notes?: string | null
          profile_user_id?: string | null
          source_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hiring_matched_candidates_candidate_archive_id_fkey"
            columns: ["candidate_archive_id"]
            isOneToOne: false
            referencedRelation: "candidates_archive"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hiring_matched_candidates_hiring_request_id_fkey"
            columns: ["hiring_request_id"]
            isOneToOne: false
            referencedRelation: "hiring_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      hiring_request_talents: {
        Row: {
          created_at: string | null
          id: string
          match_score: number | null
          notes: string | null
          request_id: string
          status: string | null
          talent_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          match_score?: number | null
          notes?: string | null
          request_id: string
          status?: string | null
          talent_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          match_score?: number | null
          notes?: string | null
          request_id?: string
          status?: string | null
          talent_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hiring_request_talents_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "hiring_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hiring_request_talents_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hiring_requests: {
        Row: {
          business_id: string | null
          client_id: string
          created_at: string | null
          credit_cost: number
          description: string | null
          experience_max: number | null
          experience_min: number | null
          hiring_type: string | null
          id: string
          oveercode: string | null
          positions_count: number | null
          required_skills: string[] | null
          sla_deadline: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          business_id?: string | null
          client_id: string
          created_at?: string | null
          credit_cost: number
          description?: string | null
          experience_max?: number | null
          experience_min?: number | null
          hiring_type?: string | null
          id?: string
          oveercode?: string | null
          positions_count?: number | null
          required_skills?: string[] | null
          sla_deadline?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          business_id?: string | null
          client_id?: string
          created_at?: string | null
          credit_cost?: number
          description?: string | null
          experience_max?: number | null
          experience_min?: number | null
          hiring_type?: string | null
          id?: string
          oveercode?: string | null
          positions_count?: number | null
          required_skills?: string[] | null
          sla_deadline?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hiring_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hiring_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_awards: {
        Row: {
          created_at: string | null
          date_received: string | null
          description: string | null
          id: string
          issuer: string | null
          profile_id: string
          title: string
        }
        Insert: {
          created_at?: string | null
          date_received?: string | null
          description?: string | null
          id?: string
          issuer?: string | null
          profile_id: string
          title: string
        }
        Update: {
          created_at?: string | null
          date_received?: string | null
          description?: string | null
          id?: string
          issuer?: string | null
          profile_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_awards_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "hr_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_certifications: {
        Row: {
          created_at: string | null
          credential_id: string | null
          expiry_date: string | null
          id: string
          issue_date: string | null
          issuing_organization: string | null
          name: string
          profile_id: string
        }
        Insert: {
          created_at?: string | null
          credential_id?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_organization?: string | null
          name: string
          profile_id: string
        }
        Update: {
          created_at?: string | null
          credential_id?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_organization?: string | null
          name?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_certifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "hr_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_credit_transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          reference_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      hr_education: {
        Row: {
          created_at: string | null
          degree: string
          end_date: string | null
          field_of_study: string | null
          grade: string | null
          id: string
          institution: string
          profile_id: string
          start_date: string | null
        }
        Insert: {
          created_at?: string | null
          degree: string
          end_date?: string | null
          field_of_study?: string | null
          grade?: string | null
          id?: string
          institution: string
          profile_id: string
          start_date?: string | null
        }
        Update: {
          created_at?: string | null
          degree?: string
          end_date?: string | null
          field_of_study?: string | null
          grade?: string | null
          id?: string
          institution?: string
          profile_id?: string
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_education_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "hr_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_experience: {
        Row: {
          company: string
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          is_current: boolean | null
          position: string
          profile_id: string
          start_date: string
        }
        Insert: {
          company: string
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          position: string
          profile_id: string
          start_date: string
        }
        Update: {
          company?: string
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          position?: string
          profile_id?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_experience_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "hr_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_hiring_requests: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          hiring_type: string | null
          id: string
          positions_count: number | null
          required_experience_max: number | null
          required_experience_min: number | null
          required_seniority: string[] | null
          status: string | null
          title: string
          user_id: string
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          hiring_type?: string | null
          id?: string
          positions_count?: number | null
          required_experience_max?: number | null
          required_experience_min?: number | null
          required_seniority?: string[] | null
          status?: string | null
          title: string
          user_id: string
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          hiring_type?: string | null
          id?: string
          positions_count?: number | null
          required_experience_max?: number | null
          required_experience_min?: number | null
          required_seniority?: string[] | null
          status?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      hr_hiring_requirements: {
        Row: {
          created_at: string | null
          hiring_request_id: string
          id: string
          is_mandatory: boolean | null
          requirement_type: string
          requirement_value: string
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          hiring_request_id: string
          id?: string
          is_mandatory?: boolean | null
          requirement_type: string
          requirement_value: string
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          hiring_request_id?: string
          id?: string
          is_mandatory?: boolean | null
          requirement_type?: string
          requirement_value?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_hiring_requirements_hiring_request_id_fkey"
            columns: ["hiring_request_id"]
            isOneToOne: false
            referencedRelation: "hr_hiring_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_matched_profiles: {
        Row: {
          created_at: string | null
          hiring_request_id: string
          id: string
          is_viewed: boolean | null
          match_score: number | null
          profile_id: string
          viewed_at: string | null
        }
        Insert: {
          created_at?: string | null
          hiring_request_id: string
          id?: string
          is_viewed?: boolean | null
          match_score?: number | null
          profile_id: string
          viewed_at?: string | null
        }
        Update: {
          created_at?: string | null
          hiring_request_id?: string
          id?: string
          is_viewed?: boolean | null
          match_score?: number | null
          profile_id?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_matched_profiles_hiring_request_id_fkey"
            columns: ["hiring_request_id"]
            isOneToOne: false
            referencedRelation: "hr_hiring_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_matched_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "hr_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_profiles: {
        Row: {
          availability: string | null
          created_at: string | null
          email: string
          expected_salary_max: number | null
          expected_salary_min: number | null
          full_name: string
          id: string
          location: string | null
          phone: string | null
          seniority_level: string | null
          summary: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
          years_of_experience: number | null
        }
        Insert: {
          availability?: string | null
          created_at?: string | null
          email: string
          expected_salary_max?: number | null
          expected_salary_min?: number | null
          full_name: string
          id?: string
          location?: string | null
          phone?: string | null
          seniority_level?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          years_of_experience?: number | null
        }
        Update: {
          availability?: string | null
          created_at?: string | null
          email?: string
          expected_salary_max?: number | null
          expected_salary_min?: number | null
          full_name?: string
          id?: string
          location?: string | null
          phone?: string | null
          seniority_level?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          years_of_experience?: number | null
        }
        Relationships: []
      }
      hr_skills: {
        Row: {
          created_at: string | null
          id: string
          proficiency_level: string | null
          profile_id: string
          skill_name: string
          years_of_experience: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          proficiency_level?: string | null
          profile_id: string
          skill_name: string
          years_of_experience?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          proficiency_level?: string | null
          profile_id?: string
          skill_name?: string
          years_of_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_skills_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "hr_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_training: {
        Row: {
          completion_date: string | null
          created_at: string | null
          description: string | null
          duration_hours: number | null
          id: string
          profile_id: string
          provider: string | null
          title: string
        }
        Insert: {
          completion_date?: string | null
          created_at?: string | null
          description?: string | null
          duration_hours?: number | null
          id?: string
          profile_id: string
          provider?: string | null
          title: string
        }
        Update: {
          completion_date?: string | null
          created_at?: string | null
          description?: string | null
          duration_hours?: number | null
          id?: string
          profile_id?: string
          provider?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_training_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "hr_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_user_credits: {
        Row: {
          balance: number | null
          created_at: string | null
          id: string
          total_earned: number | null
          total_spent: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          id?: string
          total_earned?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          id?: string
          total_earned?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      hrm_attendance: {
        Row: {
          address: string | null
          check_in: string | null
          check_out: string | null
          company_id: string | null
          created_at: string
          date: string
          employee_id: string
          face_match_score: number | null
          id: string
          latitude: number | null
          longitude: number | null
          notes: string | null
          selfie_url: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          check_in?: string | null
          check_out?: string | null
          company_id?: string | null
          created_at?: string
          date?: string
          employee_id: string
          face_match_score?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          selfie_url?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          check_in?: string | null
          check_out?: string | null
          company_id?: string | null
          created_at?: string
          date?: string
          employee_id?: string
          face_match_score?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          selfie_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hrm_attendance_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hrm_attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hrm_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hrm_claim_settings: {
        Row: {
          claim_type: string
          company_id: string
          created_at: string | null
          description: string | null
          employee_id: string | null
          id: string
          is_active: boolean | null
          limit_amount: number
          limit_mode: string
          limit_period: string
        }
        Insert: {
          claim_type: string
          company_id: string
          created_at?: string | null
          description?: string | null
          employee_id?: string | null
          id?: string
          is_active?: boolean | null
          limit_amount?: number
          limit_mode?: string
          limit_period?: string
        }
        Update: {
          claim_type?: string
          company_id?: string
          created_at?: string | null
          description?: string | null
          employee_id?: string | null
          id?: string
          is_active?: boolean | null
          limit_amount?: number
          limit_mode?: string
          limit_period?: string
        }
        Relationships: [
          {
            foreignKeyName: "hrm_claim_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hrm_claim_settings_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hrm_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hrm_claims: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          claim_date: string
          claim_type: string
          company_id: string
          created_at: string | null
          description: string | null
          employee_id: string
          id: string
          receipt_name: string | null
          receipt_url: string | null
          rejection_reason: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          claim_date?: string
          claim_type: string
          company_id: string
          created_at?: string | null
          description?: string | null
          employee_id: string
          id?: string
          receipt_name?: string | null
          receipt_url?: string | null
          rejection_reason?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          claim_date?: string
          claim_type?: string
          company_id?: string
          created_at?: string | null
          description?: string | null
          employee_id?: string
          id?: string
          receipt_name?: string | null
          receipt_url?: string | null
          rejection_reason?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hrm_claims_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hrm_claims_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hrm_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hrm_departments: {
        Row: {
          company_id: string | null
          created_at: string
          description: string | null
          head_user_id: string | null
          id: string
          name: string
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          head_user_id?: string | null
          id?: string
          name: string
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          head_user_id?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hrm_departments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hrm_departments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "hrm_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      hrm_employees: {
        Row: {
          address: string | null
          bank_account_name: string | null
          bank_account_number: string | null
          bank_name: string | null
          city: string | null
          company_id: string | null
          contract_end_date: string | null
          contract_file_name: string | null
          contract_start_date: string | null
          contract_type: string | null
          contract_url: string | null
          country: string | null
          created_at: string
          date_of_birth: string | null
          department_id: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employee_number: string | null
          gender: string | null
          hire_date: string | null
          id: string
          job_description: string | null
          linked_user_id: string | null
          name: string
          office_location_id: string | null
          phone: string | null
          position: string | null
          salary: number | null
          shift_id: string | null
          status: string
          tax_id: string | null
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          city?: string | null
          company_id?: string | null
          contract_end_date?: string | null
          contract_file_name?: string | null
          contract_start_date?: string | null
          contract_type?: string | null
          contract_url?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          department_id?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_number?: string | null
          gender?: string | null
          hire_date?: string | null
          id?: string
          job_description?: string | null
          linked_user_id?: string | null
          name: string
          office_location_id?: string | null
          phone?: string | null
          position?: string | null
          salary?: number | null
          shift_id?: string | null
          status?: string
          tax_id?: string | null
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          city?: string | null
          company_id?: string | null
          contract_end_date?: string | null
          contract_file_name?: string | null
          contract_start_date?: string | null
          contract_type?: string | null
          contract_url?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          department_id?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_number?: string | null
          gender?: string | null
          hire_date?: string | null
          id?: string
          job_description?: string | null
          linked_user_id?: string | null
          name?: string
          office_location_id?: string | null
          phone?: string | null
          position?: string | null
          salary?: number | null
          shift_id?: string | null
          status?: string
          tax_id?: string | null
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hrm_employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hrm_employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "hrm_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hrm_employees_office_location_id_fkey"
            columns: ["office_location_id"]
            isOneToOne: false
            referencedRelation: "hrm_office_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hrm_employees_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "hrm_shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      hrm_face_registrations: {
        Row: {
          company_id: string | null
          created_at: string
          employee_id: string
          face_descriptor: Json
          id: string
          photo_url: string | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          employee_id: string
          face_descriptor: Json
          id?: string
          photo_url?: string | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          employee_id?: string
          face_descriptor?: Json
          id?: string
          photo_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hrm_face_registrations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hrm_face_registrations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hrm_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hrm_job_desc_items: {
        Row: {
          category: string
          company_id: string | null
          created_at: string
          description: string
          employee_id: string
          id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category?: string
          company_id?: string | null
          created_at?: string
          description: string
          employee_id: string
          id?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category?: string
          company_id?: string | null
          created_at?: string
          description?: string
          employee_id?: string
          id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hrm_job_desc_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hrm_job_desc_items_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hrm_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hrm_leave_balances: {
        Row: {
          category_id: string | null
          company_id: string | null
          created_at: string | null
          employee_id: string | null
          id: string
          total_days: number
          used_days: number
          year: number
        }
        Insert: {
          category_id?: string | null
          company_id?: string | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          total_days?: number
          used_days?: number
          year?: number
        }
        Update: {
          category_id?: string | null
          company_id?: string | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          total_days?: number
          used_days?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "hrm_leave_balances_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "hrm_leave_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hrm_leave_balances_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hrm_leave_balances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hrm_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hrm_leave_categories: {
        Row: {
          company_id: string | null
          created_at: string | null
          default_days: number
          description: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          default_days?: number
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          default_days?: number
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "hrm_leave_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      hrm_leave_requests: {
        Row: {
          approved_by: string | null
          attachment_name: string | null
          attachment_url: string | null
          category_id: string | null
          company_id: string | null
          created_at: string
          days_count: number | null
          employee_id: string
          end_date: string
          id: string
          is_manual: boolean
          leave_type: string
          reason: string | null
          start_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_by?: string | null
          attachment_name?: string | null
          attachment_url?: string | null
          category_id?: string | null
          company_id?: string | null
          created_at?: string
          days_count?: number | null
          employee_id: string
          end_date: string
          id?: string
          is_manual?: boolean
          leave_type?: string
          reason?: string | null
          start_date: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_by?: string | null
          attachment_name?: string | null
          attachment_url?: string | null
          category_id?: string | null
          company_id?: string | null
          created_at?: string
          days_count?: number | null
          employee_id?: string
          end_date?: string
          id?: string
          is_manual?: boolean
          leave_type?: string
          reason?: string | null
          start_date?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hrm_leave_requests_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "hrm_leave_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hrm_leave_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hrm_leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hrm_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hrm_office_locations: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          is_active: boolean
          latitude: number
          longitude: number
          name: string
          radius_meters: number
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          latitude: number
          longitude: number
          name: string
          radius_meters?: number
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          latitude?: number
          longitude?: number
          name?: string
          radius_meters?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hrm_office_locations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      hrm_payroll_runs: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          notes: string | null
          period_month: number
          period_year: number
          run_date: string
          status: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          period_month: number
          period_year: number
          run_date?: string
          status?: string
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          period_month?: number
          period_year?: number
          run_date?: string
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hrm_payroll_runs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      hrm_payslips: {
        Row: {
          allowance_details: Json | null
          allowances: number
          basic_salary: number
          company_id: string | null
          created_at: string
          deduction_details: Json | null
          deductions: number
          employee_id: string
          id: string
          net_salary: number
          notes: string | null
          overtime: number
          payroll_run_id: string
          status: string
          tax: number
          updated_at: string
          user_id: string
        }
        Insert: {
          allowance_details?: Json | null
          allowances?: number
          basic_salary?: number
          company_id?: string | null
          created_at?: string
          deduction_details?: Json | null
          deductions?: number
          employee_id: string
          id?: string
          net_salary?: number
          notes?: string | null
          overtime?: number
          payroll_run_id: string
          status?: string
          tax?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          allowance_details?: Json | null
          allowances?: number
          basic_salary?: number
          company_id?: string | null
          created_at?: string
          deduction_details?: Json | null
          deductions?: number
          employee_id?: string
          id?: string
          net_salary?: number
          notes?: string | null
          overtime?: number
          payroll_run_id?: string
          status?: string
          tax?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hrm_payslips_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hrm_payslips_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hrm_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hrm_payslips_payroll_run_id_fkey"
            columns: ["payroll_run_id"]
            isOneToOne: false
            referencedRelation: "hrm_payroll_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      hrm_point_settings: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          label: string
          points: number
          rule_key: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          label: string
          points?: number
          rule_key: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          label?: string
          points?: number
          rule_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hrm_point_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      hrm_point_transactions: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          employee_id: string
          id: string
          points: number
          reason: string
          reference_id: string | null
          rule_key: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          employee_id: string
          id?: string
          points: number
          reason: string
          reference_id?: string | null
          rule_key?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          employee_id?: string
          id?: string
          points?: number
          reason?: string
          reference_id?: string | null
          rule_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hrm_point_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hrm_point_transactions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hrm_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hrm_shifts: {
        Row: {
          company_id: string | null
          created_at: string
          end_time: string
          id: string
          is_active: boolean
          is_default: boolean
          late_tolerance_minutes: number | null
          name: string
          start_time: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          end_time?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          late_tolerance_minutes?: number | null
          name: string
          start_time?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          end_time?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          late_tolerance_minutes?: number | null
          name?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "hrm_shifts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      hrm_sop_policies: {
        Row: {
          category: string
          company_id: string
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string
          company_id: string
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          company_id?: string
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hrm_sop_policies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      industries: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      insight_digest_logs: {
        Row: {
          error_message: string | null
          id: string
          insights_sent: string[] | null
          sent_at: string
          status: string
          user_id: string
        }
        Insert: {
          error_message?: string | null
          id?: string
          insights_sent?: string[] | null
          sent_at?: string
          status?: string
          user_id: string
        }
        Update: {
          error_message?: string | null
          id?: string
          insights_sent?: string[] | null
          sent_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      insight_service_tiers: {
        Row: {
          billing_period: string
          created_at: string
          currency: string
          description: string | null
          features: Json | null
          id: string
          is_active: boolean
          is_popular: boolean
          name: string
          price_cents: number
          service_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          billing_period?: string
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean
          is_popular?: boolean
          name: string
          price_cents?: number
          service_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          billing_period?: string
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean
          is_popular?: boolean
          name?: string
          price_cents?: number
          service_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "insight_service_tiers_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "insight_services"
            referencedColumns: ["id"]
          },
        ]
      }
      insight_services: {
        Row: {
          created_at: string
          description: string | null
          features: Json | null
          icon_name: string
          id: string
          is_active: boolean
          slug: string
          sort_order: number
          tagline: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: Json | null
          icon_name?: string
          id?: string
          is_active?: boolean
          slug: string
          sort_order?: number
          tagline?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: Json | null
          icon_name?: string
          id?: string
          is_active?: boolean
          slug?: string
          sort_order?: number
          tagline?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      insight_subscriptions: {
        Row: {
          created_at: string
          frequency: string
          id: string
          is_active: boolean
          last_digest_sent_at: string | null
          topics: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          frequency?: string
          id?: string
          is_active?: boolean
          last_digest_sent_at?: string | null
          topics?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          frequency?: string
          id?: string
          is_active?: boolean
          last_digest_sent_at?: string | null
          topics?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      institutions: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          created_by: string
          description: string | null
          founded_year: number | null
          id: string
          institution_type: string | null
          logo_url: string | null
          name: string
          slug: string
          updated_at: string
          website: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          founded_year?: number | null
          id?: string
          institution_type?: string | null
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          founded_year?: number | null
          id?: string
          institution_type?: string | null
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      instructor_profiles: {
        Row: {
          achievements: string[] | null
          bio: string | null
          certificates: Json | null
          created_at: string
          education: Json | null
          email: string | null
          experience_years: number | null
          experiences: Json | null
          expertise: string[] | null
          id: string
          ielts_score: number | null
          instructor_rating: number | null
          invitation_sent: boolean | null
          invitation_token: string | null
          invitation_token_expires_at: string | null
          location: string | null
          signature_url: string | null
          specializations: string[] | null
          title: string | null
          total_programs: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          achievements?: string[] | null
          bio?: string | null
          certificates?: Json | null
          created_at?: string
          education?: Json | null
          email?: string | null
          experience_years?: number | null
          experiences?: Json | null
          expertise?: string[] | null
          id?: string
          ielts_score?: number | null
          instructor_rating?: number | null
          invitation_sent?: boolean | null
          invitation_token?: string | null
          invitation_token_expires_at?: string | null
          location?: string | null
          signature_url?: string | null
          specializations?: string[] | null
          title?: string | null
          total_programs?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          achievements?: string[] | null
          bio?: string | null
          certificates?: Json | null
          created_at?: string
          education?: Json | null
          email?: string | null
          experience_years?: number | null
          experiences?: Json | null
          expertise?: string[] | null
          id?: string
          ielts_score?: number | null
          instructor_rating?: number | null
          invitation_sent?: boolean | null
          invitation_token?: string | null
          invitation_token_expires_at?: string | null
          location?: string | null
          signature_url?: string | null
          specializations?: string[] | null
          title?: string | null
          total_programs?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      investment_offers: {
        Row: {
          application_id: string
          created_at: string
          currency: string
          estimated_profit: number
          funding_amount: number
          id: string
          investor_user_id: string
          notes: string | null
          opportunity_id: string
          profit_sharing: number
          status: string
          term_of_payment: string
          updated_at: string
        }
        Insert: {
          application_id: string
          created_at?: string
          currency?: string
          estimated_profit: number
          funding_amount: number
          id?: string
          investor_user_id: string
          notes?: string | null
          opportunity_id: string
          profit_sharing: number
          status?: string
          term_of_payment: string
          updated_at?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          currency?: string
          estimated_profit?: number
          funding_amount?: number
          id?: string
          investor_user_id?: string
          notes?: string | null
          opportunity_id?: string
          profit_sharing?: number
          status?: string
          term_of_payment?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "investment_offers_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "opportunity_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investment_offers_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      invite_reminder_logs: {
        Row: {
          created_at: string
          id: string
          sent_at: string
          user_email: string
        }
        Insert: {
          created_at?: string
          id?: string
          sent_at?: string
          user_email: string
        }
        Update: {
          created_at?: string
          id?: string
          sent_at?: string
          user_email?: string
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          applicant_user_id: string | null
          candidate_id: string | null
          cover_letter: string | null
          created_at: string | null
          currency: string | null
          id: string
          job_id: string
          proposed_rate: number | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          applicant_user_id?: string | null
          candidate_id?: string | null
          cover_letter?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          job_id: string
          proposed_rate?: number | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          applicant_user_id?: string | null
          candidate_id?: string | null
          cover_letter?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          job_id?: string
          proposed_rate?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_categories: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      job_matches: {
        Row: {
          candidate_id: string
          id: string
          job_id: string
          match_score: number
          matched_at: string | null
          matched_certifications: string[] | null
          matched_education: boolean | null
          matched_experience: boolean | null
          matched_skills: string[] | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          candidate_id: string
          id?: string
          job_id: string
          match_score?: number
          matched_at?: string | null
          matched_certifications?: string[] | null
          matched_education?: boolean | null
          matched_experience?: boolean | null
          matched_skills?: string[] | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          candidate_id?: string
          id?: string
          job_id?: string
          match_score?: number
          matched_at?: string | null
          matched_certifications?: string[] | null
          matched_education?: boolean | null
          matched_experience?: boolean | null
          matched_skills?: string[] | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_matches_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_types: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      jobs: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          certifications_required: string[] | null
          company_id: string | null
          created_at: string | null
          credit_cost: number | null
          currency: string | null
          description: string | null
          education_level: string | null
          experience_max: number | null
          experience_min: number | null
          id: string
          is_remote: boolean | null
          job_type: string
          location: string | null
          max_applicants: number | null
          posted_by: string
          skills_required: string[] | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          certifications_required?: string[] | null
          company_id?: string | null
          created_at?: string | null
          credit_cost?: number | null
          currency?: string | null
          description?: string | null
          education_level?: string | null
          experience_max?: number | null
          experience_min?: number | null
          id?: string
          is_remote?: boolean | null
          job_type?: string
          location?: string | null
          max_applicants?: number | null
          posted_by: string
          skills_required?: string[] | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          certifications_required?: string[] | null
          company_id?: string | null
          created_at?: string | null
          credit_cost?: number | null
          currency?: string | null
          description?: string | null
          education_level?: string | null
          experience_max?: number | null
          experience_min?: number | null
          id?: string
          is_remote?: boolean | null
          job_type?: string
          location?: string | null
          max_applicants?: number | null
          posted_by?: string
          skills_required?: string[] | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_documents: {
        Row: {
          admin_notes: string | null
          created_at: string
          document_label: string | null
          document_type: string
          file_name: string
          file_url: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          document_label?: string | null
          document_type: string
          file_name: string
          file_url: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          document_label?: string | null
          document_type?: string
          file_name?: string
          file_url?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      kyc_submissions: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          primary_doc_file_name: string
          primary_doc_file_url: string
          primary_doc_type: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          support_doc1_file_name: string
          support_doc1_file_url: string
          support_doc1_label: string
          support_doc2_file_name: string
          support_doc2_file_url: string
          support_doc2_label: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          primary_doc_file_name: string
          primary_doc_file_url: string
          primary_doc_type: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          support_doc1_file_name: string
          support_doc1_file_url: string
          support_doc1_label: string
          support_doc2_file_name: string
          support_doc2_file_url: string
          support_doc2_label: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          primary_doc_file_name?: string
          primary_doc_file_url?: string
          primary_doc_type?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          support_doc1_file_name?: string
          support_doc1_file_url?: string
          support_doc1_label?: string
          support_doc2_file_name?: string
          support_doc2_file_url?: string
          support_doc2_label?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lead_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          address: string | null
          category_id: string | null
          company: string | null
          country: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          industry_id: string | null
          job_title: string | null
          linkedin: string | null
          notes: string | null
          phone: string | null
          source: string | null
          status: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          category_id?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          industry_id?: string | null
          job_title?: string | null
          linkedin?: string | null
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          category_id?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          industry_id?: string | null
          job_title?: string | null
          linkedin?: string | null
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "lead_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_enrollments: {
        Row: {
          completed_at: string | null
          created_at: string
          enrolled_at: string
          id: string
          program_id: string
          progress_pct: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          enrolled_at?: string
          id?: string
          program_id: string
          progress_pct?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          enrolled_at?: string
          id?: string
          program_id?: string
          progress_pct?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_enrollments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "learning_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_module_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          enrollment_id: string
          id: string
          module_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          enrollment_id: string
          id?: string
          module_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          enrollment_id?: string
          id?: string
          module_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_module_progress_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "learning_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_module_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "learning_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_modules: {
        Row: {
          content: string | null
          content_type: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_required: boolean
          program_id: string
          sort_order: number
          title: string
          video_url: string | null
        }
        Insert: {
          content?: string | null
          content_type?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_required?: boolean
          program_id: string
          sort_order?: number
          title: string
          video_url?: string | null
        }
        Update: {
          content?: string | null
          content_type?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_required?: boolean
          program_id?: string
          sort_order?: number
          title?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_modules_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "learning_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_programs: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          difficulty_level: string
          duration_hours: number | null
          id: string
          instructor_name: string | null
          is_active: boolean
          is_free: boolean
          long_description: string | null
          oveercode: string | null
          price_cents: number
          program_type: string
          skill_name: string
          slug: string
          thumbnail_url: string | null
          title: string
          total_modules: number
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          difficulty_level?: string
          duration_hours?: number | null
          id?: string
          instructor_name?: string | null
          is_active?: boolean
          is_free?: boolean
          long_description?: string | null
          oveercode?: string | null
          price_cents?: number
          program_type?: string
          skill_name: string
          slug: string
          thumbnail_url?: string | null
          title: string
          total_modules?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          difficulty_level?: string
          duration_hours?: number | null
          id?: string
          instructor_name?: string | null
          is_active?: boolean
          is_free?: boolean
          long_description?: string | null
          oveercode?: string | null
          price_cents?: number
          program_type?: string
          skill_name?: string
          slug?: string
          thumbnail_url?: string | null
          title?: string
          total_modules?: number
          updated_at?: string
        }
        Relationships: []
      }
      legal_pages: {
        Row: {
          content: string
          id: string
          slug: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content?: string
          id?: string
          slug: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: string
          id?: string
          slug?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      lms_sessions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          completed_at: string | null
          created_at: string
          enrollment_id: string
          id: string
          notes: string | null
          session_number: number
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          completed_at?: string | null
          created_at?: string
          enrollment_id: string
          id?: string
          notes?: string | null
          session_number?: number
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          completed_at?: string | null
          created_at?: string
          enrollment_id?: string
          id?: string
          notes?: string | null
          session_number?: number
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lms_sessions_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      login_logs: {
        Row: {
          id: string
          logged_in_at: string
          user_id: string
        }
        Insert: {
          id?: string
          logged_in_at?: string
          user_id: string
        }
        Update: {
          id?: string
          logged_in_at?: string
          user_id?: string
        }
        Relationships: []
      }
      login_tokens: {
        Row: {
          api_key_id: string
          created_at: string
          expires_at: string
          id: string
          token_hash: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          api_key_id: string
          created_at?: string
          expires_at?: string
          id?: string
          token_hash: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          api_key_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          token_hash?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "login_tokens_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_email_logs: {
        Row: {
          error_message: string | null
          id: string
          insight_id: string | null
          recipients_count: number
          sent_at: string
          status: string
        }
        Insert: {
          error_message?: string | null
          id?: string
          insight_id?: string | null
          recipients_count?: number
          sent_at?: string
          status?: string
        }
        Update: {
          error_message?: string | null
          id?: string
          insight_id?: string | null
          recipients_count?: number
          sent_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_email_logs_insight_id_fkey"
            columns: ["insight_id"]
            isOneToOne: false
            referencedRelation: "marketing_insights"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_insights: {
        Row: {
          attachments: Json | null
          blocks: Json | null
          body: string
          created_at: string
          cta_text: string
          cta_url: string
          expertise_name: string
          expertise_slug: string
          headline: string
          id: string
          is_active: boolean
          subject: string
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          blocks?: Json | null
          body: string
          created_at?: string
          cta_text?: string
          cta_url: string
          expertise_name: string
          expertise_slug: string
          headline: string
          id?: string
          is_active?: boolean
          subject: string
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          blocks?: Json | null
          body?: string
          created_at?: string
          cta_text?: string
          cta_url?: string
          expertise_name?: string
          expertise_slug?: string
          headline?: string
          id?: string
          is_active?: boolean
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      master_skills: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          id: string
          matched_at: string
          status: string
          user_a: string
          user_b: string
        }
        Insert: {
          id?: string
          matched_at?: string
          status?: string
          user_a: string
          user_b: string
        }
        Update: {
          id?: string
          matched_at?: string
          status?: string
          user_a?: string
          user_b?: string
        }
        Relationships: []
      }
      notification_queue: {
        Row: {
          company_id: string | null
          created_at: string
          error_message: string | null
          id: string
          notification_type: string
          payload: Json
          recipient_email: string | null
          recipient_user_id: string
          retry_count: number
          sent_at: string | null
          status: string
          subject: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          notification_type: string
          payload?: Json
          recipient_email?: string | null
          recipient_user_id: string
          retry_count?: number
          sent_at?: string | null
          status?: string
          subject: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          notification_type?: string
          payload?: Json
          recipient_email?: string | null
          recipient_user_id?: string
          retry_count?: number
          sent_at?: string | null
          status?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_queue_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          admin_notes: string | null
          assigned_to: string | null
          assigned_vendor_id: string | null
          budget_max: number | null
          budget_min: number | null
          business_id: string | null
          category: string
          company_name: string | null
          created_at: string
          currency: string | null
          deadline: string | null
          delivery_terms: string | null
          demand_type: string | null
          description: string | null
          id: string
          is_remote: boolean | null
          job_type: string | null
          latitude: number | null
          location: string | null
          longitude: number | null
          matching_weights: Json | null
          min_education_level: string | null
          min_experience_years: number | null
          min_portfolio_count: number | null
          oveercode: string | null
          payment_terms: string | null
          project_duration: string | null
          project_scope: string | null
          quantity: string | null
          required_certifications: string[] | null
          required_trainings: string[] | null
          reviewed_at: string | null
          reviewed_by: string | null
          skills_required: string[] | null
          sla_deadline: string | null
          sla_type: string
          slug: string
          specifications: string | null
          status: string
          title: string
          tor_data: Json | null
          unit: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          assigned_to?: string | null
          assigned_vendor_id?: string | null
          budget_max?: number | null
          budget_min?: number | null
          business_id?: string | null
          category: string
          company_name?: string | null
          created_at?: string
          currency?: string | null
          deadline?: string | null
          delivery_terms?: string | null
          demand_type?: string | null
          description?: string | null
          id?: string
          is_remote?: boolean | null
          job_type?: string | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          matching_weights?: Json | null
          min_education_level?: string | null
          min_experience_years?: number | null
          min_portfolio_count?: number | null
          oveercode?: string | null
          payment_terms?: string | null
          project_duration?: string | null
          project_scope?: string | null
          quantity?: string | null
          required_certifications?: string[] | null
          required_trainings?: string[] | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          skills_required?: string[] | null
          sla_deadline?: string | null
          sla_type?: string
          slug: string
          specifications?: string | null
          status?: string
          title: string
          tor_data?: Json | null
          unit?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          assigned_to?: string | null
          assigned_vendor_id?: string | null
          budget_max?: number | null
          budget_min?: number | null
          business_id?: string | null
          category?: string
          company_name?: string | null
          created_at?: string
          currency?: string | null
          deadline?: string | null
          delivery_terms?: string | null
          demand_type?: string | null
          description?: string | null
          id?: string
          is_remote?: boolean | null
          job_type?: string | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          matching_weights?: Json | null
          min_education_level?: string | null
          min_experience_years?: number | null
          min_portfolio_count?: number | null
          oveercode?: string | null
          payment_terms?: string | null
          project_duration?: string | null
          project_scope?: string | null
          quantity?: string | null
          required_certifications?: string[] | null
          required_trainings?: string[] | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          skills_required?: string[] | null
          sla_deadline?: string | null
          sla_type?: string
          slug?: string
          specifications?: string | null
          status?: string
          title?: string
          tor_data?: Json | null
          unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_assigned_vendor_id_fkey"
            columns: ["assigned_vendor_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_applications: {
        Row: {
          admin_decided_at: string | null
          admin_decided_by: string | null
          bid_amount: number | null
          cover_letter: string | null
          created_at: string
          id: string
          opportunity_id: string
          owner_decided_at: string | null
          owner_decision: string | null
          status: string
          user_id: string
        }
        Insert: {
          admin_decided_at?: string | null
          admin_decided_by?: string | null
          bid_amount?: number | null
          cover_letter?: string | null
          created_at?: string
          id?: string
          opportunity_id: string
          owner_decided_at?: string | null
          owner_decision?: string | null
          status?: string
          user_id: string
        }
        Update: {
          admin_decided_at?: string | null
          admin_decided_by?: string | null
          bid_amount?: number | null
          cover_letter?: string | null
          created_at?: string
          id?: string
          opportunity_id?: string
          owner_decided_at?: string | null
          owner_decision?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_applications_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      order_claims: {
        Row: {
          admin_notes: string | null
          bid_amount: number | null
          business_id: string | null
          claim_as: string
          cover_note: string | null
          created_at: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          source_id: string
          source_type: string
          status: string
          team_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          bid_amount?: number | null
          business_id?: string | null
          claim_as?: string
          cover_note?: string | null
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_id: string
          source_type: string
          status?: string
          team_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          bid_amount?: number | null
          business_id?: string | null
          claim_as?: string
          cover_note?: string | null
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_id?: string
          source_type?: string
          status?: string
          team_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_claims_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_claims_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "partner_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          admin_notes: string | null
          assigned_to: string | null
          assigned_vendor_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          expertise_slug: string
          id: string
          items: Json
          notes: string | null
          order_number: string
          reviewed_at: string | null
          reviewed_by: string | null
          service_slug: string
          sla_deadline: string | null
          sla_type: string
          status: string
          total_cents: number
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          assigned_to?: string | null
          assigned_vendor_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          expertise_slug: string
          id?: string
          items?: Json
          notes?: string | null
          order_number: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_slug: string
          sla_deadline?: string | null
          sla_type?: string
          status?: string
          total_cents?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          assigned_to?: string | null
          assigned_vendor_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          expertise_slug?: string
          id?: string
          items?: Json
          notes?: string | null
          order_number?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_slug?: string
          sla_deadline?: string | null
          sla_type?: string
          status?: string
          total_cents?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_assigned_vendor_id_fkey"
            columns: ["assigned_vendor_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_team_members: {
        Row: {
          id: string
          joined_at: string
          role: string
          status: string
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: string
          status?: string
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: string
          status?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "partner_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_teams: {
        Row: {
          admin_notes: string | null
          approval_status: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          logo_url: string | null
          max_members: number | null
          name: string
          oveercode: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          skills: string[] | null
          slug: string
          status: string
          suggested_team_id: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          approval_status?: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          logo_url?: string | null
          max_members?: number | null
          name: string
          oveercode?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          skills?: string[] | null
          slug: string
          status?: string
          suggested_team_id?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          approval_status?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          max_members?: number | null
          name?: string
          oveercode?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          skills?: string[] | null
          slug?: string
          status?: string
          suggested_team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_teams_suggested_team_id_fkey"
            columns: ["suggested_team_id"]
            isOneToOne: false
            referencedRelation: "partner_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_stats: {
        Row: {
          stat_key: string
          stat_numeric: number | null
          stat_value: string
          updated_at: string
        }
        Insert: {
          stat_key: string
          stat_numeric?: number | null
          stat_value: string
          updated_at?: string
        }
        Update: {
          stat_key?: string
          stat_numeric?: number | null
          stat_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      pm_board_statuses: {
        Row: {
          color: string
          company_id: string
          created_at: string
          id: string
          label: string
          slug: string
          sort_order: number
        }
        Insert: {
          color?: string
          company_id: string
          created_at?: string
          id?: string
          label: string
          slug: string
          sort_order?: number
        }
        Update: {
          color?: string
          company_id?: string
          created_at?: string
          id?: string
          label?: string
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "pm_board_statuses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      pm_projects: {
        Row: {
          company_id: string | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          start_date: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pm_projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      pm_task_assignees: {
        Row: {
          assignment_status: string
          created_at: string
          id: string
          job_desc_item_id: string | null
          task_id: string
          user_id: string
        }
        Insert: {
          assignment_status?: string
          created_at?: string
          id?: string
          job_desc_item_id?: string | null
          task_id: string
          user_id: string
        }
        Update: {
          assignment_status?: string
          created_at?: string
          id?: string
          job_desc_item_id?: string | null
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pm_task_assignees_job_desc_item_id_fkey"
            columns: ["job_desc_item_id"]
            isOneToOne: false
            referencedRelation: "hrm_job_desc_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_task_assignees_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "pm_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      pm_tasks: {
        Row: {
          assigned_to: string | null
          assignment_status: string
          company_id: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          job_desc_item_id: string | null
          priority: string
          project_id: string | null
          start_date: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          assignment_status?: string
          company_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          job_desc_item_id?: string | null
          priority?: string
          project_id?: string | null
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          assignment_status?: string
          company_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          job_desc_item_id?: string | null
          priority?: string
          project_id?: string | null
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pm_tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_tasks_job_desc_item_id_fkey"
            columns: ["job_desc_item_id"]
            isOneToOne: false
            referencedRelation: "hrm_job_desc_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "pm_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      proc_po_items: {
        Row: {
          amount: number | null
          description: string
          id: string
          po_id: string
          quantity: number | null
          unit_price: number | null
        }
        Insert: {
          amount?: number | null
          description: string
          id?: string
          po_id: string
          quantity?: number | null
          unit_price?: number | null
        }
        Update: {
          amount?: number | null
          description?: string
          id?: string
          po_id?: string
          quantity?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "proc_po_items_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "proc_purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      proc_purchase_orders: {
        Row: {
          company_id: string | null
          created_at: string
          delivery_date: string | null
          id: string
          notes: string | null
          order_date: string
          po_number: string
          status: string
          total: number | null
          updated_at: string
          user_id: string
          vendor_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          po_number: string
          status?: string
          total?: number | null
          updated_at?: string
          user_id: string
          vendor_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          po_number?: string
          status?: string
          total?: number | null
          updated_at?: string
          user_id?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proc_purchase_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proc_purchase_orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "proc_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      proc_purchase_requests: {
        Row: {
          approved_by: string | null
          company_id: string | null
          created_at: string
          currency: string | null
          description: string | null
          estimated_amount: number | null
          id: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_by?: string | null
          company_id?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          estimated_amount?: number | null
          id?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_by?: string | null
          company_id?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          estimated_amount?: number | null
          id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proc_purchase_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      proc_vendors: {
        Row: {
          address: string | null
          company_id: string | null
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          company_id?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          company_id?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proc_vendors_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_boosts: {
        Row: {
          boost_tier: string
          created_at: string
          credit_cost: number
          expires_at: string
          id: string
          started_at: string
          status: string
          user_id: string
        }
        Insert: {
          boost_tier: string
          created_at?: string
          credit_cost: number
          expires_at: string
          id?: string
          started_at?: string
          status?: string
          user_id: string
        }
        Update: {
          boost_tier?: string
          created_at?: string
          credit_cost?: number
          expires_at?: string
          id?: string
          started_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_change_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          field_name: string
          id: string
          new_value: string | null
          old_value: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          field_name: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          field_name?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_contact_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          message: string
          purpose: string
          sender_company: string | null
          sender_email: string
          sender_name: string
          status: string
          target_user_id: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          message: string
          purpose: string
          sender_company?: string | null
          sender_email: string
          sender_name: string
          status?: string
          target_user_id: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          message?: string
          purpose?: string
          sender_company?: string | null
          sender_email?: string
          sender_name?: string
          status?: string
          target_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      profile_edit_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          field_changes: Json
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          field_changes: Json
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          field_changes?: Json
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_reminder_logs: {
        Row: {
          completeness_score: number
          id: string
          sent_at: string
          user_id: string
        }
        Insert: {
          completeness_score?: number
          id?: string
          sent_at?: string
          user_id: string
        }
        Update: {
          completeness_score?: number
          id?: string
          sent_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_unlocks: {
        Row: {
          created_at: string
          id: string
          opportunity_id: string | null
          profile_user_id: string
          unlock_type: string
          unlocked_by: string
        }
        Insert: {
          created_at?: string
          id?: string
          opportunity_id?: string | null
          profile_user_id: string
          unlock_type?: string
          unlocked_by: string
        }
        Update: {
          created_at?: string
          id?: string
          opportunity_id?: string | null
          profile_user_id?: string
          unlock_type?: string
          unlocked_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_unlocks_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: string
          address: string | null
          avatar_url: string | null
          bio: string | null
          certifications: Json | null
          city: string | null
          country: string | null
          created_at: string
          credit_score: number | null
          daily_rate: number | null
          date_of_birth: string | null
          district: string | null
          education: Json | null
          email_verified: boolean
          email_verified_at: string | null
          expected_salary_currency: string | null
          formatted_address: string | null
          full_name: string | null
          gender: string | null
          headline: string | null
          highest_education: string | null
          id: string
          kyc_status: string
          languages: string | null
          last_online: string | null
          last_seen_at: string | null
          latitude: number | null
          linkedin_url: string | null
          location_source: string | null
          longitude: number | null
          marital_status: string | null
          medical_record: string | null
          monthly_salary_rate: number | null
          nationality: string | null
          opportunity_availability: string | null
          oveercode: string
          phone_number: string | null
          postal_code: string | null
          professional_summary: string | null
          province: string | null
          role: string | null
          skills: string[] | null
          soft_skills: Json | null
          subdistrict: string | null
          technical_skills: Json | null
          updated_at: string
          user_id: string
          username: string | null
          verification_token: string | null
          verification_token_expires_at: string | null
          website_url: string | null
          welcome_email_sent: boolean | null
          work_experience: Json | null
          years_of_experience: number | null
        }
        Insert: {
          account_type?: string
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          certifications?: Json | null
          city?: string | null
          country?: string | null
          created_at?: string
          credit_score?: number | null
          daily_rate?: number | null
          date_of_birth?: string | null
          district?: string | null
          education?: Json | null
          email_verified?: boolean
          email_verified_at?: string | null
          expected_salary_currency?: string | null
          formatted_address?: string | null
          full_name?: string | null
          gender?: string | null
          headline?: string | null
          highest_education?: string | null
          id?: string
          kyc_status?: string
          languages?: string | null
          last_online?: string | null
          last_seen_at?: string | null
          latitude?: number | null
          linkedin_url?: string | null
          location_source?: string | null
          longitude?: number | null
          marital_status?: string | null
          medical_record?: string | null
          monthly_salary_rate?: number | null
          nationality?: string | null
          opportunity_availability?: string | null
          oveercode: string
          phone_number?: string | null
          postal_code?: string | null
          professional_summary?: string | null
          province?: string | null
          role?: string | null
          skills?: string[] | null
          soft_skills?: Json | null
          subdistrict?: string | null
          technical_skills?: Json | null
          updated_at?: string
          user_id: string
          username?: string | null
          verification_token?: string | null
          verification_token_expires_at?: string | null
          website_url?: string | null
          welcome_email_sent?: boolean | null
          work_experience?: Json | null
          years_of_experience?: number | null
        }
        Update: {
          account_type?: string
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          certifications?: Json | null
          city?: string | null
          country?: string | null
          created_at?: string
          credit_score?: number | null
          daily_rate?: number | null
          date_of_birth?: string | null
          district?: string | null
          education?: Json | null
          email_verified?: boolean
          email_verified_at?: string | null
          expected_salary_currency?: string | null
          formatted_address?: string | null
          full_name?: string | null
          gender?: string | null
          headline?: string | null
          highest_education?: string | null
          id?: string
          kyc_status?: string
          languages?: string | null
          last_online?: string | null
          last_seen_at?: string | null
          latitude?: number | null
          linkedin_url?: string | null
          location_source?: string | null
          longitude?: number | null
          marital_status?: string | null
          medical_record?: string | null
          monthly_salary_rate?: number | null
          nationality?: string | null
          opportunity_availability?: string | null
          oveercode?: string
          phone_number?: string | null
          postal_code?: string | null
          professional_summary?: string | null
          province?: string | null
          role?: string | null
          skills?: string[] | null
          soft_skills?: Json | null
          subdistrict?: string | null
          technical_skills?: Json | null
          updated_at?: string
          user_id?: string
          username?: string | null
          verification_token?: string | null
          verification_token_expires_at?: string | null
          website_url?: string | null
          welcome_email_sent?: boolean | null
          work_experience?: Json | null
          years_of_experience?: number | null
        }
        Relationships: []
      }
      program_instructors: {
        Row: {
          created_at: string
          id: string
          instructor_id: string
          program_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          instructor_id: string
          program_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          instructor_id?: string
          program_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "program_instructors_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      program_orders: {
        Row: {
          amount: number
          check_in_method: string | null
          checked_in_at: string | null
          checked_in_by: string | null
          created_at: string
          currency: string
          discount_amount: number | null
          email: string
          full_name: string
          id: string
          order_number: string
          original_amount: number | null
          package_label: string
          package_type: string
          phone: string
          program_category: string
          program_slug: string
          program_title: string
          status: string
          updated_at: string
          user_id: string | null
          voucher_code: string | null
          voucher_codes: string[] | null
          voucher_discount_amount: number
          xendit_invoice_id: string | null
          xendit_invoice_url: string | null
          xendit_paid_at: string | null
          xendit_payment_method: string | null
        }
        Insert: {
          amount: number
          check_in_method?: string | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string
          currency?: string
          discount_amount?: number | null
          email: string
          full_name: string
          id?: string
          order_number: string
          original_amount?: number | null
          package_label: string
          package_type: string
          phone: string
          program_category: string
          program_slug: string
          program_title: string
          status?: string
          updated_at?: string
          user_id?: string | null
          voucher_code?: string | null
          voucher_codes?: string[] | null
          voucher_discount_amount?: number
          xendit_invoice_id?: string | null
          xendit_invoice_url?: string | null
          xendit_paid_at?: string | null
          xendit_payment_method?: string | null
        }
        Update: {
          amount?: number
          check_in_method?: string | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string
          currency?: string
          discount_amount?: number | null
          email?: string
          full_name?: string
          id?: string
          order_number?: string
          original_amount?: number | null
          package_label?: string
          package_type?: string
          phone?: string
          program_category?: string
          program_slug?: string
          program_title?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          voucher_code?: string | null
          voucher_codes?: string[] | null
          voucher_discount_amount?: number
          xendit_invoice_id?: string | null
          xendit_invoice_url?: string | null
          xendit_paid_at?: string | null
          xendit_payment_method?: string | null
        }
        Relationships: []
      }
      programs: {
        Row: {
          admin_notes: string | null
          approved_at: string | null
          approved_by: string | null
          badge: string | null
          category: string
          certificate_method: string
          created_at: string
          currency: string | null
          delivery_mode: string | null
          description: string | null
          duration: string | null
          faq: Json | null
          id: string
          institution_id: string | null
          instructor_avatar_url: string | null
          instructor_bio: string | null
          instructor_id: string
          instructor_name: string | null
          latitude: number | null
          learning_outcomes: string[] | null
          level: string | null
          location: string | null
          longitude: number | null
          organizer_type: string | null
          oveercode: string | null
          prerequisites: string[] | null
          price_cents: number | null
          rating: number | null
          slug: string
          status: string
          student_count: number | null
          syllabus: Json | null
          target_audience: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          badge?: string | null
          category?: string
          certificate_method?: string
          created_at?: string
          currency?: string | null
          delivery_mode?: string | null
          description?: string | null
          duration?: string | null
          faq?: Json | null
          id?: string
          institution_id?: string | null
          instructor_avatar_url?: string | null
          instructor_bio?: string | null
          instructor_id: string
          instructor_name?: string | null
          latitude?: number | null
          learning_outcomes?: string[] | null
          level?: string | null
          location?: string | null
          longitude?: number | null
          organizer_type?: string | null
          oveercode?: string | null
          prerequisites?: string[] | null
          price_cents?: number | null
          rating?: number | null
          slug: string
          status?: string
          student_count?: number | null
          syllabus?: Json | null
          target_audience?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          badge?: string | null
          category?: string
          certificate_method?: string
          created_at?: string
          currency?: string | null
          delivery_mode?: string | null
          description?: string | null
          duration?: string | null
          faq?: Json | null
          id?: string
          institution_id?: string | null
          instructor_avatar_url?: string | null
          instructor_bio?: string | null
          instructor_id?: string
          instructor_name?: string | null
          latitude?: number | null
          learning_outcomes?: string[] | null
          level?: string | null
          location?: string | null
          longitude?: number | null
          organizer_type?: string | null
          oveercode?: string | null
          prerequisites?: string[] | null
          price_cents?: number | null
          rating?: number | null
          slug?: string
          status?: string
          student_count?: number | null
          syllabus?: Json | null
          target_audience?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "programs_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      sd_candidates: {
        Row: {
          availability: string | null
          created_at: string | null
          experience_years: number | null
          id: string
          location: string | null
          resume_url: string | null
          salary_expectation: string | null
          skills: string[] | null
          title: string
          user_id: string
        }
        Insert: {
          availability?: string | null
          created_at?: string | null
          experience_years?: number | null
          id?: string
          location?: string | null
          resume_url?: string | null
          salary_expectation?: string | null
          skills?: string[] | null
          title: string
          user_id: string
        }
        Update: {
          availability?: string | null
          created_at?: string | null
          experience_years?: number | null
          id?: string
          location?: string | null
          resume_url?: string | null
          salary_expectation?: string | null
          skills?: string[] | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sd_candidates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "sd_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sd_companies: {
        Row: {
          company_name: string
          company_size: string | null
          created_at: string | null
          id: string
          industry: string | null
          job_openings: Json | null
          looking_for: string
          user_id: string
          vendor_needs: string[] | null
          website: string | null
        }
        Insert: {
          company_name: string
          company_size?: string | null
          created_at?: string | null
          id?: string
          industry?: string | null
          job_openings?: Json | null
          looking_for: string
          user_id: string
          vendor_needs?: string[] | null
          website?: string | null
        }
        Update: {
          company_name?: string
          company_size?: string | null
          created_at?: string | null
          id?: string
          industry?: string | null
          job_openings?: Json | null
          looking_for?: string
          user_id?: string
          vendor_needs?: string[] | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sd_companies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "sd_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sd_connections: {
        Row: {
          connection_type: string
          created_at: string | null
          id: string
          notes: string | null
          user1_id: string
          user2_id: string
        }
        Insert: {
          connection_type: string
          created_at?: string | null
          id?: string
          notes?: string | null
          user1_id: string
          user2_id: string
        }
        Update: {
          connection_type?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          user1_id?: string
          user2_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sd_connections_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "sd_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sd_connections_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "sd_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sd_investors: {
        Row: {
          created_at: string | null
          focus_industries: string[] | null
          id: string
          investment_range_max: number | null
          investment_range_min: number | null
          investor_type: string | null
          portfolio_url: string | null
          preferred_stage: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          focus_industries?: string[] | null
          id?: string
          investment_range_max?: number | null
          investment_range_min?: number | null
          investor_type?: string | null
          portfolio_url?: string | null
          preferred_stage?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          focus_industries?: string[] | null
          id?: string
          investment_range_max?: number | null
          investment_range_min?: number | null
          investor_type?: string | null
          portfolio_url?: string | null
          preferred_stage?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sd_investors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "sd_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sd_matches: {
        Row: {
          created_at: string | null
          id: string
          match_type: string
          matched_id: string
          matcher_id: string
          matcher_note: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          match_type: string
          matched_id: string
          matcher_id: string
          matcher_note?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          match_type?: string
          matched_id?: string
          matcher_id?: string
          matcher_note?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sd_matches_matched_id_fkey"
            columns: ["matched_id"]
            isOneToOne: false
            referencedRelation: "sd_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sd_matches_matcher_id_fkey"
            columns: ["matcher_id"]
            isOneToOne: false
            referencedRelation: "sd_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sd_profiles: {
        Row: {
          active_role: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          full_name: string
          id: string
          updated_at: string | null
          user_type: string
        }
        Insert: {
          active_role?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name: string
          id: string
          updated_at?: string | null
          user_type: string
        }
        Update: {
          active_role?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          updated_at?: string | null
          user_type?: string
        }
        Relationships: []
      }
      sd_projects: {
        Row: {
          created_at: string | null
          description: string
          funding_needed: number | null
          id: string
          industry: string | null
          pitch_deck_url: string | null
          project_name: string
          stage: string | null
          team_size: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description: string
          funding_needed?: number | null
          id?: string
          industry?: string | null
          pitch_deck_url?: string | null
          project_name: string
          stage?: string | null
          team_size?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string
          funding_needed?: number | null
          id?: string
          industry?: string | null
          pitch_deck_url?: string | null
          project_name?: string
          stage?: string | null
          team_size?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sd_projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "sd_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sd_students: {
        Row: {
          budget: string | null
          created_at: string | null
          current_level: string | null
          id: string
          interests: string[] | null
          learning_goals: string[] | null
          preferred_format: string[] | null
          user_id: string
        }
        Insert: {
          budget?: string | null
          created_at?: string | null
          current_level?: string | null
          id?: string
          interests?: string[] | null
          learning_goals?: string[] | null
          preferred_format?: string[] | null
          user_id: string
        }
        Update: {
          budget?: string | null
          created_at?: string | null
          current_level?: string | null
          id?: string
          interests?: string[] | null
          learning_goals?: string[] | null
          preferred_format?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sd_students_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "sd_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sd_subscription_plans: {
        Row: {
          created_at: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          max_roles: number | null
          name: string
          price: number | null
        }
        Insert: {
          created_at?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_roles?: number | null
          name: string
          price?: number | null
        }
        Update: {
          created_at?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_roles?: number | null
          name?: string
          price?: number | null
        }
        Relationships: []
      }
      sd_trainers: {
        Row: {
          certifications: string[] | null
          created_at: string | null
          experience_years: number | null
          expertise: string[] | null
          id: string
          rate: string | null
          training_format: string[] | null
          training_topics: string[] | null
          user_id: string
        }
        Insert: {
          certifications?: string[] | null
          created_at?: string | null
          experience_years?: number | null
          expertise?: string[] | null
          id?: string
          rate?: string | null
          training_format?: string[] | null
          training_topics?: string[] | null
          user_id: string
        }
        Update: {
          certifications?: string[] | null
          created_at?: string | null
          experience_years?: number | null
          expertise?: string[] | null
          id?: string
          rate?: string | null
          training_format?: string[] | null
          training_topics?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sd_trainers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "sd_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sd_user_roles: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          role_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          role_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          role_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sd_user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "sd_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sd_user_subscriptions: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          plan_id: string
          started_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          plan_id: string
          started_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          plan_id?: string
          started_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sd_user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "sd_subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sd_user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "sd_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sd_vendors: {
        Row: {
          capacity: string | null
          company_name: string
          created_at: string | null
          id: string
          industry_experience: string[] | null
          portfolio_url: string | null
          pricing_model: string | null
          services: string[] | null
          user_id: string
        }
        Insert: {
          capacity?: string | null
          company_name: string
          created_at?: string | null
          id?: string
          industry_experience?: string[] | null
          portfolio_url?: string | null
          pricing_model?: string | null
          services?: string[] | null
          user_id: string
        }
        Update: {
          capacity?: string | null
          company_name?: string
          created_at?: string | null
          id?: string
          industry_experience?: string[] | null
          portfolio_url?: string | null
          pricing_model?: string | null
          services?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sd_vendors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "sd_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_settings: {
        Row: {
          canonical_url: string | null
          description: string
          id: string
          keywords: string | null
          nofollow: boolean
          noindex: boolean
          og_description: string | null
          og_image: string | null
          og_title: string | null
          page_path: string
          sitemap_changefreq: string
          sitemap_include: boolean
          sitemap_priority: number
          structured_data: Json | null
          title: string
          twitter_description: string | null
          twitter_image: string | null
          twitter_title: string | null
          updated_at: string
        }
        Insert: {
          canonical_url?: string | null
          description?: string
          id?: string
          keywords?: string | null
          nofollow?: boolean
          noindex?: boolean
          og_description?: string | null
          og_image?: string | null
          og_title?: string | null
          page_path: string
          sitemap_changefreq?: string
          sitemap_include?: boolean
          sitemap_priority?: number
          structured_data?: Json | null
          title?: string
          twitter_description?: string | null
          twitter_image?: string | null
          twitter_title?: string | null
          updated_at?: string
        }
        Update: {
          canonical_url?: string | null
          description?: string
          id?: string
          keywords?: string | null
          nofollow?: boolean
          noindex?: boolean
          og_description?: string | null
          og_image?: string | null
          og_title?: string | null
          page_path?: string
          sitemap_changefreq?: string
          sitemap_include?: boolean
          sitemap_priority?: number
          structured_data?: Json | null
          title?: string
          twitter_description?: string | null
          twitter_image?: string | null
          twitter_title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      service_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      service_packages: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          expertise_slug: string
          features: Json
          id: string
          is_active: boolean
          package_name: string
          price_cents: number
          service_name: string
          service_slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          expertise_slug: string
          features?: Json
          id?: string
          is_active?: boolean
          package_name: string
          price_cents?: number
          service_name: string
          service_slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          expertise_slug?: string
          features?: Json
          id?: string
          is_active?: boolean
          package_name?: string
          price_cents?: number
          service_name?: string
          service_slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      service_thumbnails: {
        Row: {
          generated_at: string
          id: string
          image_url: string
          slug: string
        }
        Insert: {
          generated_at?: string
          id?: string
          image_url: string
          slug: string
        }
        Update: {
          generated_at?: string
          id?: string
          image_url?: string
          slug?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          min_match_pct: number
          name: string
          required_skills: string[]
          slug: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          min_match_pct?: number
          name: string
          required_skills?: string[]
          slug: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          min_match_pct?: number
          name?: string
          required_skills?: string[]
          slug?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value?: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          category: string
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      sso_authorization_codes: {
        Row: {
          client_id: string
          code: string
          code_challenge: string | null
          code_challenge_method: string | null
          created_at: string
          expires_at: string
          id: string
          redirect_uri: string
          scopes: string[]
          used: boolean
          user_id: string
        }
        Insert: {
          client_id: string
          code?: string
          code_challenge?: string | null
          code_challenge_method?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          redirect_uri: string
          scopes?: string[]
          used?: boolean
          user_id: string
        }
        Update: {
          client_id?: string
          code?: string
          code_challenge?: string | null
          code_challenge_method?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          redirect_uri?: string
          scopes?: string[]
          used?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sso_authorization_codes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "sso_clients"
            referencedColumns: ["client_id"]
          },
        ]
      }
      sso_clients: {
        Row: {
          allowed_scopes: string[]
          client_id: string
          client_name: string
          client_secret: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          redirect_uris: string[]
          updated_at: string
        }
        Insert: {
          allowed_scopes?: string[]
          client_id?: string
          client_name: string
          client_secret?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          redirect_uris?: string[]
          updated_at?: string
        }
        Update: {
          allowed_scopes?: string[]
          client_id?: string
          client_name?: string
          client_secret?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          redirect_uris?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      subscription_orders: {
        Row: {
          amount: number
          created_at: string
          currency: string
          email: string
          full_name: string
          id: string
          order_number: string
          original_amount: number
          paid_at: string | null
          phone: string
          plan_id: string
          plan_name: string
          status: string
          updated_at: string
          user_id: string
          voucher_code: string | null
          voucher_discount_amount: number
          xendit_invoice_id: string | null
          xendit_invoice_url: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          email?: string
          full_name?: string
          id?: string
          order_number?: string
          original_amount?: number
          paid_at?: string | null
          phone?: string
          plan_id: string
          plan_name: string
          status?: string
          updated_at?: string
          user_id: string
          voucher_code?: string | null
          voucher_discount_amount?: number
          xendit_invoice_id?: string | null
          xendit_invoice_url?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          email?: string
          full_name?: string
          id?: string
          order_number?: string
          original_amount?: number
          paid_at?: string | null
          phone?: string
          plan_id?: string
          plan_name?: string
          status?: string
          updated_at?: string
          user_id?: string
          voucher_code?: string | null
          voucher_discount_amount?: number
          xendit_invoice_id?: string | null
          xendit_invoice_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_orders_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          duration_days: number
          features: Json
          id: string
          is_active: boolean
          name: string
          price_cents: number
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          duration_days?: number
          features?: Json
          id?: string
          is_active?: boolean
          name: string
          price_cents?: number
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          duration_days?: number
          features?: Json
          id?: string
          is_active?: boolean
          name?: string
          price_cents?: number
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      survey_answers: {
        Row: {
          answer_value: string | null
          answer_values: string[] | null
          created_at: string
          id: string
          question_id: string
          response_id: string
          scale_value: number | null
        }
        Insert: {
          answer_value?: string | null
          answer_values?: string[] | null
          created_at?: string
          id?: string
          question_id: string
          response_id: string
          scale_value?: number | null
        }
        Update: {
          answer_value?: string | null
          answer_values?: string[] | null
          created_at?: string
          id?: string
          question_id?: string
          response_id?: string
          scale_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "survey_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_answers_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "survey_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_questions: {
        Row: {
          created_at: string
          id: string
          is_required: boolean
          options: Json | null
          question_text: string
          question_type: string
          sort_order: number
          survey_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_required?: boolean
          options?: Json | null
          question_text: string
          question_type?: string
          sort_order?: number
          survey_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_required?: boolean
          options?: Json | null
          question_text?: string
          question_type?: string
          sort_order?: number
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_questions_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_responses: {
        Row: {
          completed_at: string
          created_at: string
          id: string
          respondent_country: string | null
          respondent_industry: string | null
          survey_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          id?: string
          respondent_country?: string | null
          respondent_industry?: string | null
          survey_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          id?: string
          respondent_country?: string | null
          respondent_industry?: string | null
          survey_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      surveys: {
        Row: {
          article_id: string | null
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          id: string
          result_visibility: string
          slug: string
          starts_at: string | null
          status: string
          title: string
          total_responses: number
          updated_at: string
        }
        Insert: {
          article_id?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          result_visibility?: string
          slug: string
          starts_at?: string | null
          status?: string
          title: string
          total_responses?: number
          updated_at?: string
        }
        Update: {
          article_id?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          result_visibility?: string
          slug?: string
          starts_at?: string | null
          status?: string
          title?: string
          total_responses?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "surveys_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      swipes: {
        Row: {
          created_at: string
          direction: string
          id: string
          match_type: string
          swiped_id: string
          swiper_id: string
        }
        Insert: {
          created_at?: string
          direction: string
          id?: string
          match_type?: string
          swiped_id: string
          swiper_id: string
        }
        Update: {
          created_at?: string
          direction?: string
          id?: string
          match_type?: string
          swiped_id?: string
          swiper_id?: string
        }
        Relationships: []
      }
      talent_hiring_kpis: {
        Row: {
          icon_name: string
          id: string
          label: string
          sort_order: number | null
          updated_at: string | null
          value: string
        }
        Insert: {
          icon_name: string
          id?: string
          label: string
          sort_order?: number | null
          updated_at?: string | null
          value: string
        }
        Update: {
          icon_name?: string
          id?: string
          label?: string
          sort_order?: number | null
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      talent_industry_demand: {
        Row: {
          demand_index: number
          id: string
          industry: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          demand_index: number
          id?: string
          industry: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          demand_index?: number
          id?: string
          industry?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      talent_profiles: {
        Row: {
          availability_status: string | null
          bio_summary: string | null
          created_at: string | null
          experience_years: number | null
          id: string
          location_city: string | null
          performance_score: number | null
          readiness_level: string | null
          salary_expectation: number | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          availability_status?: string | null
          bio_summary?: string | null
          created_at?: string | null
          experience_years?: number | null
          id?: string
          location_city?: string | null
          performance_score?: number | null
          readiness_level?: string | null
          salary_expectation?: number | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          availability_status?: string | null
          bio_summary?: string | null
          created_at?: string | null
          experience_years?: number | null
          id?: string
          location_city?: string | null
          performance_score?: number | null
          readiness_level?: string | null
          salary_expectation?: number | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      talent_region_stats: {
        Row: {
          avg_salary: string
          growth: string
          id: string
          region: string
          sort_order: number | null
          top_skill: string
          updated_at: string | null
          verified_talent: string
        }
        Insert: {
          avg_salary: string
          growth: string
          id?: string
          region: string
          sort_order?: number | null
          top_skill: string
          updated_at?: string | null
          verified_talent: string
        }
        Update: {
          avg_salary?: string
          growth?: string
          id?: string
          region?: string
          sort_order?: number | null
          top_skill?: string
          updated_at?: string | null
          verified_talent?: string
        }
        Relationships: []
      }
      talent_shortage_alerts: {
        Row: {
          action_taken: string | null
          assigned_to: string | null
          business_id: string
          created_at: string
          hiring_request_id: string
          id: string
          resolved_at: string | null
          shortage_count: number
          skill_tags: string[] | null
          sla_deadline: string | null
          sla_type: string
          status: string
          updated_at: string
        }
        Insert: {
          action_taken?: string | null
          assigned_to?: string | null
          business_id: string
          created_at?: string
          hiring_request_id: string
          id?: string
          resolved_at?: string | null
          shortage_count?: number
          skill_tags?: string[] | null
          sla_deadline?: string | null
          sla_type?: string
          status?: string
          updated_at?: string
        }
        Update: {
          action_taken?: string | null
          assigned_to?: string | null
          business_id?: string
          created_at?: string
          hiring_request_id?: string
          id?: string
          resolved_at?: string | null
          shortage_count?: number
          skill_tags?: string[] | null
          sla_deadline?: string | null
          sla_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_shortage_alerts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_skills: {
        Row: {
          created_at: string | null
          id: string
          proficiency_level: number | null
          skill_id: string
          talent_id: string
          years_experience: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          proficiency_level?: number | null
          skill_id: string
          talent_id: string
          years_experience?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          proficiency_level?: number | null
          skill_id?: string
          talent_id?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "talent_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_skills_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_training: {
        Row: {
          certification_url: string | null
          completion_date: string | null
          created_at: string | null
          id: string
          program_id: string
          status: string | null
          talent_id: string
        }
        Insert: {
          certification_url?: string | null
          completion_date?: string | null
          created_at?: string | null
          id?: string
          program_id: string
          status?: string | null
          talent_id: string
        }
        Update: {
          certification_url?: string | null
          completion_date?: string | null
          created_at?: string | null
          id?: string
          program_id?: string
          status?: string | null
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_training_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "training_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_training_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      test_answers: {
        Row: {
          admin_feedback: string | null
          answer_text: string | null
          attempt_id: string
          created_at: string
          id: string
          is_correct: boolean | null
          points_awarded: number | null
          question_id: string
          selected_option: string | null
        }
        Insert: {
          admin_feedback?: string | null
          answer_text?: string | null
          attempt_id: string
          created_at?: string
          id?: string
          is_correct?: boolean | null
          points_awarded?: number | null
          question_id: string
          selected_option?: string | null
        }
        Update: {
          admin_feedback?: string | null
          answer_text?: string | null
          attempt_id?: string
          created_at?: string
          id?: string
          is_correct?: boolean | null
          points_awarded?: number | null
          question_id?: string
          selected_option?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "test_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "test_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      test_attempts: {
        Row: {
          created_at: string
          id: string
          is_free: boolean
          max_score: number | null
          payment_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          score: number | null
          started_at: string
          status: string
          submitted_at: string | null
          test_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_free?: boolean
          max_score?: number | null
          payment_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          score?: number | null
          started_at?: string
          status?: string
          submitted_at?: string | null
          test_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_free?: boolean
          max_score?: number | null
          payment_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          score?: number | null
          started_at?: string
          status?: string
          submitted_at?: string | null
          test_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_attempts_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "competency_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      test_questions: {
        Row: {
          correct_answer: string | null
          created_at: string
          id: string
          options: Json | null
          points: number
          question_text: string
          question_type: string
          session_number: number
          sort_order: number
          test_id: string
        }
        Insert: {
          correct_answer?: string | null
          created_at?: string
          id?: string
          options?: Json | null
          points?: number
          question_text: string
          question_type?: string
          session_number?: number
          sort_order?: number
          test_id: string
        }
        Update: {
          correct_answer?: string | null
          created_at?: string
          id?: string
          options?: Json | null
          points?: number
          question_text?: string
          question_type?: string
          session_number?: number
          sort_order?: number
          test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_questions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "competency_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      test_sessions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          attempt_id: string
          created_at: string
          id: string
          max_score: number | null
          score: number | null
          session_number: number
          started_at: string | null
          status: string
          submitted_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          attempt_id: string
          created_at?: string
          id?: string
          max_score?: number | null
          score?: number | null
          session_number: number
          started_at?: string | null
          status?: string
          submitted_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          attempt_id?: string
          created_at?: string
          id?: string
          max_score?: number | null
          score?: number | null
          session_number?: number
          started_at?: string | null
          status?: string
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_sessions_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "test_attempts"
            referencedColumns: ["id"]
          },
        ]
      }
      training_programs: {
        Row: {
          capacity: number | null
          created_at: string | null
          duration_weeks: number | null
          id: string
          name: string
          provider_id: string
          skill_id: string | null
          status: string | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          duration_weeks?: number | null
          id?: string
          name: string
          provider_id: string
          skill_id?: string | null
          status?: string | null
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          duration_weeks?: number | null
          id?: string
          name?: string
          provider_id?: string
          skill_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_programs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "training_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_programs_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      training_providers: {
        Row: {
          contact_email: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          specialization: string[] | null
          status: string | null
          website: string | null
        }
        Insert: {
          contact_email?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          specialization?: string[] | null
          status?: string | null
          website?: string | null
        }
        Update: {
          contact_email?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          specialization?: string[] | null
          status?: string | null
          website?: string | null
        }
        Relationships: []
      }
      user_activity_log: {
        Row: {
          activity_date: string
          created_at: string
          id: string
          page_views: number
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_date?: string
          created_at?: string
          id?: string
          page_views?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_date?: string
          created_at?: string
          id?: string
          page_views?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_activity_logs: {
        Row: {
          active_date: string
          created_at: string | null
          id: string
          page_views: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active_date?: string
          created_at?: string | null
          id?: string
          page_views?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active_date?: string
          created_at?: string | null
          id?: string
          page_views?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_awards: {
        Row: {
          created_at: string
          date_received: string | null
          description: string | null
          id: string
          issuer: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date_received?: string | null
          description?: string | null
          id?: string
          issuer?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          date_received?: string | null
          description?: string | null
          id?: string
          issuer?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      user_certifications: {
        Row: {
          created_at: string
          credential_id: string | null
          credential_url: string | null
          evidence_url: string | null
          expiry_date: string | null
          id: string
          issue_date: string | null
          issuing_organization: string
          name: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credential_id?: string | null
          credential_url?: string | null
          evidence_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_organization: string
          name: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credential_id?: string | null
          credential_url?: string | null
          evidence_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_organization?: string
          name?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      user_company_profiles: {
        Row: {
          company_description: string | null
          company_logo_url: string | null
          company_name: string | null
          company_website: string | null
          created_at: string
          founded_year: number | null
          id: string
          industry: string | null
          location: string | null
          team_size: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_description?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          company_website?: string | null
          created_at?: string
          founded_year?: number | null
          id?: string
          industry?: string | null
          location?: string | null
          team_size?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_description?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          company_website?: string | null
          created_at?: string
          founded_year?: number | null
          id?: string
          industry?: string | null
          location?: string | null
          team_size?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_credit_scores: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          notes: string | null
          provider_name: string
          report_date: string | null
          score_grade: string | null
          score_type: string
          score_value: number | null
          status: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          provider_name: string
          report_date?: string | null
          score_grade?: string | null
          score_type?: string
          score_value?: number | null
          status?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          provider_name?: string
          report_date?: string | null
          score_grade?: string | null
          score_type?: string
          score_value?: number | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      user_credit_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          type?: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_documents: {
        Row: {
          business_id: string | null
          created_at: string
          description: string | null
          document_type: string
          external_url: string | null
          file_url: string | null
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          description?: string | null
          document_type?: string
          external_url?: string | null
          file_url?: string | null
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string | null
          created_at?: string
          description?: string | null
          document_type?: string
          external_url?: string | null
          file_url?: string | null
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_documents_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_education: {
        Row: {
          created_at: string
          degree: string | null
          description: string | null
          end_date: string | null
          evidence_url: string | null
          field_of_study: string | null
          id: string
          institution: string
          institution_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          start_date: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          degree?: string | null
          description?: string | null
          end_date?: string | null
          evidence_url?: string | null
          field_of_study?: string | null
          id?: string
          institution: string
          institution_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          degree?: string | null
          description?: string | null
          end_date?: string | null
          evidence_url?: string | null
          field_of_study?: string | null
          id?: string
          institution?: string
          institution_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_education_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_experiences: {
        Row: {
          business_id: string | null
          company: string
          created_at: string
          description: string | null
          end_date: string | null
          evidence_url: string | null
          id: string
          is_current: boolean
          location: string | null
          position: string
          reviewed_at: string | null
          reviewed_by: string | null
          start_date: string | null
          status: string
          user_id: string
        }
        Insert: {
          business_id?: string | null
          company: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          evidence_url?: string | null
          id?: string
          is_current?: boolean
          location?: string | null
          position: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date?: string | null
          status?: string
          user_id: string
        }
        Update: {
          business_id?: string | null
          company?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          evidence_url?: string | null
          id?: string
          is_current?: boolean
          location?: string | null
          position?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_experiences_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_invitations: {
        Row: {
          created_at: string
          created_user_id: string | null
          email: string
          error_message: string | null
          full_name: string | null
          id: string
          invited_by: string | null
          phone_number: string | null
          status: string
        }
        Insert: {
          created_at?: string
          created_user_id?: string | null
          email: string
          error_message?: string | null
          full_name?: string | null
          id?: string
          invited_by?: string | null
          phone_number?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          created_user_id?: string | null
          email?: string
          error_message?: string | null
          full_name?: string | null
          id?: string
          invited_by?: string | null
          phone_number?: string | null
          status?: string
        }
        Relationships: []
      }
      user_issues: {
        Row: {
          admin_notes: string | null
          category: string
          created_at: string
          description: string | null
          id: string
          reported_by: string | null
          resolution_notes: string | null
          severity: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          reported_by?: string | null
          resolution_notes?: string | null
          severity?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          reported_by?: string | null
          resolution_notes?: string | null
          severity?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_medical_records: {
        Row: {
          admin_notes: string | null
          attachments: Json | null
          created_at: string
          description: string | null
          id: string
          provider: string | null
          record_date: string | null
          record_type: string
          status: string
          title: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          attachments?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          provider?: string | null
          record_date?: string | null
          record_type?: string
          status?: string
          title: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          attachments?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          provider?: string | null
          record_date?: string | null
          record_type?: string
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      user_organizations: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          is_current: boolean | null
          organization_name: string
          role: string | null
          start_date: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          organization_name: string
          role?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          organization_name?: string
          role?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_portfolios: {
        Row: {
          business_id: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          media_urls: string[] | null
          project_url: string | null
          title: string
          updated_at: string
          user_id: string
          video_type: string | null
          video_url: string | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          media_urls?: string[] | null
          project_url?: string | null
          title: string
          updated_at?: string
          user_id: string
          video_type?: string | null
          video_url?: string | null
        }
        Update: {
          business_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          media_urls?: string[] | null
          project_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          video_type?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_portfolios_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_presence: {
        Row: {
          is_online: boolean
          last_seen_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          is_online?: boolean
          last_seen_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          is_online?: boolean
          last_seen_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profile_analytics: {
        Row: {
          contact_requests_count: number
          cv_downloads_count: number
          id: string
          last_profile_view_at: string | null
          last_search_appearance_at: string | null
          profile_views: number
          search_appearances: number
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_requests_count?: number
          cv_downloads_count?: number
          id?: string
          last_profile_view_at?: string | null
          last_search_appearance_at?: string | null
          profile_views?: number
          search_appearances?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_requests_count?: number
          cv_downloads_count?: number
          id?: string
          last_profile_view_at?: string | null
          last_search_appearance_at?: string | null
          profile_views?: number
          search_appearances?: number
          updated_at?: string
          user_id?: string
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
      user_services: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          match_score: number | null
          service_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          match_score?: number | null
          service_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          match_score?: number | null
          service_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      user_skills: {
        Row: {
          created_at: string
          id: string
          level: number
          reviewed_at: string | null
          reviewed_by: string | null
          skill_name: string
          skill_type: string
          status: string
          user_id: string
          verified: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          level?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          skill_name: string
          skill_type?: string
          status?: string
          user_id: string
          verified?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          level?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          skill_name?: string
          skill_type?: string
          status?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: []
      }
      user_storage_usage: {
        Row: {
          id: string
          max_bytes: number
          total_bytes: number
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          max_bytes?: number
          total_bytes?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          max_bytes?: number
          total_bytes?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          admin_notes: string | null
          confirmed_by: string | null
          created_at: string
          expires_at: string | null
          id: string
          payment_proof_url: string | null
          plan_id: string
          starts_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          confirmed_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          payment_proof_url?: string | null
          plan_id: string
          starts_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          confirmed_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          payment_proof_url?: string | null
          plan_id?: string
          starts_at?: string | null
          status?: string
          updated_at?: string
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
      user_trainings: {
        Row: {
          certificate_url: string | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          organizer: string | null
          start_date: string | null
          status: string | null
          title: string
          training_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          certificate_url?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          organizer?: string | null
          start_date?: string | null
          status?: string | null
          title: string
          training_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          certificate_url?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          organizer?: string | null
          start_date?: string | null
          status?: string | null
          title?: string
          training_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      verified_skills: {
        Row: {
          id: string
          score: number | null
          skill_name: string
          source_id: string
          source_type: string
          user_id: string
          verified_at: string
        }
        Insert: {
          id?: string
          score?: number | null
          skill_name: string
          source_id: string
          source_type: string
          user_id: string
          verified_at?: string
        }
        Update: {
          id?: string
          score?: number | null
          skill_name?: string
          source_id?: string
          source_type?: string
          user_id?: string
          verified_at?: string
        }
        Relationships: []
      }
      vouchers: {
        Row: {
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean
          max_discount: number | null
          min_amount: number
          updated_at: string
          usage_limit: number | null
          used_count: number
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean
          max_discount?: number | null
          min_amount?: number
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          max_discount?: number | null
          min_amount?: number
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      wallet_balances: {
        Row: {
          balance: number
          business_id: string | null
          id: string
          total_deposited: number
          total_withdrawn: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          business_id?: string | null
          id?: string
          total_deposited?: number
          total_withdrawn?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          business_id?: string | null
          id?: string
          total_deposited?: number
          total_withdrawn?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_balances_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_deposits: {
        Row: {
          admin_notes: string | null
          amount: number
          business_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          deposit_number: string
          id: string
          method: string
          status: string
          updated_at: string
          user_id: string
          xendit_checkout_url: string | null
          xendit_invoice_id: string | null
          xendit_paid_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          amount?: number
          business_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          deposit_number?: string
          id?: string
          method?: string
          status?: string
          updated_at?: string
          user_id: string
          xendit_checkout_url?: string | null
          xendit_invoice_id?: string | null
          xendit_paid_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          business_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          deposit_number?: string
          id?: string
          method?: string
          status?: string
          updated_at?: string
          user_id?: string
          xendit_checkout_url?: string | null
          xendit_invoice_id?: string | null
          xendit_paid_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallet_deposits_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          business_id: string | null
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after?: number
          business_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          business_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number | null
          created_at: string | null
          currency: string | null
          escrow_balance: number | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          escrow_balance?: number | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          escrow_balance?: number | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          account_name: string | null
          account_number: string | null
          amount: number
          bank_name: string | null
          business_id: string | null
          created_at: string
          currency: string
          id: string
          notes: string | null
          processed_at: string | null
          processed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          amount?: number
          bank_name?: string | null
          business_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          amount?: number
          bank_name?: string | null
          business_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_get_users_auth_info: {
        Args: never
        Returns: {
          created_at: string
          email: string
          id: string
          last_sign_in_at: string
          raw_user_meta_data: Json
        }[]
      }
      calculate_match_score: {
        Args: {
          p_candidate_certs: string[]
          p_candidate_education: string
          p_candidate_exp: number
          p_candidate_skills: string[]
          p_job_certs: string[]
          p_job_education: string
          p_job_exp_max: number
          p_job_exp_min: number
          p_job_skills: string[]
        }
        Returns: number
      }
      calculate_service_match: {
        Args: { p_required_skills: string[]; p_user_skills: string[] }
        Returns: number
      }
      generate_certificate_serial: { Args: never; Returns: string }
      generate_credit_order_number: { Args: never; Returns: string }
      generate_deposit_number: { Args: never; Returns: string }
      generate_event_order_number: { Args: never; Returns: string }
      generate_gig_deposit_number: { Args: never; Returns: string }
      generate_order_number: { Args: never; Returns: string }
      generate_oveercode: { Args: never; Returns: string }
      generate_prefixed_oveercode: {
        Args: { prefix: string; target_table: string }
        Returns: string
      }
      generate_program_order_number: { Args: never; Returns: string }
      get_admin_dashboard_stats: { Args: never; Returns: Json }
      get_admin_skill_analytics: { Args: never; Returns: Json }
      get_employee_ids_for_user: {
        Args: { _user_id: string }
        Returns: string[]
      }
      get_sd_user_max_roles: {
        Args: { user_id_input: string }
        Returns: number
      }
      get_survey_results: { Args: { p_survey_id: string }; Returns: Json }
      get_user_business_ids: { Args: { _user_id: string }; Returns: string[] }
      get_user_company_ids: { Args: { _user_id: string }; Returns: string[] }
      get_user_email: { Args: { target_user_id: string }; Returns: string }
      get_user_id_by_email: { Args: { target_email: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_voucher_usage: { Args: { p_code: string }; Returns: undefined }
      is_business_admin: {
        Args: { _business_id: string; _user_id: string }
        Returns: boolean
      }
      is_company_admin: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      migrate_user_to_sd_profile: {
        Args: {
          full_name_input: string
          user_id_input: string
          user_type_input: string
        }
        Returns: undefined
      }
      update_marketing_cron: {
        Args: { cron_expression: string; is_enabled: boolean }
        Returns: undefined
      }
      update_profile_reminder_cron: {
        Args: { interval_days: number }
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "superadmin"
        | "instructor"
        | "investor"
        | "personal"
        | "company"
        | "talent"
      company_role: "owner" | "admin" | "member" | "company_admin"
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
      app_role: [
        "admin",
        "moderator",
        "user",
        "superadmin",
        "instructor",
        "investor",
        "personal",
        "company",
        "talent",
      ],
      company_role: ["owner", "admin", "member", "company_admin"],
    },
  },
} as const
