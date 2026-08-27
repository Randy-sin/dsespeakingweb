"use client";

import Link from "next/link";
import { ArrowRight, TimerReset } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getNextLesson } from "@/lib/learning/content";
import { useLearnerProfile, useLearningProgress } from "@/lib/learning/store";

const firstIrSessionHref = "/practice/individual-response/session?type=making-choices";

export function HomePrimaryAction({ placement = "hero" }: { placement?: "hero" | "closing" }) {
  const profile = useLearnerProfile();
  const progress = useLearningProgress();
  const nextLesson = getNextLesson(progress.completedLessons);
  const needsFirstSpeakingAttempt = !profile && progress.practiceCount === 0;

  const href = needsFirstSpeakingAttempt
    ? "/onboarding"
    : nextLesson
      ? `/learn/${nextLesson.mode}/${nextLesson.slug}`
      : firstIrSessionHref;

  const label = needsFirstSpeakingAttempt
    ? "直接開始說"
    : nextLesson
      ? `繼續：${nextLesson.title}`
      : "開始今日口試練習";

  const Icon = placement === "closing" ? TimerReset : ArrowRight;

  return (
    <Button
      asChild
      className={
        placement === "closing"
          ? "h-[54px] w-full justify-between rounded-full bg-[#faf7ef] px-6 text-[#172019] hover:bg-white"
          : "h-[52px] max-w-full rounded-full bg-[#172019] px-7 text-[14px] text-[#faf7ef] hover:bg-[#324036]"
      }
    >
      <Link href={href}>
        <span className="truncate">{label}</span>
        <Icon className="h-4 w-4 shrink-0" />
      </Link>
    </Button>
  );
}
