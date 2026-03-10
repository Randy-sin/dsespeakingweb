export type Speaking2026Slot = {
  id: string;
  label: string;
  title: string;
  status: "pending";
  note: string;
};

export const speaking2026Intro = {
  title: "2026 DSE Speaking Past Paper",
  subtitle:
    "這一頁會專門整理 2026 年 DSE Speaking 原始 PDF、重點結構和易懂版本。拿到 PDF 後，可以直接補進來，不用再改頁面骨架。",
  summary: [
    "只放和 2026 Speaking 有關的內容，不混入其他年份。",
    "優先保留原始 PDF 與最直觀的題目整理，避免堆砌。",
    "後續可逐步補上 Part A、Discussion Questions、Part B 和簡短備考提示。",
  ],
};

export const speaking2026Slots: Speaking2026Slot[] = [
  {
    id: "main-paper",
    label: "Main Paper",
    title: "2026 Speaking 原卷 PDF",
    status: "pending",
    note: "PDF 到手後先放這裡，作為整頁的第一入口。",
  },
  {
    id: "part-a",
    label: "Part A",
    title: "閱讀材料與主題整理",
    status: "pending",
    note: "保留原文，同時補一版簡潔易懂的重點導讀。",
  },
  {
    id: "discussion",
    label: "Discussion",
    title: "討論題目直接展示",
    status: "pending",
    note: "不做冗長說明，直接列出可用於練習和討論的題目。",
  },
  {
    id: "part-b",
    label: "Part B",
    title: "個人回應題目整理",
    status: "pending",
    note: "按題目逐條顯示，後續可補簡短答題方向。",
  },
];

export const speaking2026UpdatePlan = [
  "收到 PDF 後，先上傳原卷並補上下載入口。",
  "再把 Part A、Discussion Questions、Part B 拆成可直接閱讀的區塊。",
  "最後補最少量但最有用的提示，例如題目主題、常見卡點和論壇入口。",
];

// ─── 2026 Speaking Papers Data ─────────────────────────────────────────────

export type Speaking2026Paper = {
  id: string;
  paperNumber: string;
  topic: string;
  partAArticle?: string[];
  partADiscussionPoints: string[];
  partBQuestions?: string[];
  pdfUrl?: string;
  status: "complete" | "partial" | "pending";
};

export const speaking2026Papers: Speaking2026Paper[] = [
  {
    id: "2026-1-1",
    paperNumber: "1.1",
    topic: "Two-dish Rice",
    partADiscussionPoints: [
      "Reasons why two-dish rice are popular",
      "Advantages and disadvantages of two-dish rice",
      "Ways to promote two-dish rice to tourists",
    ],
    partBQuestions: [
      "What do you eat for lunch?",
      "How can two-dish rice improve its service?",
      "Which one is more important, food quality or price?",
      "Do you agree that two-dish rice will become a culture in Hong Kong?",
      "How does social media influence people's eating habits?",
      "Do you think two-dish rice should be promoted as part of Hong Kong food culture?",
      "Explain whether economic conditions could potentially affect people's choices of meals.",
    ],
    status: "complete",
  },
  {
    id: "2026-1-2",
    paperNumber: "1.2",
    topic: "Financial Literacy for Teenagers",
    partADiscussionPoints: [
      "Reasons why financial literacy is important for teenagers",
      "Ways teenagers can save money",
      "School activities that can be carried out",
    ],
    partBQuestions: [
      "Describe an experience of buying something you don't need.",
      "How do you keep track of your daily expenses?",
      "If you have a thousand Hong Kong dollars, how would you save the money?",
      "Can peer pressure help students develop the habit of keeping track of expenses?",
      "Why is it difficult to save money?",
    ],
    status: "complete",
  },
  {
    id: "2026-1-3",
    paperNumber: "1.3",
    topic: "Online Dishonesty",
    partADiscussionPoints: [
      "Why are people dishonest online?",
      "How would people feel if their friends were to lie online?",
      "How do we protect ourselves from online lies?",
    ],
    partBQuestions: [
      "Do you often read posts on social media?",
      "Have you ever seen any dishonest behaviour on the Internet?",
      "Do you think it is honest to use AI to write articles and post them online?",
      "Have you ever seen any cases of people lying on social media?",
    ],
    status: "complete",
  },
];
