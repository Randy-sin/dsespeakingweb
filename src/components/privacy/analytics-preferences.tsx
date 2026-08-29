"use client";

import { useEffect, useState } from "react";
import { Check, LoaderCircle } from "lucide-react";
import { ANALYTICS_OPT_OUT_KEY } from "@/components/analytics/analytics-provider";
import { disableProductAnalyticsSession } from "@/lib/analytics/client";

function readStoredPreference(): boolean {
  try {
    return window.localStorage.getItem(ANALYTICS_OPT_OUT_KEY) === "1";
  } catch {
    return true;
  }
}

export function AnalyticsPreferences() {
  const [ready, setReady] = useState(false);
  const [optedOut, setOptedOut] = useState(false);
  const [doNotTrack, setDoNotTrack] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setOptedOut(readStoredPreference());
    const normalizedDoNotTrack = navigator.doNotTrack?.trim().toLowerCase();
    setDoNotTrack(normalizedDoNotTrack === "1" || normalizedDoNotTrack === "yes");
    setReady(true);
  }, []);

  const analyticsPaused = !ready || optedOut || doNotTrack;

  const updatePreference = async () => {
    if (!ready || saving || doNotTrack) return;

    const nextOptedOut = !optedOut;
    setSaving(true);
    setMessage("");

    try {
      if (nextOptedOut) {
        window.localStorage.setItem(ANALYTICS_OPT_OUT_KEY, "1");
      } else {
        window.localStorage.removeItem(ANALYTICS_OPT_OUT_KEY);
      }
      setOptedOut(nextOptedOut);

      if (nextOptedOut) {
        const sessionCleared = await disableProductAnalyticsSession();
        setMessage(
          sessionCleared
            ? "已停止可控分析，並清除這個瀏覽器的匿名分析工作階段。"
            : "已停止新的可控分析；匿名工作階段會在 30 分鐘後自動失效。",
        );
      } else {
        setMessage("已重新啟用匿名頁面與功能分析。新的工作階段會在下一次使用功能時建立。");
      }
    } catch {
      setMessage(
        nextOptedOut
          ? "已在這個瀏覽器儲存停止分析的選擇；匿名工作階段會在 30 分鐘後自動失效。"
          : "瀏覽器未能儲存選擇，請檢查私隱或儲存設定後再試。",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      aria-labelledby="analytics-preferences-title"
      className="border border-[#8fa192] bg-[#e4eadf] p-5 sm:p-7"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xl">
          <p className="eyebrow text-[#48634c]">Your choice</p>
          <h2 id="analytics-preferences-title" className="mt-2 font-serif text-2xl tracking-[-0.03em]">
            匿名使用分析
          </h2>
          <p id="analytics-preferences-description" className="mt-3 text-sm leading-7 text-[#4f5d50]">
            控制 Vercel 匿名頁面統計與本站第一方功能事件。關閉後不影響課程、錄音、逐字稿或 AI 回饋。
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={!analyticsPaused}
          aria-describedby="analytics-preferences-description"
          disabled={!ready || saving || doNotTrack}
          onClick={updatePreference}
          className="focus-ring inline-flex min-h-12 shrink-0 items-center gap-3 rounded-full border border-[#778c7a] bg-[#faf7ef] px-4 text-sm font-semibold text-[#172019] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-65"
        >
          <span
            aria-hidden="true"
            className={`relative h-6 w-11 rounded-full transition-colors ${analyticsPaused ? "bg-[#8b8a82]" : "bg-[#48634c]"}`}
          >
            <span
              className={`absolute top-1 grid h-4 w-4 place-items-center rounded-full bg-white transition-transform ${
                analyticsPaused ? "translate-x-1" : "translate-x-6"
              }`}
            >
              {!analyticsPaused ? <Check className="h-3 w-3 text-[#48634c]" /> : null}
            </span>
          </span>
          {saving ? (
            <>
              <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
              儲存中
            </>
          ) : !ready ? (
            "讀取中"
          ) : analyticsPaused ? (
            "已暫停"
          ) : (
            "已啟用"
          )}
        </button>
      </div>

      {doNotTrack ? (
        <p className="mt-5 border-t border-[#b4c2b1] pt-4 text-xs leading-6 text-[#4f5d50]">
          你的瀏覽器已傳送 Do Not Track 訊號，因此可控分析會維持暫停；如要重新啟用，請先在瀏覽器關閉該設定。
        </p>
      ) : null}
      <p aria-live="polite" className="mt-3 min-h-5 text-xs leading-5 text-[#48634c]">
        {message}
      </p>
    </section>
  );
}
