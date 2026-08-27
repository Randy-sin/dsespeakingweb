"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Headphones, Mic2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VoiceRecorder } from "@/features/recording/voice-recorder";

const firstPrompt = "Should schools give students more chances to practise speaking outside English lessons? Explain your view.";
const firstLessonHref = "/learn/individual-response/making-choices";

export function OnboardingFlow() {
  const router = useRouter();
  const [completed, setCompleted] = useState(false);

  const completeFirstRecording = () => {
    setCompleted(true);
  };

  const continueToFirstLesson = () => {
    router.push(firstLessonHref);
  };

  return (
    <main id="main-content" className="mx-auto grid min-h-[calc(100vh-64px)] max-w-[1440px] lg:grid-cols-12">
      <aside className="hidden border-b border-[#c9bfad] bg-[#172019] px-6 py-9 text-[#faf7ef] sm:px-10 lg:col-span-4 lg:block lg:border-b-0 lg:border-r lg:py-14">
        <p className="eyebrow text-[#aeb8af]">Voice-first start</p>
        <h1 className="display-title mt-5 max-w-md text-5xl leading-[0.92] sm:text-6xl">
          不用填表。<br />直接說一次。
        </h1>
        <p className="mt-6 max-w-sm text-sm leading-7 text-[#c9cfc9]">
          第一次進來不做問卷、不先寫稿。看題目，按下麥克風，用 45 秒完成第一個答案。
        </p>

        <ol className="mt-10 space-y-5 border-t border-[#4d554e] pt-7">
          {[
            ["01", "看清楚題目"],
            ["02", "直接開口回答"],
            ["03", "聽回放再改善"],
          ].map(([number, label]) => (
            <li key={number} className="flex items-center gap-4 text-sm text-[#d7ddd7]">
              <span className="font-mono text-[11px] text-[#d78672]">{number}</span>
              <span>{label}</span>
            </li>
          ))}
        </ol>
      </aside>

      <section className="flex px-4 py-6 sm:px-10 sm:py-9 lg:col-span-8 lg:px-16 lg:py-14">
        <div className="mx-auto w-full max-w-3xl">
          <div className="mb-6 lg:hidden">
            <p className="eyebrow text-[#ad3f29]">Voice-first start</p>
            <h1 className="display-title mt-3 text-4xl leading-[0.95]">不用填表，直接說一次。</h1>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#c9bfad] pb-5">
            <p className="eyebrow text-[#ad3f29]">Your first turn · 45 sec</p>
            <span className="inline-flex items-center gap-2 text-xs text-[#665f55]">
              <ShieldCheck className="h-4 w-4 text-[#48634c]" />錄音預設只留在瀏覽器
            </span>
          </div>

          <div className="mt-6 grid gap-7 sm:mt-8 lg:grid-cols-[1fr_220px] lg:items-start">
            <div>
              <p className="eyebrow text-[#665f55]">Examiner asks</p>
              <h2 className="mt-3 font-serif text-3xl leading-tight tracking-[-0.035em] sm:mt-4 sm:text-5xl">
                {firstPrompt}
              </h2>
            </div>
            <aside className="hidden border-l-2 border-[#ad3f29] pl-5 sm:block">
              <p className="eyebrow text-[#665f55]">Say it in 3 moves</p>
              <p className="mt-3 text-sm leading-7 text-[#5e5b53]">
                先表明立場 → 給一個理由 → 加一個具體例子。
              </p>
            </aside>
          </div>

          <div className="mt-6 sm:mt-8">
            <VoiceRecorder
              maxSeconds={45}
              mode="individual-response"
              task={firstPrompt}
              allowTextFallback={false}
              showAccountOptions={false}
              onRecordingComplete={completeFirstRecording}
            />
          </div>

          {completed ? (
            <section className="mt-6 border border-[#8da08f] bg-[#edf0e8] p-5 sm:p-6" aria-live="polite">
              <div className="flex gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#48634c] text-white">
                  <Check className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-serif text-2xl text-[#26352a]">第一遍完成了。</h3>
                  <p className="mt-2 text-sm leading-6 text-[#5e5b53]">
                    不靠問卷猜能力。我們先從最通用的一分鐘答案結構開始，之後再按你的真實錄音和回饋調整路徑。
                  </p>
                </div>
              </div>
              <Button type="button" onClick={continueToFirstLesson} className="mt-5 h-12 w-full rounded-full bg-[#172019] px-6 text-white sm:w-auto">
                學會把剛才說得更完整<ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </section>
          ) : (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#c9bfad] pt-5">
              <p className="flex items-center gap-2 text-xs leading-5 text-[#665f55]">
                <Headphones className="h-4 w-4 text-[#48634c]" />說完後可立即回聽，不需要先登入。
              </p>
              <button type="button" onClick={continueToFirstLesson} className="inline-flex min-h-11 items-center gap-2 text-xs text-[#665f55] underline underline-offset-4">
                麥克風暫時不可用，先學答題方法<ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <p className="mt-7 flex items-start gap-3 text-xs leading-6 text-[#665f55]">
            <Mic2 className="mt-0.5 h-4 w-4 shrink-0 text-[#ad3f29]" />
            這次錄音不會自動當成正式評分；登入後主動生成逐字稿，才會送到 AI 服務分析。
          </p>
        </div>
      </section>
    </main>
  );
}
