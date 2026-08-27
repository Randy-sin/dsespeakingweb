export type VoiceAttemptState = "idle" | "recording" | "recorded" | "text";

type VoiceLessonReadiness = {
  recorderState: VoiceAttemptState;
  fallbackWordCount: number;
  confirmedSteps: number;
};

export function hasCompletedSpeakingAttempt(
  recorderState: VoiceAttemptState,
  fallbackWordCount: number,
) {
  return recorderState === "recorded"
    || (recorderState === "text" && fallbackWordCount >= 12);
}

export function canCompleteVoiceLesson({
  recorderState,
  fallbackWordCount,
  confirmedSteps,
}: VoiceLessonReadiness) {
  return hasCompletedSpeakingAttempt(recorderState, fallbackWordCount)
    && confirmedSteps >= 2;
}
