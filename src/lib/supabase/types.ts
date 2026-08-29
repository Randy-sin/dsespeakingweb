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
  public: {
    Tables: {
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
      learner_profiles: {
        Row: {
          created_at: string
          exam_year: number
          gd_confidence: number
          ir_confidence: number
          onboarding_completed: boolean
          target_level: number
          updated_at: string
          user_id: string
          weak_areas: string[]
          weekly_minutes: number
        }
        Insert: {
          created_at?: string
          exam_year: number
          gd_confidence: number
          ir_confidence: number
          onboarding_completed?: boolean
          target_level: number
          updated_at?: string
          user_id: string
          weak_areas?: string[]
          weekly_minutes: number
        }
        Update: {
          created_at?: string
          exam_year?: number
          gd_confidence?: number
          ir_confidence?: number
          onboarding_completed?: boolean
          target_level?: number
          updated_at?: string
          user_id?: string
          weak_areas?: string[]
          weekly_minutes?: number
        }
        Relationships: []
      }
      lesson_progress: {
        Row: {
          completed_at: string
          created_at: string
          id: string
          lesson_slug: string
          practice_minutes: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          id?: string
          lesson_slug: string
          practice_minutes?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          id?: string
          lesson_slug?: string
          practice_minutes?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      marker_scores: {
        Row: {
          candidate_id: string
          comment: string | null
          communication_strategies: number | null
          created_at: string | null
          id: string
          ideas_organisation: number | null
          marker_id: string
          pronunciation_delivery: number | null
          room_id: string
          updated_at: string | null
          vocabulary_language: number | null
        }
        Insert: {
          candidate_id: string
          comment?: string | null
          communication_strategies?: number | null
          created_at?: string | null
          id?: string
          ideas_organisation?: number | null
          marker_id: string
          pronunciation_delivery?: number | null
          room_id: string
          updated_at?: string | null
          vocabulary_language?: number | null
        }
        Update: {
          candidate_id?: string
          comment?: string | null
          communication_strategies?: number | null
          created_at?: string | null
          id?: string
          ideas_organisation?: number | null
          marker_id?: string
          pronunciation_delivery?: number | null
          room_id?: string
          updated_at?: string | null
          vocabulary_language?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "marker_scores_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            foreignKeyName: "marker_scores_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
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
      practice_sessions: {
        Row: {
          created_at: string
          duration_seconds: number | null
          failure_reason: string | null
          feedback: Json | null
          id: string
          lesson_slug: string | null
          mode: string
          paper_id: string | null
          recording_path: string | null
          status: string
          task_text: string
          transcript: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          failure_reason?: string | null
          feedback?: Json | null
          id?: string
          lesson_slug?: string | null
          mode: string
          paper_id?: string | null
          recording_path?: string | null
          status?: string
          task_text: string
          transcript?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          failure_reason?: string | null
          feedback?: Json | null
          id?: string
          lesson_slug?: string | null
          mode?: string
          paper_id?: string | null
          recording_path?: string | null
          status?: string
          task_text?: string
          transcript?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_sessions_paper_id_fkey"
            columns: ["paper_id"]
            isOneToOne: false
            referencedRelation: "pastpaper_papers"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_turns: {
        Row: {
          created_at: string
          evidence_feedback: Json | null
          id: string
          sequence_number: number
          session_id: string
          speaker: string
          transcript: string
          user_id: string
        }
        Insert: {
          created_at?: string
          evidence_feedback?: Json | null
          id?: string
          sequence_number: number
          session_id: string
          speaker: string
          transcript: string
          user_id: string
        }
        Update: {
          created_at?: string
          evidence_feedback?: Json | null
          id?: string
          sequence_number?: number
          session_id?: string
          speaker?: string
          transcript?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_turns_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "practice_sessions"
            referencedColumns: ["id"]
          },
        ]
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
          last_heartbeat_at: string | null
          role: string
          room_id: string
          speaking_order: number | null
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          last_heartbeat_at?: string | null
          role?: string
          room_id: string
          speaking_order?: number | null
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          last_heartbeat_at?: string | null
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
      rooms: {
        Row: {
          created_at: string
          current_phase_end_at: string | null
          current_speaker_index: number | null
          host_id: string
          id: string
          marker_questions: Json | null
          max_members: number
          name: string
          paper_id: string | null
          part_b_countdown_end_at: string | null
          part_b_subphase: string | null
          password_hash: string | null
          ready_votes: string[]
          scheduled_at: string | null
          skip_votes: string[]
          status: Database["public"]["Enums"]["room_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_phase_end_at?: string | null
          current_speaker_index?: number | null
          host_id: string
          id?: string
          marker_questions?: Json | null
          max_members?: number
          name: string
          paper_id?: string | null
          part_b_countdown_end_at?: string | null
          part_b_subphase?: string | null
          password_hash?: string | null
          ready_votes?: string[]
          scheduled_at?: string | null
          skip_votes?: string[]
          status?: Database["public"]["Enums"]["room_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_phase_end_at?: string | null
          current_speaker_index?: number | null
          host_id?: string
          id?: string
          marker_questions?: Json | null
          max_members?: number
          name?: string
          paper_id?: string | null
          part_b_countdown_end_at?: string | null
          part_b_subphase?: string | null
          password_hash?: string | null
          ready_votes?: string[]
          scheduled_at?: string | null
          skip_votes?: string[]
          status?: Database["public"]["Enums"]["room_status"]
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
      cleanup_stale_room_members: { Args: never; Returns: undefined }
      consume_ai_rate_limit: {
        Args: { p_action: string }
        Returns: {
          allowed: boolean
          remaining: number
          retry_after_seconds: number
        }[]
      }
      get_product_analytics: { Args: { p_days?: number }; Returns: Json }
      ingest_product_event: {
        Args: {
          p_auth_state: string
          p_content_id: string
          p_context: string
          p_duration_bucket: string
          p_error_code: string
          p_event_id: string
          p_event_name: string
          p_ingest_token: string
          p_input_source: string
          p_latency_bucket: string
          p_mode: string
          p_outcome: string
          p_round: number
          p_schema_version: number
          p_session_hash: string
          p_surface: string
        }
        Returns: boolean
      }
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
        | "finished"
        | "results"
        | "free_discussion"
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
        "finished",
        "results",
        "free_discussion",
      ],
    },
  },
} as const

// Stable application aliases kept alongside the generated database schema.
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
