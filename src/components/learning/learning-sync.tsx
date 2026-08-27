"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";
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
  const { user, loading, supabase } = useUser();
  const localProfile = useLearnerProfile();
  const localProgress = useLearningProgress();
  const [retryVersion, setRetryVersion] = useState(0);
  const lastSyncFingerprintRef = useRef<string | null>(null);
  const syncingRef = useRef(false);
  const errorShownRef = useRef(false);

  useEffect(() => {
    const retry = () => setRetryVersion((value) => value + 1);
    window.addEventListener("online", retry);
    return () => window.removeEventListener("online", retry);
  }, []);

  useEffect(() => {
    if (loading || !user) {
      if (!user) lastSyncFingerprintRef.current = null;
      return;
    }
    const fingerprint = JSON.stringify({
      userId: user.id,
      profileUpdatedAt: localProfile?.updatedAt ?? null,
      completedLessons: [...localProgress.completedLessons].sort(),
      retryVersion,
    });
    if (lastSyncFingerprintRef.current === fingerprint || syncingRef.current) return;
    syncingRef.current = true;

    const sync = async () => {
      try {
      const [{ data: remoteProfile, error: profileReadError }, { data: remoteLessons, error: lessonsReadError }] = await Promise.all([
        supabase.from("learner_profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("lesson_progress").select("lesson_slug, practice_minutes, completed_at").eq("user_id", user.id),
      ]);
      if (profileReadError || lessonsReadError) throw profileReadError ?? lessonsReadError;

      const remote = remoteProfile as RemoteProfile | null;
      const localIsNewer = localProfile && (!remote || new Date(localProfile.updatedAt).getTime() >= new Date(remote.updated_at).getTime());
      if (localProfile && localIsNewer) {
        const { error } = await supabase.from("learner_profiles").upsert({
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
        if (error) throw error;
      } else if (remote) {
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
        const { error } = await supabase.from("lesson_progress").upsert(mergedSlugs.map((lessonSlug) => ({ user_id: user.id, lesson_slug: lessonSlug })), { onConflict: "user_id,lesson_slug" });
        if (error) throw error;
      }
      if (mergedSlugs.length !== localProgress.completedLessons.length) {
        saveLearningProgress({ ...localProgress, completedLessons: mergedSlugs });
      }
      lastSyncFingerprintRef.current = fingerprint;
      errorShownRef.current = false;
      } catch {
        if (!errorShownRef.current) {
          toast.error("雲端同步暫時失敗，本機進度仍已保留；恢復連線後會自動重試。");
          errorShownRef.current = true;
        }
      } finally {
        syncingRef.current = false;
      }
    };

    void sync();
  }, [loading, localProfile, localProgress, retryVersion, supabase, user]);

  return null;
}
