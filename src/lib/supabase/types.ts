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
      pastpaper_papers: {
        Row: {
          created_at: string | null
          id: string
          paper_id: string
          paper_number: string
          part_a_article: string[]
          part_a_discussion_points: string[]
          part_a_source: string
          part_a_title: string
          part_b_questions: Json
          topic: string
          updated_at: string | null
          year: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          paper_id: string
          paper_number: string
          part_a_article: string[]
          part_a_discussion_points: string[]
          part_a_source: string
          part_a_title: string
          part_b_questions: Json
          topic: string
          updated_at?: string | null
          year: number
        }
        Update: {
          created_at?: string | null
          id?: string
          paper_id?: string
          paper_number?: string
          part_a_article?: string[]
          part_a_discussion_points?: string[]
          part_a_source?: string
          part_a_title?: string
          part_b_questions?: Json
          topic?: string
          updated_at?: string | null
          year?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          speaking_level: number
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id: string
          speaking_level?: number
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          speaking_level?: number
          updated_at?: string
        }
        Relationships: []
      }
      room_members: {
        Row: {
          id: string
          joined_at: string
          room_id: string
          speaking_order: number | null
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          room_id: string
          speaking_order?: number | null
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          room_id?: string
          speaking_order?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          created_at: string
          current_phase_end_at: string | null
          current_speaker_index: number | null
          host_id: string
          id: string
          max_members: number
          name: string
          paper_id: string | null
          status: "waiting" | "preparing" | "discussing" | "individual" | "finished"
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_phase_end_at?: string | null
          current_speaker_index?: number | null
          host_id: string
          id?: string
          max_members?: number
          name: string
          paper_id?: string | null
          status?: "waiting" | "preparing" | "discussing" | "individual" | "finished"
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_phase_end_at?: string | null
          current_speaker_index?: number | null
          host_id?: string
          id?: string
          max_members?: number
          name?: string
          paper_id?: string | null
          status?: "waiting" | "preparing" | "discussing" | "individual" | "finished"
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_paper_id_fkey"
            columns: ["paper_id"]
            isOneToOne: false
            referencedRelation: "pastpaper_papers"
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
      room_status:
        | "waiting"
        | "preparing"
        | "discussing"
        | "individual"
        | "finished"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types
export type RoomStatus = Database["public"]["Enums"]["room_status"]
export type Room = Database["public"]["Tables"]["rooms"]["Row"]
export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type RoomMember = Database["public"]["Tables"]["room_members"]["Row"]
export type PastPaper = Database["public"]["Tables"]["pastpaper_papers"]["Row"]

export type RoomWithDetails = Room & {
  host: Profile
  paper: PastPaper | null
  members: (RoomMember & { profile: Profile })[]
}
