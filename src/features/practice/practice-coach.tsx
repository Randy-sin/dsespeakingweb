"use client";

import { useState } from "react";
import Link from "next/link";
import { Bot, LoaderCircle, MessageSquareText, ShieldCheck, Sparkles, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { VoiceRecorder } from "@/features/recording/voice-recorder";
import { useUser } from "@/hooks/use-user";
import type { PracticeAssessment } from "@/lib/ai/practice-assessment";
import type { PracticeMode } from "@/lib/learning/types";

type PracticeCoachProps = {
  maxSeconds: number;
  mode: PracticeMode;
  task: string;
};

type AiFeedbackResponse = {
  ok?: boolean;
  feedback?: string;
  assessment?: PracticeAssessment;
  response?: string;
  sessionId?: string;
  error?: string;
};

async function readAiResponse(response: Response) {
  const data = (await response.json()) as AiFeedbackResponse;
  if (!response.ok || !data.ok) {
    throw new Error(response.status === 401 ? "請先登入，再使用 AI 教練。" : data.error || "AI 教練暫時未能回應，請稍後再試。");
  }
  return data;
}

export function PracticeCoach({ maxSeconds, mode, task }: PracticeCoachProps) {
  const { user, loading } = useUser();
  const [transcript, setTranscript] = useState("");
  const [assessment, setAssessment] = useState<PracticeAssessment | null>(null);
  const [teammateReply, setTeammateReply] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"feedback" | "teammate" | null>(null);

  const updateTranscript = (value: string) => {
    setTranscript(value);
    setAssessment(null);
    setTeammateReply(null);
  };

  const requestFeedback = async () => {
    if (!transcript.trim()) {
      setError("請先輸入或錄下你的回答，AI 才有證據可以分析。");
      return;
    }
    setError(null);
    setPendingAction("feedback");
    try {
      const response = await fetch("/api/ai/practice/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, task, transcript, sessionId }),
      });
      const data = await readAiResponse(response);
      if (!data.assessment) throw new Error("AI 教練沒有返回可用的訓練量表，請稍後再試。");
      setAssessment(data.assessment);
      if (data.sessionId) setSessionId(data.sessionId);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "AI 教練暫時未能回應，請稍後再試。");
    } finally {
      setPendingAction(null);
    }
  };

  const requestTeammate = async () => {
    if (!transcript.trim()) {
      setError("請先完成你的發言，AI 組員才可以接話。");
      return;
    }
    setError(null);
    setPendingAction("teammate");
    try {
      const response = await fetch("/api/ai/group-discussion/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: task, learnerTurn: transcript, sessionId }),
      });
      const data = await readAiResponse(response);
      setTeammateReply(data.response || "我暫時沒有新的觀點，請再補充一個具體理由。");
      if (data.sessionId) setSessionId(data.sessionId);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "AI 組員暫時未能回應，請稍後再試。");
    } finally {
      setPendingAction(null);
    }
  };

  const speakReply = () => {
    if (!teammateReply || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(teammateReply);
    utterance.lang = "en-HK";
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="space-y-5">
      <VoiceRecorder maxSeconds={maxSeconds} mode={mode} task={task} onTranscriptChange={updateTranscript} onSessionChange={setSessionId} />

      <section className="border border-[#bdb3a2] bg-white/35 p-5 sm:p-7" aria-labelledby="transcript-title">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow text-[#48634c]">Review your words</p>
            <h2 id="transcript-title" className="mt-2 font-serif text-2xl">逐字稿草稿</h2>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#bdb3a2] px-3 py-1 text-[11px] text-[#6d695f]"><ShieldCheck className="h-3.5 w-3.5" />先校對，再分析</span>
        </div>
        <p className="mt-3 max-w-2xl text-xs leading-6 text-[#8a8175]">支援的瀏覽器會在錄音時產生即時草稿，但它可能聽錯字。你也可以手動輸入；送出前請先修正成自己真正說過的內容。</p>
        <Textarea
          value={transcript}
          onChange={(event) => {
            updateTranscript(event.target.value);
          }}
          className="mt-5 min-h-44 border-[#bdb3a2] bg-[#faf7ef] text-base leading-7"
          placeholder="輸入或校對你剛才的英文回答……"
          maxLength={5000}
        />
        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[#8a8175]"><span>{transcript.trim().split(/\s+/).filter(Boolean).length} words</span><span>{transcript.length}/5000</span></div>

        {loading ? <p className="mt-5 inline-flex items-center gap-2 text-sm text-[#6d695f]"><LoaderCircle className="h-4 w-4 animate-spin" />正在確認登入狀態……</p> : null}
        {!loading && !user ? (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-l-2 border-[#c84b31] bg-[#f3efe4] p-4">
            <p className="max-w-xl text-sm leading-6 text-[#6d695f]">逐字稿與自我檢查可以直接使用；AI 回饋會消耗服務資源，因此只開放給已登入學生。</p>
            <Button asChild className="rounded-full bg-[#172019] text-white"><Link href="/login">登入後使用 AI 教練</Link></Button>
          </div>
        ) : null}

        {user ? (
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={requestFeedback} disabled={pendingAction !== null} className="rounded-full bg-[#48634c] px-5 text-white hover:bg-[#384f3c]">
              {pendingAction === "feedback" ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}取得證據化回饋
            </Button>
            {mode === "group-discussion" ? (
              <Button onClick={requestTeammate} disabled={pendingAction !== null} variant="outline" className="rounded-full border-[#9f9687] px-5">
                {pendingAction === "teammate" ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}請 AI 組員接話
              </Button>
            ) : null}
          </div>
        ) : null}

        {error ? <p role="alert" className="mt-5 border-l-2 border-[#c84b31] pl-4 text-sm leading-6 text-[#a74231]">{error} 你的錄音與逐字稿仍保留在本頁。</p> : null}
      </section>

      {assessment ? (
        <section className="paper-surface paper-rule p-6" aria-live="polite">
          <p className="eyebrow flex items-center gap-2 text-[#c84b31]"><MessageSquareText className="h-4 w-4" />AI coach · formative only</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4"><div><h2 className="font-serif text-2xl">逐字稿訓練量表</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#4f4b44]">{assessment.summary}</p></div><div className="border border-[#c84b31] px-4 py-3 text-center"><span className="block font-mono text-3xl text-[#c84b31]">{assessment.trainingLevel}/5</span><span className="mt-1 block text-[10px] uppercase tracking-[0.16em] text-[#8a8175]">training signal</span></div></div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">{assessment.rubrics.map((rubric) => <article key={rubric.criterion} className="border border-[#c9c0b1] bg-white/45 p-4"><div className="flex items-center justify-between gap-3"><h3 className="font-semibold text-[#26352a]">{rubric.criterion}</h3><span className="font-mono text-sm text-[#c84b31]">{rubric.trainingLevel}/5</span></div><p className="mt-3 text-xs leading-5 text-[#6d695f]"><strong className="text-[#4f4b44]">證據：</strong>{rubric.evidence}</p><p className="mt-2 text-xs leading-5 text-[#6d695f]"><strong className="text-[#4f4b44]">下一步：</strong>{rubric.nextStep}</p></article>)}</div>
          <p className="mt-5 text-xs leading-5 text-[#8a8175]">{assessment.caveat} 不能評估錄音中的發音、可聽流暢度、節奏或眼神交流。</p>
        </section>
      ) : null}

      {teammateReply ? (
        <section className="border border-[#48634c] bg-[#edf0e8] p-6" aria-live="polite">
          <p className="eyebrow flex items-center gap-2 text-[#48634c]"><Bot className="h-4 w-4" />AI teammate</p>
          <blockquote className="mt-4 font-serif text-xl leading-8 text-[#26352a]">“{teammateReply}”</blockquote>
          <Button onClick={speakReply} variant="ghost" className="mt-4 rounded-full text-[#48634c]"><Volume2 className="mr-2 h-4 w-4" />朗讀這段回應</Button>
          <p className="mt-3 text-xs leading-5 text-[#6d695f]">這是 AI 產生的練習回應，不代表真人學生或考官意見。聽完後，請針對其中一個具體觀點再接一句。</p>
        </section>
      ) : null}
    </div>
  );
}
