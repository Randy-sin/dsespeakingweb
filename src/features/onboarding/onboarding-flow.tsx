"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildLearningPlan, getWeakAreaLabel, saveLearnerProfile } from "@/lib/learning/store";
import type { LearnerProfile, WeakArea } from "@/lib/learning/types";

const weakAreas: WeakArea[] = ["ideas", "structure", "interaction", "language", "delivery", "timing"];
const currentYear = new Date().getFullYear();

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [examYear, setExamYear] = useState(Math.max(2027, currentYear + 1));
  const [targetLevel, setTargetLevel] = useState(4);
  const [gdConfidence, setGdConfidence] = useState(2);
  const [irConfidence, setIrConfidence] = useState(2);
  const [selectedWeakAreas, setSelectedWeakAreas] = useState<WeakArea[]>([]);
  const [weeklyMinutes, setWeeklyMinutes] = useState(60);
  const [weakAreaMessage, setWeakAreaMessage] = useState("");

  const profile = useMemo<LearnerProfile>(() => ({
    examYear,
    targetLevel,
    gdConfidence,
    irConfidence,
    weakAreas: selectedWeakAreas,
    weeklyMinutes,
    completedOnboarding: true,
    updatedAt: new Date().toISOString(),
  }), [examYear, gdConfidence, irConfidence, selectedWeakAreas, targetLevel, weeklyMinutes]);
  const plan = buildLearningPlan(profile);

  const toggleWeakArea = (area: WeakArea) => {
    setSelectedWeakAreas((current) => {
      if (current.includes(area)) {
        setWeakAreaMessage("");
        return current.filter((item) => item !== area);
      }
      if (current.length >= 3) {
        setWeakAreaMessage("最多選擇三項。請先取消一項，再加入新的重點。");
        return current;
      }
      setWeakAreaMessage("");
      return [...current, area];
    });
  };

  const finish = () => {
    saveLearnerProfile(profile);
    router.push("/learn");
  };

  return (
    <main id="main-content" className="mx-auto grid min-h-[calc(100vh-64px)] max-w-[1440px] lg:grid-cols-12">
      <aside className="border-b border-[#c9bfad] bg-[#172019] px-6 py-8 text-[#faf7ef] sm:px-10 lg:col-span-4 lg:border-b-0 lg:border-r lg:py-14">
        <p className="eyebrow text-[#aeb8af]">Learning profile</p>
        <h1 className="display-title mt-5 max-w-sm text-5xl leading-[0.92] sm:text-6xl">先知道你卡在哪裡。</h1>
        <p className="mt-6 max-w-sm text-sm leading-7 text-[#c9cfc9]">兩分鐘診斷不會替你評分，只會決定第一週先練哪項能力。所有答案會先保存在這部裝置。</p>
        <div className="mt-10 grid grid-cols-4 gap-2" role="progressbar" aria-label={step < 4 ? `第 ${step + 1} 個問題，共 4 個問題` : "四個問題已完成"} aria-valuemin={1} aria-valuemax={4} aria-valuenow={Math.min(step + 1, 4)}>
          {[0, 1, 2, 3].map((index) => (
            <span key={index} className={`h-1 ${index <= step ? "bg-[#ad3f29]" : "bg-[#4d554e]"}`} />
          ))}
        </div>
      </aside>

      <section className="flex px-4 py-10 sm:px-10 lg:col-span-8 lg:px-16 lg:py-14">
        <div className="mx-auto flex w-full max-w-3xl flex-col">
          <div className="mb-10 flex items-center justify-between">
            <p className="font-mono text-xs text-[#665f55]">{step < 4 ? `0${step + 1} / 04` : "PLAN READY"}</p>
            {step < 4 ? <button type="button" onClick={() => router.push("/learn")} className="min-h-11 text-xs text-[#6d695f] underline underline-offset-4">稍後再做</button> : null}
          </div>

          {step === 0 ? (
            <OnboardingStep title="你會在哪一年應考？" subtitle="我們會按你的時間和目標安排練習密度。">
              <div className="grid gap-4 sm:grid-cols-2">
                {[Math.max(2027, currentYear + 1), Math.max(2028, currentYear + 2), Math.max(2029, currentYear + 3)].map((year) => (
                  <Choice key={year} active={examYear === year} onClick={() => setExamYear(year)} title={`${year} DSE`} detail={year === Math.max(2027, currentYear + 1) ? "較集中地建立考試表現" : "有時間逐步建立說話習慣"} />
                ))}
              </div>
              <p className="eyebrow mt-9 text-[#665f55]">Target level</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {[3, 4, 5].map((level) => (
                  <button key={level} type="button" aria-pressed={targetLevel === level} onClick={() => setTargetLevel(level)} className={`h-12 min-w-24 rounded-full border px-5 text-sm ${targetLevel === level ? "border-[#172019] bg-[#172019] text-white" : "border-[#bdb3a2] bg-[#faf7ef]"}`}>Level {level}{level === 5 ? "+" : ""}</button>
                ))}
              </div>
            </OnboardingStep>
          ) : null}

          {step === 1 ? (
            <OnboardingStep title="你現在有多大信心？" subtitle="不是預測分數，只要按目前感覺作答。">
              <ConfidenceScale label="小組討論" value={gdConfidence} onChange={setGdConfidence} />
              <ConfidenceScale label="個人回應" value={irConfidence} onChange={setIrConfidence} />
            </OnboardingStep>
          ) : null}

          {step === 2 ? (
            <OnboardingStep title="你最想改善甚麼？" subtitle="選擇一至三項。我們會先處理第一個選項。">
              <div className="grid gap-3 sm:grid-cols-2">
                {weakAreas.map((area) => (
                  <Choice key={area} active={selectedWeakAreas.includes(area)} onClick={() => toggleWeakArea(area)} title={getWeakAreaLabel(area)} detail={selectedWeakAreas.includes(area) ? "已加入學習重點" : "點擊選擇"} />
                ))}
              </div>
              <p aria-live="polite" className="mt-3 min-h-5 text-sm text-[#a74231]">{weakAreaMessage}</p>
            </OnboardingStep>
          ) : null}

          {step === 3 ? (
            <OnboardingStep title="每週可以練習多久？" subtitle="短而穩定，比考前一次過練習有效。">
              <div className="grid gap-4 sm:grid-cols-3">
                {[30, 60, 120].map((minutes) => (
                  <Choice key={minutes} active={weeklyMinutes === minutes} onClick={() => setWeeklyMinutes(minutes)} title={`${minutes} 分鐘`} detail={minutes === 30 ? "每週 3 次短練習" : minutes === 60 ? "課程與錄音兼備" : "密集備試節奏"} />
                ))}
              </div>
            </OnboardingStep>
          ) : null}

          {step === 4 ? (
            <OnboardingStep title="你的第一週，從這裡開始。" subtitle={plan.reason}>
              <article className="paper-surface paper-rule p-6 sm:p-8">
                <div className="flex items-center justify-between border-b border-[#bdb3a2] pb-5">
                  <span className="eyebrow text-[#ad3f29]">Recommended first lesson</span>
                  <Clock3 className="h-5 w-5 text-[#48634c]" />
                </div>
                <h2 className="mt-7 font-serif text-4xl tracking-[-0.04em]">{plan.title}</h2>
                <ul className="mt-7 space-y-4">
                  {plan.weeklyTasks.map((task) => (
                    <li key={task} className="flex gap-3 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#48634c]" />{task}</li>
                  ))}
                </ul>
              </article>
            </OnboardingStep>
          ) : null}

          <div className="sticky bottom-0 z-10 -mx-4 mt-10 flex items-center justify-between border-t border-[#c9bfad] bg-[#f3efe4]/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
            <Button type="button" variant="ghost" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))} className="rounded-full">
              <ArrowLeft className="mr-2 h-4 w-4" />返回
            </Button>
            {step < 4 ? (
              <Button type="button" onClick={() => setStep((value) => value + 1)} disabled={step === 2 && selectedWeakAreas.length === 0} className="h-12 rounded-full bg-[#ad3f29] px-6 text-white hover:bg-[#aa3d27]">
                繼續<ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" onClick={finish} className="h-12 rounded-full bg-[#172019] px-7 text-white hover:bg-[#324036]">
                前往我的學習首頁<ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function OnboardingStep({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <div className="reveal-up flex-1"><h2 className="display-title text-4xl leading-tight sm:text-6xl">{title}</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-[#6d695f] sm:text-base">{subtitle}</p><div className="mt-9">{children}</div></div>;
}

function Choice({ active, onClick, title, detail }: { active: boolean; onClick: () => void; title: string; detail: string }) {
  return <button type="button" aria-pressed={active} onClick={onClick} className={`group min-h-28 border p-5 text-left transition-colors ${active ? "border-[#48634c] bg-[#48634c] text-white" : "border-[#bdb3a2] bg-[#faf7ef] hover:border-[#48634c]"}`}><span className="flex items-center justify-between font-serif text-xl"><span>{title}</span>{active ? <Check className="h-5 w-5" /> : null}</span><span className={`mt-3 block text-xs ${active ? "text-[#dbe2dc]" : "text-[#665f55]"}`}>{detail}</span></button>;
}

function ConfidenceScale({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <fieldset className="border-t border-[#bdb3a2] py-7"><div className="mb-5 flex items-center justify-between"><legend className="font-serif text-2xl">{label}</legend><span className="font-mono text-xs text-[#665f55]">{value} / 5</span></div><div className="grid grid-cols-5 gap-2" role="radiogroup">{[1,2,3,4,5].map((number) => <button key={number} type="button" role="radio" aria-checked={value === number} onClick={() => onChange(number)} className={`h-12 border font-mono text-sm ${value === number ? "border-[#172019] bg-[#172019] text-white" : "border-[#bdb3a2] bg-[#faf7ef] hover:border-[#48634c]"}`}>{number}</button>)}</div><div className="mt-2 flex justify-between text-[11px] text-[#665f55]"><span>不知怎樣開始</span><span>可以穩定完成</span></div></fieldset>;
}
