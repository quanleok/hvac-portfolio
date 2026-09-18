import type {
  ClientSource,
  ClientStatus,
  DocumentStatus,
  DocumentType,
  EquipmentType,
  PaymentStatus,
  ServiceType,
} from "@/lib/admin/schema";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string;
          name: string;
          phone: string;
          email: string | null;
          address: string | null;
          city: string | null;
          zip: string | null;
          source: ClientSource;
          status: ClientStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone: string;
          email?: string | null;
          address?: string | null;
          city?: string | null;
          zip?: string | null;
          source?: ClientSource;
          status?: ClientStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string;
          email?: string | null;
          address?: string | null;
          city?: string | null;
          zip?: string | null;
          source?: ClientSource;
          status?: ClientStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          client_id: string;
          service_date: string;
          service_type: ServiceType;
          description: string | null;
          cost: number | null;
          payment_status: PaymentStatus;
          follow_up_date: string | null;
          follow_up_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          service_date?: string;
          service_type: ServiceType;
          description?: string | null;
          cost?: number | null;
          payment_status?: PaymentStatus;
          follow_up_date?: string | null;
          follow_up_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          service_date?: string;
          service_type?: ServiceType;
          description?: string | null;
          cost?: number | null;
          payment_status?: PaymentStatus;
          follow_up_date?: string | null;
          follow_up_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "services_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      documents: {
        Row: {
          id: string;
          client_id: string;
          linked_service_id: string | null;
          document_type: DocumentType;
          status: DocumentStatus;
          document_number: string;
          title: string | null;
          summary: string | null;
          notes: string | null;
          terms: string | null;
          issue_date: string;
          due_date: string | null;
          expires_on: string | null;
          tax_rate: number;
          discount_amount: number;
          deposit_amount: number;
          subtotal: number;
          tax_amount: number;
          total: number;
          balance_due: number;
          share_enabled: boolean;
          public_token: string;
          sent_at: string | null;
          viewed_at: string | null;
          approved_at: string | null;
          paid_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          linked_service_id?: string | null;
          document_type: DocumentType;
          status?: DocumentStatus;
          document_number: string;
          title?: string | null;
          summary?: string | null;
          notes?: string | null;
          terms?: string | null;
          issue_date?: string;
          due_date?: string | null;
          expires_on?: string | null;
          tax_rate?: number;
          discount_amount?: number;
          deposit_amount?: number;
          subtotal?: number;
          tax_amount?: number;
          total?: number;
          balance_due?: number;
          share_enabled?: boolean;
          public_token?: string;
          sent_at?: string | null;
          viewed_at?: string | null;
          approved_at?: string | null;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          linked_service_id?: string | null;
          document_type?: DocumentType;
          status?: DocumentStatus;
          document_number?: string;
          title?: string | null;
          summary?: string | null;
          notes?: string | null;
          terms?: string | null;
          issue_date?: string;
          due_date?: string | null;
          expires_on?: string | null;
          tax_rate?: number;
          discount_amount?: number;
          deposit_amount?: number;
          subtotal?: number;
          tax_amount?: number;
          total?: number;
          balance_due?: number;
          share_enabled?: boolean;
          public_token?: string;
          sent_at?: string | null;
          viewed_at?: string | null;
          approved_at?: string | null;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_linked_service_id_fkey";
            columns: ["linked_service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
      document_items: {
        Row: {
          id: string;
          document_id: string;
          sort_order: number;
          description: string;
          quantity: number;
          unit_price: number;
          line_total: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          sort_order?: number;
          description: string;
          quantity?: number;
          unit_price?: number;
          line_total?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          sort_order?: number;
          description?: string;
          quantity?: number;
          unit_price?: number;
          line_total?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "document_items_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
        ];
      };
      document_presets: {
        Row: {
          id: string;
          document_type: DocumentType;
          title: string | null;
          summary: string | null;
          notes: string | null;
          terms: string | null;
          tax_rate: number;
          discount_amount: number;
          deposit_amount: number;
          line_items: Array<{
            description: string;
            quantity: number;
            unit_price: number;
          }>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          document_type: DocumentType;
          title?: string | null;
          summary?: string | null;
          notes?: string | null;
          terms?: string | null;
          tax_rate?: number;
          discount_amount?: number;
          deposit_amount?: number;
          line_items?: Array<{
            description: string;
            quantity: number;
            unit_price: number;
          }>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          document_type?: DocumentType;
          title?: string | null;
          summary?: string | null;
          notes?: string | null;
          terms?: string | null;
          tax_rate?: number;
          discount_amount?: number;
          deposit_amount?: number;
          line_items?: Array<{
            description: string;
            quantity: number;
            unit_price: number;
          }>;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      equipment: {
        Row: {
          id: string;
          client_id: string;
          unit_type: EquipmentType;
          brand: string | null;
          model: string | null;
          install_year: number | null;
          warranty_expires: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          unit_type: EquipmentType;
          brand?: string | null;
          model?: string | null;
          install_year?: number | null;
          warranty_expires?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          unit_type?: EquipmentType;
          brand?: string | null;
          model?: string | null;
          install_year?: number | null;
          warranty_expires?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "equipment_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      notes: {
        Row: {
          id: string;
          client_id: string;
          note_text: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          note_text: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          note_text?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notes_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      media_sections: {
        Row: {
          id: string;
          title: string;
          kind: "single" | "strip";
          enabled: boolean;
          layout: "marquee" | "grid" | "carousel" | "fade";
          scroll_direction: "left" | "right";
          scroll_speed: "slow" | "medium" | "fast";
          items_visible: number;
          show_captions: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          title: string;
          kind: "single" | "strip";
          enabled?: boolean;
          layout?: "marquee" | "grid" | "carousel" | "fade";
          scroll_direction?: "left" | "right";
          scroll_speed?: "slow" | "medium" | "fast";
          items_visible?: number;
          show_captions?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          kind?: "single" | "strip";
          enabled?: boolean;
          layout?: "marquee" | "grid" | "carousel" | "fade";
          scroll_direction?: "left" | "right";
          scroll_speed?: "slow" | "medium" | "fast";
          items_visible?: number;
          show_captions?: boolean;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      marketing_campaigns: {
        Row: {
          id: string;
          name: string;
          status: "active" | "paused" | "completed" | "archived";
          template_key: string | null;
          title: string | null;
          body: string | null;
          offer: string | null;
          call_to_action: string | null;
          notes: string | null;
          selected_platforms: string[];
          media_strategy: "library" | "upload" | "generate-now" | "queue-ai" | "text-only";
          scheduled_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          status?: "active" | "paused" | "completed" | "archived";
          template_key?: string | null;
          title?: string | null;
          body?: string | null;
          offer?: string | null;
          call_to_action?: string | null;
          notes?: string | null;
          selected_platforms?: string[];
          media_strategy?: "library" | "upload" | "generate-now" | "queue-ai" | "text-only";
          scheduled_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          status?: "active" | "paused" | "completed" | "archived";
          template_key?: string | null;
          title?: string | null;
          body?: string | null;
          offer?: string | null;
          call_to_action?: string | null;
          notes?: string | null;
          selected_platforms?: string[];
          media_strategy?: "library" | "upload" | "generate-now" | "queue-ai" | "text-only";
          scheduled_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      marketing_posts: {
        Row: {
          id: string;
          campaign_id: string;
          campaign_name: string | null;
          platform: "facebook" | "sms" | "email" | "tiktok" | "youtube";
          status: "draft" | "needs_ai" | "ready" | "scheduled" | "posted" | "failed" | "archived";
          body: string | null;
          title: string | null;
          workflow: Json;
          scheduled_at: string | null;
          reminded_at: string | null;
          posted_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          campaign_id?: string;
          campaign_name?: string | null;
          platform: "facebook" | "sms" | "email" | "tiktok" | "youtube";
          status?: "draft" | "needs_ai" | "ready" | "scheduled" | "posted" | "failed" | "archived";
          body?: string | null;
          title?: string | null;
          workflow?: Json;
          scheduled_at?: string | null;
          reminded_at?: string | null;
          posted_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          campaign_name?: string | null;
          platform?: "facebook" | "sms" | "email" | "tiktok" | "youtube";
          status?: "draft" | "needs_ai" | "ready" | "scheduled" | "posted" | "failed" | "archived";
          body?: string | null;
          title?: string | null;
          workflow?: Json;
          scheduled_at?: string | null;
          reminded_at?: string | null;
          posted_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "marketing_posts_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "marketing_campaigns";
            referencedColumns: ["id"];
          },
        ];
      };
      marketing_post_media: {
        Row: {
          id: string;
          post_id: string;
          kind: "image" | "video";
          storage_path: string;
          mime_type: string;
          size_bytes: number;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          kind: "image" | "video";
          storage_path: string;
          mime_type: string;
          size_bytes: number;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          kind?: "image" | "video";
          storage_path?: string;
          mime_type?: string;
          size_bytes?: number;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "marketing_post_media_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "marketing_posts";
            referencedColumns: ["id"];
          },
        ];
      };
      marketing_accounts: {
        Row: {
          id: string;
          platform: "facebook" | "sms" | "email" | "tiktok" | "youtube";
          account_id: string;
          account_name: string;
          access_token: string;
          refresh_token: string | null;
          token_type: string;
          expires_at: string | null;
          scopes: string[];
          connected_by: string | null;
          connected_at: string;
          last_refreshed_at: string | null;
          is_active: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          platform: "facebook" | "sms" | "email" | "tiktok" | "youtube";
          account_id: string;
          account_name: string;
          access_token: string;
          refresh_token?: string | null;
          token_type?: string;
          expires_at?: string | null;
          scopes?: string[];
          connected_by?: string | null;
          connected_at?: string;
          last_refreshed_at?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
        Update: {
          id?: string;
          platform?: "facebook" | "sms" | "email" | "tiktok" | "youtube";
          account_id?: string;
          account_name?: string;
          access_token?: string;
          refresh_token?: string | null;
          token_type?: string;
          expires_at?: string | null;
          scopes?: string[];
          connected_by?: string | null;
          connected_at?: string;
          last_refreshed_at?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      marketing_assets: {
        Row: {
          id: string;
          campaign_id: string;
          post_id: string | null;
          media_id: string | null;
          generation_id: string | null;
          source: "library" | "upload" | "ai" | "openclaw";
          kind: "image" | "video" | "audio";
          storage_path: string | null;
          external_url: string | null;
          mime_type: string | null;
          size_bytes: number | null;
          label: string | null;
          approval_status: "draft" | "approved" | "rejected";
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          post_id?: string | null;
          media_id?: string | null;
          generation_id?: string | null;
          source: "library" | "upload" | "ai" | "openclaw";
          kind: "image" | "video" | "audio";
          storage_path?: string | null;
          external_url?: string | null;
          mime_type?: string | null;
          size_bytes?: number | null;
          label?: string | null;
          approval_status?: "draft" | "approved" | "rejected";
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          post_id?: string | null;
          media_id?: string | null;
          generation_id?: string | null;
          source?: "library" | "upload" | "ai" | "openclaw";
          kind?: "image" | "video" | "audio";
          storage_path?: string | null;
          external_url?: string | null;
          mime_type?: string | null;
          size_bytes?: number | null;
          label?: string | null;
          approval_status?: "draft" | "approved" | "rejected";
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "marketing_assets_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "marketing_campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "marketing_assets_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "marketing_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "marketing_assets_media_id_fkey";
            columns: ["media_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "marketing_assets_generation_id_fkey";
            columns: ["generation_id"];
            isOneToOne: false;
            referencedRelation: "ai_generations";
            referencedColumns: ["id"];
          },
        ];
      };
      marketing_agent_jobs: {
        Row: {
          id: string;
          campaign_id: string;
          post_id: string | null;
          job_type: "adapt_copy" | "generate_image" | "generate_video" | "assemble_video" | "publish" | "manual_review";
          status: "queued" | "running" | "completed" | "failed" | "cancelled";
          priority: number;
          input: Json;
          output: Json;
          error: string | null;
          attempts: number;
          locked_at: string | null;
          locked_by: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          post_id?: string | null;
          job_type: "adapt_copy" | "generate_image" | "generate_video" | "assemble_video" | "publish" | "manual_review";
          status?: "queued" | "running" | "completed" | "failed" | "cancelled";
          priority?: number;
          input?: Json;
          output?: Json;
          error?: string | null;
          attempts?: number;
          locked_at?: string | null;
          locked_by?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          post_id?: string | null;
          job_type?: "adapt_copy" | "generate_image" | "generate_video" | "assemble_video" | "publish" | "manual_review";
          status?: "queued" | "running" | "completed" | "failed" | "cancelled";
          priority?: number;
          input?: Json;
          output?: Json;
          error?: string | null;
          attempts?: number;
          locked_at?: string | null;
          locked_by?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "marketing_agent_jobs_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "marketing_campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "marketing_agent_jobs_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "marketing_posts";
            referencedColumns: ["id"];
          },
        ];
      };
      marketing_events: {
        Row: {
          id: string;
          campaign_id: string | null;
          post_id: string | null;
          actor: string;
          event_type: string;
          event_data: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          campaign_id?: string | null;
          post_id?: string | null;
          actor?: string;
          event_type: string;
          event_data?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string | null;
          post_id?: string | null;
          actor?: string;
          event_type?: string;
          event_data?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "marketing_events_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "marketing_campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "marketing_events_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "marketing_posts";
            referencedColumns: ["id"];
          },
        ];
      };
      service_tokens: {
        Row: {
          id: string;
          name: string;
          token_hash: string;
          token_prefix: string;
          created_by: string | null;
          created_at: string;
          last_used_at: string | null;
          is_active: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          token_hash: string;
          token_prefix: string;
          created_by?: string | null;
          created_at?: string;
          last_used_at?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          token_hash?: string;
          token_prefix?: string;
          created_by?: string | null;
          created_at?: string;
          last_used_at?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      ai_generations: {
        Row: {
          id: string;
          type: "image" | "video" | "music";
          model: string;
          prompt: string;
          parameters: Json;
          result_url: string;
          result_data: Json;
          duration_seconds: number | null;
          status: "pending" | "processing" | "completed" | "failed";
          task_id: string;
          media_library_id: string | null;
          used_in_post_id: string | null;
          created_at: string;
          created_by: string;
          version: number;
          started_at: string | null;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          type: "image" | "video" | "music";
          model: string;
          prompt: string;
          parameters?: Json;
          result_url: string;
          result_data?: Json;
          duration_seconds?: number | null;
          status?: "pending" | "processing" | "completed" | "failed";
          task_id: string;
          media_library_id?: string | null;
          used_in_post_id?: string | null;
          created_at?: string;
          created_by?: string;
          version?: number;
          started_at?: string | null;
          completed_at?: string | null;
        };
        Update: {
          type?: "image" | "video" | "music";
          model?: string;
          prompt?: string;
          parameters?: Json;
          result_url?: string;
          result_data?: Json;
          duration_seconds?: number | null;
          status?: "pending" | "processing" | "completed" | "failed";
          task_id?: string;
          media_library_id?: string | null;
          used_in_post_id?: string | null;
          created_by?: string;
          version?: number;
          started_at?: string | null;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_generations_media_library_id_fkey";
            columns: ["media_library_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_generations_used_in_post_id_fkey";
            columns: ["used_in_post_id"];
            isOneToOne: false;
            referencedRelation: "marketing_posts";
            referencedColumns: ["id"];
          },
        ];
      };
      media: {
        Row: {
          id: string;
          type: "image" | "video";
          storage_path: string;
          caption: string | null;
          alt: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: "image" | "video";
          storage_path: string;
          caption?: string | null;
          alt?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          type?: "image" | "video";
          storage_path?: string;
          caption?: string | null;
          alt?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      media_assignments: {
        Row: {
          id: string;
          media_id: string;
          section_id: string;
          sort_order: number;
          published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          media_id: string;
          section_id: string;
          sort_order?: number;
          published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          sort_order?: number;
          published?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "media_assignments_media_id_fkey";
            columns: ["media_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "media_assignments_section_id_fkey";
            columns: ["section_id"];
            isOneToOne: false;
            referencedRelation: "media_sections";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      search_clients: {
        Args: { search_term: string };
        Returns: Database["public"]["Tables"]["clients"]["Row"][];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type ClientRow = Database["public"]["Tables"]["clients"]["Row"];
export type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"];
export type ClientUpdate = Database["public"]["Tables"]["clients"]["Update"];
export type ServiceRow = Database["public"]["Tables"]["services"]["Row"];
export type ServiceInsert = Database["public"]["Tables"]["services"]["Insert"];
export type ServiceUpdate = Database["public"]["Tables"]["services"]["Update"];
export type DocumentRow = Database["public"]["Tables"]["documents"]["Row"];
export type DocumentInsert = Database["public"]["Tables"]["documents"]["Insert"];
export type DocumentUpdate = Database["public"]["Tables"]["documents"]["Update"];
export type DocumentItemRow = Database["public"]["Tables"]["document_items"]["Row"];
export type DocumentItemInsert = Database["public"]["Tables"]["document_items"]["Insert"];
export type DocumentItemUpdate = Database["public"]["Tables"]["document_items"]["Update"];
export type DocumentPresetRow = Database["public"]["Tables"]["document_presets"]["Row"];
export type DocumentPresetInsert = Database["public"]["Tables"]["document_presets"]["Insert"];
export type DocumentPresetUpdate = Database["public"]["Tables"]["document_presets"]["Update"];
export type EquipmentRow = Database["public"]["Tables"]["equipment"]["Row"];
export type EquipmentInsert = Database["public"]["Tables"]["equipment"]["Insert"];
export type EquipmentUpdate = Database["public"]["Tables"]["equipment"]["Update"];
export type NoteRow = Database["public"]["Tables"]["notes"]["Row"];
export type NoteInsert = Database["public"]["Tables"]["notes"]["Insert"];
export type NoteUpdate = Database["public"]["Tables"]["notes"]["Update"];
export type MediaRow = Database["public"]["Tables"]["media"]["Row"];
export type MediaInsert = Database["public"]["Tables"]["media"]["Insert"];
export type MediaUpdate = Database["public"]["Tables"]["media"]["Update"];
export type MediaSectionRow = Database["public"]["Tables"]["media_sections"]["Row"];
export type MediaSectionUpdate = Database["public"]["Tables"]["media_sections"]["Update"];
export type MediaAssignmentRow = Database["public"]["Tables"]["media_assignments"]["Row"];
export type MediaAssignmentInsert = Database["public"]["Tables"]["media_assignments"]["Insert"];
export type MediaAssignmentUpdate = Database["public"]["Tables"]["media_assignments"]["Update"];
export type MarketingCampaignRow = Database["public"]["Tables"]["marketing_campaigns"]["Row"];
export type MarketingCampaignInsert = Database["public"]["Tables"]["marketing_campaigns"]["Insert"];
export type MarketingCampaignUpdate = Database["public"]["Tables"]["marketing_campaigns"]["Update"];
export type MarketingPostRow = Database["public"]["Tables"]["marketing_posts"]["Row"];
export type MarketingPostInsert = Database["public"]["Tables"]["marketing_posts"]["Insert"];
export type MarketingPostUpdate = Database["public"]["Tables"]["marketing_posts"]["Update"];
export type MarketingPostMediaRow = Database["public"]["Tables"]["marketing_post_media"]["Row"];
export type MarketingPostMediaInsert = Database["public"]["Tables"]["marketing_post_media"]["Insert"];
export type MarketingAccountRow = Database["public"]["Tables"]["marketing_accounts"]["Row"];
export type MarketingAccountInsert = Database["public"]["Tables"]["marketing_accounts"]["Insert"];
export type MarketingAccountUpdate = Database["public"]["Tables"]["marketing_accounts"]["Update"];
export type MarketingAssetRow = Database["public"]["Tables"]["marketing_assets"]["Row"];
export type MarketingAssetInsert = Database["public"]["Tables"]["marketing_assets"]["Insert"];
export type MarketingAssetUpdate = Database["public"]["Tables"]["marketing_assets"]["Update"];
export type MarketingAgentJobRow = Database["public"]["Tables"]["marketing_agent_jobs"]["Row"];
export type MarketingAgentJobInsert = Database["public"]["Tables"]["marketing_agent_jobs"]["Insert"];
export type MarketingAgentJobUpdate = Database["public"]["Tables"]["marketing_agent_jobs"]["Update"];
export type MarketingEventRow = Database["public"]["Tables"]["marketing_events"]["Row"];
export type MarketingEventInsert = Database["public"]["Tables"]["marketing_events"]["Insert"];
export type ServiceTokenRow = Database["public"]["Tables"]["service_tokens"]["Row"];
export type ServiceTokenInsert = Database["public"]["Tables"]["service_tokens"]["Insert"];
export type ServiceTokenUpdate = Database["public"]["Tables"]["service_tokens"]["Update"];
export type AIGenerationRow = Database["public"]["Tables"]["ai_generations"]["Row"];
export type AIGenerationInsert = Database["public"]["Tables"]["ai_generations"]["Insert"];
export type AIGenerationUpdate = Database["public"]["Tables"]["ai_generations"]["Update"];
