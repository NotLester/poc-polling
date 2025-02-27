// src/types/supabase.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | {[key: string]: Json | undefined}
  | Json[];

export type Database = {
  public: {
    Tables: {
      poll: {
        Row: {
          created_at: string;
          created_by: string;
          description: string | null;
          end_date: string;
          id: string;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          description?: string | null;
          end_date: string;
          id?: string;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          description?: string | null;
          end_date?: string;
          id?: string;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "public_poll_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      poll_question: {
        Row: {
          created_at: string;
          id: string;
          poll_id: string;
          question_text: string;
          position: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          poll_id: string;
          question_text: string;
          position: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          poll_id?: string;
          question_text?: string;
          position?: number;
        };
        Relationships: [
          {
            foreignKeyName: "public_poll_question_poll_id_fkey";
            columns: ["poll_id"];
            isOneToOne: false;
            referencedRelation: "poll";
            referencedColumns: ["id"];
          }
        ];
      };
      poll_log: {
        Row: {
          created_at: string;
          id: string;
          option: string;
          poll_id: string;
          question_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          option: string;
          poll_id: string;
          question_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          option?: string;
          poll_id?: string;
          question_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "public_poll_log_poll_id_fkey";
            columns: ["poll_id"];
            isOneToOne: false;
            referencedRelation: "poll";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_poll_log_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "poll_question";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_poll_log_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      poll_option: {
        Row: {
          count: number;
          created_at: string;
          id: string;
          option: string;
          question_id: string;
        };
        Insert: {
          count?: number;
          created_at?: string;
          id?: string;
          option: string;
          question_id: string;
        };
        Update: {
          count?: number;
          created_at?: string;
          id?: string;
          option?: string;
          question_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "public_poll_option_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "poll_question";
            referencedColumns: ["id"];
          }
        ];
      };
      users: {
        Row: {
          avatar_url: string | null;
          email: string | null;
          id: string;
          user_name: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          email?: string | null;
          id: string;
          user_name?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          email?: string | null;
          id?: string;
          user_name?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "users_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_poll: {
        Args: {
          title: string;
          end_date: string;
          options: string[];
          description: string;
        };
        Returns: string;
      };
      create_poll_with_questions: {
        Args: {
          title: string;
          end_date: string;
          description: string;
          questions: Json;
        };
        Returns: string;
      };
      update_poll: {
        Args: {
          update_id: string;
          option_name: string;
        };
        Returns: void;
      };
      vote_on_question: {
        Args: {
          question_id: string;
          option_text: string;
        };
        Returns: void;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | {schema: keyof Database},
  TableName extends PublicTableNameOrOptions extends {schema: keyof Database}
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends {schema: keyof Database}
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
      PublicSchema["Views"])
  ? (PublicSchema["Tables"] &
      PublicSchema["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | {schema: keyof Database},
  TableName extends PublicTableNameOrOptions extends {schema: keyof Database}
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends {schema: keyof Database}
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | {schema: keyof Database},
  TableName extends PublicTableNameOrOptions extends {schema: keyof Database}
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends {schema: keyof Database}
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | {schema: keyof Database},
  EnumName extends PublicEnumNameOrOptions extends {schema: keyof Database}
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends {schema: keyof Database}
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
  ? PublicSchema["Enums"][PublicEnumNameOrOptions]
  : never;
