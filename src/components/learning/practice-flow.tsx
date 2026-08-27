import { CheckCircle2, MessageSquareText, Mic2 } from "lucide-react";

const steps = [
  { label: "選題與準備", detail: "先決定一個說話目標，不寫完整稿。", icon: MessageSquareText },
  { label: "開口完成一次", detail: "按計時說完，卡住也不要立即重來。", icon: Mic2 },
  { label: "校對與重練", detail: "修正逐字稿，只選一項建議再說一次。", icon: CheckCircle2 },
];

export function PracticeFlow() {
  return (
    <section aria-labelledby="practice-flow-title" className="mt-14 border-y border-[#bdb3a2] py-7">
      <div className="grid gap-7 lg:grid-cols-[220px_1fr] lg:items-start">
        <div>
          <p className="eyebrow text-[#665f55]">How practice works</p>
          <h2 id="practice-flow-title" className="mt-3 font-serif text-3xl">每次只走三步。</h2>
        </div>
        <ol className="grid gap-px border border-[#bdb3a2] bg-[#bdb3a2] md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <li key={step.label} className="bg-[#faf7ef] p-5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-[#ad3f29]">0{index + 1}</span>
                  <Icon className="h-4 w-4 text-[#48634c]" />
                </div>
                <p className="mt-6 font-serif text-xl">{step.label}</p>
                <p className="mt-2 text-xs leading-6 text-[#6d695f]">{step.detail}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
