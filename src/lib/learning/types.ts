export type WeakArea =
  | "ideas"
  | "structure"
  | "interaction"
  | "language"
  | "delivery"
  | "timing";

export type PracticeMode = "group-discussion" | "individual-response";

export interface LearnerProfile {
  examYear: number;
  targetLevel: number;
  gdConfidence: number;
  irConfidence: number;
  weakAreas: WeakArea[];
  weeklyMinutes: number;
  completedOnboarding: boolean;
  updatedAt: string;
}

export interface LearningProgress {
  completedLessons: string[];
  practiceCount: number;
  practiceMinutes: number;
  lastActiveAt: string | null;
}

export interface LearningPlan {
  mode: PracticeMode;
  lessonSlug: string;
  title: string;
  reason: string;
  weeklyTasks: string[];
}

export interface LessonExample {
  label: string;
  text: string;
  note: string;
  tone: "weak" | "strong";
}

export interface Lesson {
  slug: string;
  mode: PracticeMode;
  number: string;
  title: string;
  englishTitle: string;
  summary: string;
  duration: number;
  skill: string;
  principle: string;
  steps: string[];
  examples: LessonExample[];
  prompt: string;
}
