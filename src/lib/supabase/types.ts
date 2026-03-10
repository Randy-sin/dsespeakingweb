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
      pastpaper_papers: {
        Row: {
          created_at: string | null
          id: string
          page_images: string[] | null
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
          page_images?: string[] | null
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
          page_images?: string[] | null
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
          last_heartbeat_at: string
          role: string
          room_id: string
          speaking_order: number | null
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          last_heartbeat_at?: string
          role?: string
          room_id: string
          speaking_order?: number | null
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          last_heartbeat_at?: string
          role?: string
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
      marker_scores: {
        Row: {
          id: string
          room_id: string
          marker_id: string
          candidate_id: string
          pronunciation_delivery: number | null
          communication_strategies: number | null
          vocabulary_language: number | null
          ideas_organisation: number | null
          comment: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          room_id: string
          marker_id: string
          candidate_id: string
          pronunciation_delivery?: number | null
          communication_strategies?: number | null
          vocabulary_language?: number | null
          ideas_organisation?: number | null
          comment?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          marker_id?: string
          candidate_id?: string
          pronunciation_delivery?: number | null
          communication_strategies?: number | null
          vocabulary_language?: number | null
          ideas_organisation?: number | null
          comment?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marker_scores_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marker_scores_marker_id_fkey"
            columns: ["marker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marker_scores_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_tags: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      forum_posts: {
        Row: {
          author_id: string
          bookmark_count: number
          comment_count: number
          content: string
          created_at: string
          excerpt: string | null
          focus_label: string | null
          id: string
          is_featured: boolean
          last_activity_at: string
          like_count: number
          paper_id: string | null
          post_type: Database["public"]["Enums"]["forum_post_type"]
          slug: string
          status: Database["public"]["Enums"]["forum_post_status"]
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          author_id: string
          bookmark_count?: number
          comment_count?: number
          content: string
          created_at?: string
          excerpt?: string | null
          focus_label?: string | null
          id?: string
          is_featured?: boolean
          last_activity_at?: string
          like_count?: number
          paper_id?: string | null
          post_type?: Database["public"]["Enums"]["forum_post_type"]
          slug: string
          status?: Database["public"]["Enums"]["forum_post_status"]
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          author_id?: string
          bookmark_count?: number
          comment_count?: number
          content?: string
          created_at?: string
          excerpt?: string | null
          focus_label?: string | null
          id?: string
          is_featured?: boolean
          last_activity_at?: string
          like_count?: number
          paper_id?: string | null
          post_type?: Database["public"]["Enums"]["forum_post_type"]
          slug?: string
          status?: Database["public"]["Enums"]["forum_post_status"]
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "forum_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_posts_paper_id_fkey"
            columns: ["paper_id"]
            isOneToOne: false
            referencedRelation: "pastpaper_papers"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          deleted_at: string | null
          id: string
          like_count: number
          parent_id: string | null
          post_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          like_count?: number
          parent_id?: string | null
          post_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          like_count?: number
          parent_id?: string | null
          post_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "forum_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_post_likes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_bookmarks: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_post_tags: {
        Row: {
          post_id: string
          tag_id: string
        }
        Insert: {
          post_id: string
          tag_id: string
        }
        Update: {
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_post_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "forum_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          part_b_countdown_end_at: string | null
          part_b_subphase: string | null
          created_at: string
          current_phase_end_at: string | null
          current_speaker_index: number | null
          host_id: string
          id: string
          marker_questions: Json | null
          max_members: number
          name: string
          paper_id: string | null
          ready_votes: string[]
          scheduled_at: string | null
          skip_votes: string[]
          status: Database["public"]["Enums"]["room_status"]
          updated_at: string
          password_hash: string | null
        }
        Insert: {
          part_b_countdown_end_at?: string | null
          part_b_subphase?: string | null
          created_at?: string
          current_phase_end_at?: string | null
          current_speaker_index?: number | null
          host_id: string
          id?: string
          marker_questions?: Json | null
          max_members?: number
          name: string
          paper_id?: string | null
          ready_votes?: string[]
          scheduled_at?: string | null
          skip_votes?: string[]
          status?: Database["public"]["Enums"]["room_status"]
          updated_at?: string
          password_hash?: string | null
        }
        Update: {
          part_b_countdown_end_at?: string | null
          part_b_subphase?: string | null
          created_at?: string
          current_phase_end_at?: string | null
          current_speaker_index?: number | null
          host_id?: string
          id?: string
          marker_questions?: Json | null
          max_members?: number
          name?: string
          paper_id?: string | null
          ready_votes?: string[]
          scheduled_at?: string | null
          skip_votes?: string[]
          status?: Database["public"]["Enums"]["room_status"]
          updated_at?: string
          password_hash?: string | null
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
      forum_post_status: "draft" | "published" | "archived"
      forum_post_type:
        | "paper_discussion"
        | "part_a_analysis"
        | "part_b_idea"
        | "mock_review"
        | "exam_tips"
      room_status:
        | "waiting"
        | "preparing"
        | "discussing"
        | "individual"
        | "results"
        | "free_discussion"
        | "finished"
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

// Convenience type aliases
export type Room = Tables<"rooms">
export type Profile = Tables<"profiles">
export type RoomMember = Tables<"room_members">
export type PastPaper = Tables<"pastpaper_papers">
export type MarkerScore = Tables<"marker_scores">
export type ForumPost = Tables<"forum_posts">
export type ForumComment = Tables<"forum_comments">
export type ForumTag = Tables<"forum_tags">
export type ForumPostLike = Tables<"forum_post_likes">
export type ForumBookmark = Tables<"forum_bookmarks">
export type ForumPostTag = Tables<"forum_post_tags">
export type RoomStatus = Database["public"]["Enums"]["room_status"]
export type ForumPostType = Database["public"]["Enums"]["forum_post_type"]
export type ForumPostStatus = Database["public"]["Enums"]["forum_post_status"]

export const Constants = {
  public: {
    Enums: {
      forum_post_status: ["draft", "published", "archived"],
      forum_post_type: [
        "paper_discussion",
        "part_a_analysis",
        "part_b_idea",
        "mock_review",
        "exam_tips",
      ],
      room_status: [
        "waiting",
        "preparing",
        "discussing",
        "individual",
        "results",
        "free_discussion",
        "finished",
      ],
    },
  },
} as const
