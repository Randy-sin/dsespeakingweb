"use client";

import type { Profile, RoomMember } from "@/lib/supabase/types";

export type MemberWithProfile = RoomMember & { profiles: Profile };

export type DisplayParticipant = MemberWithProfile & { hasLeft: boolean };

export type PartBQuestion = {
  text?: string;
  question?: string;
  number?: number;
  difficulty?: string;
  difficulty_level?: string;
};

export type PartBSubphase = "selecting" | "countdown" | "answering";
