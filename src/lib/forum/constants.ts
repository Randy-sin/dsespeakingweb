import type {
  ForumPost,
  ForumPostStatus,
  ForumPostType,
  ForumTag,
  PastPaper,
} from "@/lib/supabase/types";

export const DEFAULT_FORUM_TAGS: Array<
  Pick<ForumTag, "slug" | "name" | "description">
> = [
  {
    slug: "exam-week",
    name: "Exam Week",
    description: "考前一週最值得看的重點討論與最後衝刺。",
  },
  {
    slug: "part-a",
    name: "Part A",
    description: "文章理解、討論點展開、立場建構。",
  },
  {
    slug: "part-b",
    name: "Part B",
    description: "個人回應思路、例子組織與臨場表達。",
  },
  {
    slug: "mock-review",
    name: "Mock Review",
    description: "練習後復盤、常見失誤與改進建議。",
  },
  {
    slug: "exam-tips",
    name: "Exam Tips",
    description: "考前策略、時間管理、搶答與互動技巧。",
  },
  {
    slug: "band-5",
    name: "Band 5+",
    description: "高分答法、自然表達和深度觀點示例。",
  },
];

export const FORUM_POST_TYPE_OPTIONS: Array<{
  value: ForumPostType;
  label: string;
  description: string;
}> = [
  {
    value: "paper_discussion",
    label: "整份真題討論",
    description: "圍繞某一份 paper 的整體思路、難點與切入方式。",
  },
  {
    value: "part_a_analysis",
    label: "Part A 分析",
    description: "文章觀點、討論點拆解、支持與反駁角度。",
  },
  {
    value: "part_b_idea",
    label: "Part B 答法",
    description: "個人回應思路、例子、結構和高分語言。",
  },
  {
    value: "mock_review",
    label: "模擬復盤",
    description: "練習後的表現回顧、常見失分與改進方向。",
  },
  {
    value: "exam_tips",
    label: "考前技巧",
    description: "這一週最需要的策略、時間分配與臨場應對。",
  },
];

export const PUBLISHED_POST_STATUS: ForumPostStatus = "published";

export function getPostTypeLabel(postType: ForumPostType) {
  return (
    FORUM_POST_TYPE_OPTIONS.find((option) => option.value === postType)?.label ??
    "Discussion"
  );
}

export function getPostTypeTone(postType: ForumPostType) {
  switch (postType) {
    case "part_a_analysis":
      return "text-emerald-700 bg-emerald-50 border-emerald-100";
    case "part_b_idea":
      return "text-sky-700 bg-sky-50 border-sky-100";
    case "mock_review":
      return "text-amber-700 bg-amber-50 border-amber-100";
    case "exam_tips":
      return "text-slate-700 bg-slate-100 border-slate-200";
    default:
      return "text-neutral-700 bg-neutral-100 border-neutral-200";
  }
}

export function buildPaperHref(paper: Pick<PastPaper, "paper_id"> | null) {
  return paper ? `/papers/${paper.paper_id}` : "/papers";
}

export function buildForumPostHref(post: Pick<ForumPost, "slug">) {
  return `/forum/${post.slug}`;
}

export function formatPaperShortLabel(
  paper: Pick<PastPaper, "year" | "paper_number" | "topic"> | null
) {
  if (!paper) return "General discussion";
  return `${paper.year} · ${paper.paper_number} · ${paper.topic}`;
}

export function extractExcerpt(content: string, maxLength = 180) {
  const normalized = content.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

export function slugifyTitle(title: string) {
  const ascii = title
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return ascii || "discussion";
}
