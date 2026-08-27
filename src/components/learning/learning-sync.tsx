"use client";

import { useEffect, useMemo, useRef } from "react";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import { saveLearnerProfile, saveLearningProgress, useLearnerProfile, useLearningProgress } from "@/lib/learning/store";
import type { LearnerProfile } from "@/lib/learning/types";

type RemoteProfile = {
  exam_year: number;
  target_level: number;
  gd_confidence: number;
  ir_confidence: number;
  weak_areas: LearnerProfile["weakAreas"];
  weekly_minutes: number;
  onboarding_completed: boolean;
  updated_at: string;
};

export function LearningSync() {
  const { user, loading } = useUser();
  const localProfile = useLearnerProfile();
  const localProgress = useLearningProgress();
  const supabase = useMemo(() => createClient(), []);
  const syncedUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (loading || !user || syncedUserRef.current === user.id) return;
    syncedUserRef.current = user.id;

    const sync = async () => {
      const [{ data: remoteProfile }, { data: remoteLessons }] = await Promise.all([
        supabase.from("learner_profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("lesson_progress").select("lesson_slug, practice_minutes, completed_at").eq("user_id", user.id),
      ]);

      if (localProfile) {
        await supabase.from("learner_profiles").upsert({
          user_id: user.id,
          exam_year: localProfile.examYear,
          target_level: localProfile.targetLevel,
          gd_confidence: localProfile.gdConfidence,
          ir_confidence: localProfile.irConfidence,
          weak_areas: localProfile.weakAreas,
          weekly_minutes: localProfile.weeklyMinutes,
          onboarding_completed: localProfile.completedOnboarding,
          updated_at: localProfile.updatedAt,
        }, { onConflict: "user_id" });
      } else if (remoteProfile) {
        const remote = remoteProfile as RemoteProfile;
        saveLearnerProfile({
          examYear: remote.exam_year,
          targetLevel: remote.target_level,
          gdConfidence: remote.gd_confidence,
          irConfidence: remote.ir_confidence,
          weakAreas: remote.weak_areas,
          weeklyMinutes: remote.weekly_minutes,
          completedOnboarding: remote.onboarding_completed,
          updatedAt: remote.updated_at,
        });
      }

      const remoteSlugs = (remoteLessons ?? []).map((item) => item.lesson_slug as string);
      const mergedSlugs = Array.from(new Set([...remoteSlugs, ...localProgress.completedLessons]));
      if (mergedSlugs.length > 0) {
        await supabase.from("lesson_progress").upsert(mergedSlugs.map((lessonSlug) => ({ user_id: user.id, lesson_slug: lessonSlug })), { onConflict: "user_id,lesson_slug" });
      }
      if (mergedSlugs.length !== localProgress.completedLessons.length) {
        saveLearningProgress({ ...localProgress, completedLessons: mergedSlugs });
      }
    };

    void sync();
  }, [loading, localProfile, localProgress, supabase, user]);

  return null;
}
