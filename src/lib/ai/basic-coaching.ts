import type { PracticeMode } from "@/lib/learning/types";

export type BasicCoachingCheck = {
  id: "length" | "reason" | "example" | "structure" | "interaction";
  label: string;
  found: boolean;
  detail: string;
};

export type BasicAssessmentCoaching = {
  kind: "assessment";
  wordCount: number;
  sentenceCount: number;
  checks: BasicCoachingCheck[];
  nextSteps: string[];
  caveat: string;
};

export type BasicDiscussionDrill = {
  kind: "discussion";
  detectedMoves: string[];
  sentenceFrames: string[];
  instruction: string;
  caveat: string;
};

const REASON_MARKERS = ["because", "since", "one reason", "the reason"];
const EXAMPLE_MARKERS = ["for example", "for instance", "such as"];
const STRUCTURE_MARKERS = [
  "first",
  "second",
  "next",
  "however",
  "moreover",
  "on the other hand",
  "overall",
  "in conclusion",
  "finally",
];
const INTERACTION_MARKERS = [
  "i agree",
  "i disagree",
  "your point",
  "what do you think",
  "do you agree",
  "would you",
  "could we",
  "how about",
];

function wordsIn(text: string): string[] {
  return text.match(/[A-Za-z]+(?:['’\-][A-Za-z]+)*/g) ?? [];
}

function sentenceCountIn(text: string): number {
  const parts = text.split(/[.!?]+/).map((part) => part.trim()).filter(Boolean);
  return parts.length || (text.trim() ? 1 : 0);
}

function foundMarkers(text: string, markers: string[]): string[] {
  const normalized = ` ${text.toLowerCase().replace(/[^a-z'’\-]+/g, " ")} `;
  return markers.filter((marker) => normalized.includes(` ${marker} `));
}

function markerDetail(markers: string[]): string {
  return markers.length > 0 ? `偵測到：${markers.join("、")}` : "未偵測到常見句型標記";
}

export function buildBasicAssessmentCoaching(
  mode: PracticeMode,
  transcript: string,
): BasicAssessmentCoaching {
  const wordCount = wordsIn(transcript).length;
  const sentenceCount = sentenceCountIn(transcript);
  const reasons = foundMarkers(transcript, REASON_MARKERS);
  const examples = foundMarkers(transcript, EXAMPLE_MARKERS);
  const structure = foundMarkers(transcript, STRUCTURE_MARKERS);
  const interaction = foundMarkers(transcript, INTERACTION_MARKERS);

  const checks: BasicCoachingCheck[] = [
    {
      id: "length",
      label: "完成一段可檢查的回答",
      found: wordCount >= 40,
      detail: `${wordCount} 個英文詞、${sentenceCount} 個句段`,
    },
    {
      id: "reason",
      label: "使用理由標記",
      found: reasons.length > 0,
      detail: markerDetail(reasons),
    },
    {
      id: "example",
      label: "使用例子標記",
      found: examples.length > 0,
      detail: markerDetail(examples),
    },
    {
      id: "structure",
      label: "使用組織或轉折標記",
      found: structure.length > 0,
      detail: markerDetail(structure),
    },
  ];

  if (mode === "group-discussion") {
    checks.push({
      id: "interaction",
      label: "使用回應或邀請句型",
      found: interaction.length > 0,
      detail: markerDetail(interaction),
    });
  }

  const nextSteps: string[] = [];
  if (wordCount < 40) nextSteps.push("再補一個完整理由，令回答達到約 40 至 70 個英文詞。");
  if (reasons.length === 0) nextSteps.push("加入 because、since 或 one reason is，清楚連接觀點與原因。");
  if (examples.length === 0) nextSteps.push("加入 for example 或 for instance，再說一個具體情境。");
  if (structure.length === 0) nextSteps.push("加入 first、however 或 overall，讓聽眾聽得出答案次序。");
  if (mode === "group-discussion" && interaction.length === 0) {
    nextSteps.push("先接住上一位的觀點，再用 What do you think? 把發言交給下一位。");
  }
  if (nextSteps.length === 0) {
    nextSteps.push("保留現有結構，再重錄一次，嘗試用更短的句子自然說出同一內容。");
  }

  return {
    kind: "assessment",
    wordCount,
    sentenceCount,
    checks,
    nextSteps: nextSteps.slice(0, 3),
    caveat: "這是規則式基本提示，不是 AI 評分，也不能判斷內容質素、文法準確度、發音或流暢度。",
  };
}

export function buildBasicDiscussionDrill(transcript: string): BasicDiscussionDrill {
  const detectedMoves = foundMarkers(transcript, INTERACTION_MARKERS);
  return {
    kind: "discussion",
    detectedMoves,
    sentenceFrames: [
      "I agree with your point about ___ because ___.",
      "Another factor we should consider is ___.",
      "Would anyone like to add an example?",
    ],
    instruction: detectedMoves.length > 0
      ? "你已使用回應或邀請句型。選一個句框，加入新的原因或例子，再重說一次。"
      : "先用第一句接住上一位的具體觀點，再補充新資訊，最後用第三句邀請其他組員。",
    caveat: "這是規則式討論練習卡，不是 AI 組員的回應，也不會計作完成一輪討論。",
  };
}
