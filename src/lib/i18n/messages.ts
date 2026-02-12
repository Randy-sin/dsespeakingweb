export type Locale = "en" | "zh-Hant";

export const defaultLocale: Locale = "zh-Hant";

export const messages = {
  en: {
    common: {
      connected: "Connected",
      connecting: "Connecting...",
      retry: "Retry",
      close: "Close",
      cancel: "Cancel",
      save: "Save",
      continue: "Continue",
      exit: "Exit",
      loading: "Loading...",
    },
    nav: {
      rooms: "Rooms",
      login: "Login",
      register: "Sign up",
      profile: "Profile",
      logout: "Sign out",
      user: "User",
      language: "Language",
      langEnglish: "English",
      langTraditionalChinese: "Traditional Chinese",
    },
    livekit: {
      preparingTitle: "Preparation phase",
      preparingHint: "Set your microphone and camera before discussion starts",
      prejoinTitle: "Ready to join meeting",
      prejoinDesc:
        "Choose whether to turn on microphone and camera, like Tencent Meeting pre-join setup.",
      microphone: "Microphone",
      camera: "Camera",
      previewJoin: "Join with selected settings",
      disconnect: "Disconnected",
      notConnected: "Not connected",
      connectWatch: "Connect to watch",
      waitConnect: "Waiting to connect",
      connect: "Connect",
      livekitNotConfigured: "LiveKit is not configured",
      connectFailed: "Connection failed",
      spectatorHint: "You can still practice without AV until LiveKit is configured",
      observerHint: "You can watch after LiveKit is configured",
      watchMode: "View-only mode",
      micWaiting: "Waiting for microphones",
      startNow: "Start now",
      waitingMicsTitle: "Waiting for all participants to enable microphone",
      waitingMicsDesc: "A 3-2-1 countdown starts automatically when everyone is ready",
      expandVideos: "Expand videos",
      shrinkVideos: "Exit expanded view",
      fullViewTitle: "Expanded video view",
    },
    session: {
      markerMode:
        "Marker mode — you can score and choose Individual Response questions",
      waitingMarkerQuestion: "Waiting for Marker to select a question...",
      markerSelectingQuestion:
        "Marker is selecting a question for the current candidate",
      selectedByMarker: "selected by Marker",
      leaveWatching: "Leave viewing",
      spectatorHint:
        "You are watching this session as an observer. You can see prompts and hear discussion, but cannot interact.",
    },
  },
  "zh-Hant": {
    common: {
      connected: "已連線",
      connecting: "連線中...",
      retry: "重試",
      close: "關閉",
      cancel: "取消",
      save: "儲存",
      continue: "繼續",
      exit: "離開",
      loading: "載入中...",
    },
    nav: {
      rooms: "房間",
      login: "登入",
      register: "註冊",
      profile: "個人資料",
      logout: "登出",
      user: "使用者",
      language: "語言",
      langEnglish: "English",
      langTraditionalChinese: "繁體中文",
    },
    livekit: {
      preparingTitle: "準備階段",
      preparingHint: "請先設定麥克風與鏡頭，討論開始後可直接使用",
      prejoinTitle: "加入會議前設定",
      prejoinDesc: "可先選擇是否開啟麥克風與鏡頭，和騰訊會議入會前設定一致。",
      microphone: "麥克風",
      camera: "鏡頭",
      previewJoin: "以目前設定加入",
      disconnect: "已中斷",
      notConnected: "未連線",
      connectWatch: "連線觀看",
      waitConnect: "等待連線",
      connect: "連線",
      livekitNotConfigured: "尚未設定 LiveKit",
      connectFailed: "連線失敗",
      spectatorHint: "未設定 LiveKit 仍可練習，音視頻功能會受限",
      observerHint: "需設定 LiveKit 後才可觀看音視頻",
      watchMode: "觀看模式",
      micWaiting: "等待開啟麥克風",
      startNow: "立即開始",
      waitingMicsTitle: "等待所有參與者開啟麥克風",
      waitingMicsDesc: "全員就緒後將自動開始 3-2-1 倒數",
      expandVideos: "放大影片",
      shrinkVideos: "退出放大",
      fullViewTitle: "放大視訊檢視",
    },
    session: {
      markerMode: "Marker 模式 — 你可以評分並選擇 Individual Response 題目",
      waitingMarkerQuestion: "等待 Marker 選擇題目...",
      markerSelectingQuestion: "Marker 正在為當前考生選題",
      selectedByMarker: "由 Marker 選題",
      leaveWatching: "退出觀看",
      spectatorHint:
        "你正在以觀察者身份觀看本場練習，可查看題目與聆聽討論，但無法互動。",
    },
  },
} as const;

type MessageTree = (typeof messages)[Locale];
type FlatRecord = Record<string, string>;

function flattenObject(
  prefix: string,
  obj: Record<string, unknown>,
  output: FlatRecord
) {
  Object.entries(obj).forEach(([k, v]) => {
    const next = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") {
      output[next] = v;
      return;
    }
    if (v && typeof v === "object") {
      flattenObject(next, v as Record<string, unknown>, output);
    }
  });
}

const cache: Record<Locale, FlatRecord> = {
  en: {},
  "zh-Hant": {},
};

export function getFlatMessages(locale: Locale): FlatRecord {
  if (Object.keys(cache[locale]).length > 0) return cache[locale];
  flattenObject("", messages[locale] as unknown as MessageTree, cache[locale]);
  return cache[locale];
}

export function detectBrowserLocale(): Locale {
  if (typeof window === "undefined") return defaultLocale;
  const stored = window.localStorage.getItem("app_locale");
  if (stored === "en" || stored === "zh-Hant") return stored;
  return defaultLocale;
}
