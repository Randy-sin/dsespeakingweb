"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Flag, LoaderCircle, MessageSquareText, PencilLine, RotateCcw, ShieldCheck, Sparkles, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { VoiceRecorder, type RecorderState } from "@/features/recording/voice-recorder";
import { useUser } from "@/hooks/use-user";
import type { PracticeAssessment } from "@/lib/ai/practice-assessment";
import type { PracticeMode } from "@/lib/learning/types";

type PracticeCoachProps = {
  maxSeconds: number;
  mode: PracticeMode;
  task: string;
  paperId?: string;
  onBeforeLogin?: () => void;
};

type AiFeedbackResponse = {
  ok?: boolean;
  feedback?: string;
  assessment?: PracticeAssessment;
  response?: string;
  partnerRole?: "Student A" | "Student B";
  round?: number;
  sessionId?: string;
  error?: string;
};

type DiscussionTurn = {
  speaker: "learner" | "ai";
  label: string;
  text: string;
};

const PRACTICE_DRAFT_KEY = "dse-speaking:practice-draft:v1";

const selfCheckItems: Record<PracticeMode, Array<{ id: string; label: string }>> = {
  "individual-response": [
    { id: "direct-answer", label: "開首直接回答題目，而不是重複題目" },
    { id: "developed-points", label: "至少兩個重點都有原因、例子或解釋" },
    { id: "clear-order", label: "答案次序清楚，聽眾能跟上你的思路" },
    { id: "complete-ending", label: "結尾有總結立場或回扣問題" },
  ],
  "group-discussion": [
    { id: "reference", label: "點出上一位同學的一個具體觀點" },
    { id: "position", label: "清楚表明同意、補充或提出限制" },
    { id: "new-information", label: "加入一個新的原因、例子或考慮" },
    { id: "invite", label: "結尾留下讓其他組員接話的位置" },
  ],
};

async function readAiResponse(response: Response) {
  const data = (await response.json()) as AiFeedbackResponse;
  if (!response.ok || !data.ok) {
    if (response.status === 401) throw new Error("請先登入，再使用 AI 教練。");
    if (response.status === 429) throw new Error("你剛才的 AI 練習次數較多，請稍後再試。逐字稿仍保留在本頁。");
    throw new Error(data.error || "AI 教練暫時未能回應，請稍後再試。");
  }
  return data;
}

export function PracticeCoach({ maxSeconds, mode, task, paperId, onBeforeLogin }: PracticeCoachProps) {
  const { user, loading } = useUser();
  const router = useRouter();
  const [transcript, setTranscript] = useState("");
  const [assessment, setAssessment] = useState<PracticeAssessment | null>(null);
  const [discussionTurns, setDiscussionTurns] = useState<DiscussionTurn[]>([]);
  const [discussionEnded, setDiscussionEnded] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"feedback" | "teammate" | null>(null);
  const [completedChecks, setCompletedChecks] = useState<string[]>([]);
  const [restoredDraft, setRestoredDraft] = useState(false);
  const [recorderState, setRecorderState] = useState<RecorderState>("idle");
  const [recorderKey, setRecorderKey] = useState(0);
  const [editingTranscript, setEditingTranscript] = useState(false);
  const checks = selfCheckItems[mode];
  const completedDiscussionRounds = discussionTurns.filter((turn) => turn.speaker === "ai").length;
  const nextDiscussionRound = completedDiscussionRounds + 1;
  const hasTranscript = Boolean(transcript.trim());
  const isTextFallback = recorderState === "text";
  const showReview = recorderState === "recorded" || isTextFallback || restoredDraft;
  const showTranscriptEditor = isTextFallback || editingTranscript;
  const actionsAvailable = showReview && recorderState !== "recording" && hasTranscript;
  const showRecorder = mode === "individual-response" || !discussionEnded;

  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(PRACTICE_DRAFT_KEY);
      if (!stored) return;
      const draft = JSON.parse(stored) as { path?: string; mode?: PracticeMode; task?: string; transcript?: string };
      const currentPath = `${window.location.pathname}${window.location.search}`;
      if (draft.path === currentPath && draft.mode === mode && draft.task === task && draft.transcript?.trim()) {
        setTranscript(draft.transcript);
        setRestoredDraft(true);
        window.sessionStorage.removeItem(PRACTICE_DRAFT_KEY);
      }
    } catch {
      window.sessionStorage.removeItem(PRACTICE_DRAFT_KEY);
    }
  }, [mode, task]);

  const updateTranscript = (value: string) => {
    setTranscript(value);
    setAssessment(null);
    setCompletedChecks([]);
    setError(null);
  };

  const clearCurrentAttempt = () => {
    setTranscript("");
    setAssessment(null);
    if (mode === "individual-response") setSessionId(null);
    setError(null);
    setCompletedChecks([]);
    setEditingTranscript(false);
    setRestoredDraft(false);
  };

  const updateRecorderSession = (nextSessionId: string | null) => {
    if (mode === "group-discussion") {
      if (nextSessionId) setSessionId((current) => current ?? nextSessionId);
      return;
    }
    setSessionId(nextSessionId);
  };

  const prepareFreshRecorder = () => {
    clearCurrentAttempt();
    setRecorderState("idle");
    setRecorderKey((current) => current + 1);
  };

  const toggleCheck = (id: string) => {
    setCompletedChecks((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const continueToLogin = () => {
    const path = `${window.location.pathname}${window.location.search}`;
    onBeforeLogin?.();
    window.sessionStorage.setItem(PRACTICE_DRAFT_KEY, JSON.stringify({ path, mode, task, transcript }));
    router.push(`/login?next=${encodeURIComponent(path)}`);
  };

  const requestFeedback = async () => {
    if (!transcript.trim()) {
      setError("請先完成錄音並取得逐字稿，AI 才有證據可以分析。");
      return;
    }
    setError(null);
    setPendingAction("feedback");
    try {
      const response = await fetch("/api/ai/practice/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, task, transcript, sessionId, paperId }),
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
    if (discussionEnded || nextDiscussionRound > 3) return;
    if (!transcript.trim()) {
      setError("請先完成你的發言，AI 組員才可以接話。");
      return;
    }
    setError(null);
    setPendingAction("teammate");
    try {
      const previousTurns = discussionTurns
        .map((turn) => `${turn.label}: ${turn.text}`)
        .join("\n")
        .slice(-2200);
      const response = await fetch("/api/ai/group-discussion/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: task, learnerTurn: transcript, previousTurns, round: nextDiscussionRound, sessionId, paperId }),
      });
      const data = await readAiResponse(response);
      const reply = data.response || "I do not have a new point yet. Could you add one specific reason?";
      const role = data.partnerRole === "Student B" ? "AI 組員 B" : "AI 組員 A";
      setDiscussionTurns((current) => [
        ...current,
        { speaker: "learner", label: "你", text: transcript.trim() },
        { speaker: "ai", label: role, text: reply },
      ]);
      if (data.sessionId) setSessionId(data.sessionId);
      if (nextDiscussionRound === 3) {
        setDiscussionEnded(true);
      } else {
        prepareFreshRecorder();
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "AI 組員暫時未能回應，請稍後再試。");
    } finally {
      setPendingAction(null);
    }
  };

  const speakReply = (reply: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(reply);
    utterance.lang = "en-HK";
    window.speechSynthesis.speak(utterance);
  };

  const startNewDiscussion = () => {
    setDiscussionTurns([]);
    setDiscussionEnded(false);
    setSessionId(null);
    prepareFreshRecorder();
  };

  return (
    <div className="space-y-5">
      {mode === "group-discussion" && !discussionEnded ? (
        <div className="border-l-2 border-[#48634c] bg-[#edf0e8] px-5 py-4" aria-live="polite">
          <p className="eyebrow text-[#48634c]">Round {nextDiscussionRound} of 3</p>
          <p className="mt-2 text-sm leading-6 text-[#4f4b44]">
            {completedDiscussionRounds === 0
              ? "先錄下你的第一段發言；AI 組員只會回應這一輪真正說過的內容。"
              : "上一輪已保存。現在請錄下新的發言，不需要修改上一輪逐字稿。"}
          </p>
        </div>
      ) : null}

      {showRecorder ? (
        <VoiceRecorder
          key={`${mode}-${recorderKey}`}
          maxSeconds={maxSeconds}
          mode={mode}
          task={task}
          paperId={paperId}
          onRecordingStart={clearCurrentAttempt}
          onReset={clearCurrentAttempt}
          onStateChange={setRecorderState}
          onTranscriptChange={updateTranscript}
          onSessionChange={updateRecorderSession}
        />
      ) : null}

      {showReview ? (
        <section className="border border-[#bdb3a2] bg-white/35 p-5 sm:p-7" aria-labelledby="transcript-title">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="eyebrow text-[#48634c]">Review what you said</p>
              <h2 id="transcript-title" className="mt-2 font-serif text-2xl">{isTextFallback ? "文字後備" : "這次說話的逐字稿"}</h2>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#bdb3a2] px-3 py-1 text-[11px] text-[#6d695f]"><ShieldCheck className="h-3.5 w-3.5" />錄音後才顯示</span>
          </div>

          {showTranscriptEditor ? (
            <div className="mt-5">
              <label htmlFor="transcript-draft" className="block text-sm font-semibold text-[#26352a]">
                {isTextFallback ? "輸入你原本會說的英文答案" : "只修正 AI 聽錯的字，不要把答案改寫成文章"}
              </label>
              <p id="transcript-help" className="mt-2 text-xs leading-5 text-[#665f55]">
                {isTextFallback ? "這個欄位只會在麥克風無法使用時出現。" : "保留自己真正說過的內容，讓回饋仍然有錄音證據。"}
              </p>
              <Textarea
                id="transcript-draft"
                aria-describedby="transcript-help transcript-count"
                value={transcript}
                onChange={(event) => updateTranscript(event.target.value)}
                className="mt-3 min-h-44 border-[#bdb3a2] bg-[#faf7ef] text-base leading-7"
                placeholder={isTextFallback ? "輸入你本來會說的答案……" : "修正逐字稿……"}
                maxLength={5000}
              />
            </div>
          ) : hasTranscript ? (
            <div className="mt-5 border border-[#c9c0b1] bg-[#faf7ef] p-5">
              <p className="whitespace-pre-wrap text-base leading-7 text-[#26352a]">{transcript}</p>
            </div>
          ) : (
            <p role="status" className="mt-5 border-l-2 border-[#ad3f29] pl-4 text-sm leading-6 text-[#665f55]">
              {user
                ? "錄音已完成。若瀏覽器沒有產生即時文字，請按上方的「整理成 AI 逐字稿」。"
                : "錄音已完成，但這個瀏覽器沒有產生即時逐字稿。你仍可回放或再說一次；文字輸入不會成為預設步驟。"}
            </p>
          )}

          {(hasTranscript || showTranscriptEditor) ? (
            <div id="transcript-count" className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-[#665f55]">
              <span>{transcript.trim().split(/\s+/).filter(Boolean).length} words · {transcript.length}/5000</span>
              {!isTextFallback && hasTranscript ? (
                <Button type="button" variant="outline" onClick={() => setEditingTranscript((current) => !current)} className="min-h-11 rounded-full border-[#9f9687]">
                  <PencilLine className="mr-2 h-4 w-4" />{editingTranscript ? "完成修正" : "修正 AI 聽錯的字"}
                </Button>
              ) : null}
            </div>
          ) : null}

          {restoredDraft ? <p role="status" className="mt-4 border-l-2 border-[#48634c] pl-4 text-sm text-[#48634c]">已返回原本的題目，並恢復登入前的逐字稿。</p> : null}

          {hasTranscript ? (
            <fieldset className="mt-6 border-t border-[#c9c0b1] pt-6">
              <legend className="font-serif text-xl text-[#26352a]">說完後做 30 秒自我檢查</legend>
              <p className="mt-2 text-xs leading-5 text-[#665f55]">請只對照你真正說過的內容；不確定就先不要勾。</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {checks.map((item) => {
                  const checked = completedChecks.includes(item.id);
                  return (
                    <label key={item.id} className={`flex min-h-12 cursor-pointer items-start gap-3 border p-3 text-sm leading-6 transition-colors ${checked ? "border-[#48634c] bg-[#edf0e8] text-[#26352a]" : "border-[#c9c0b1] bg-[#faf7ef] text-[#5e5b53]"}`}>
                      <input type="checkbox" checked={checked} onChange={() => toggleCheck(item.id)} className="mt-0.5 h-5 w-5 shrink-0 accent-[#48634c]" />
                      <span>{item.label}</span>
                    </label>
                  );
                })}
              </div>
              <p aria-live="polite" className="mt-3 text-xs font-medium text-[#48634c]">已完成 {completedChecks.length} / {checks.length} 項自我檢查。</p>
            </fieldset>
          ) : null}

          {hasTranscript && loading ? <p className="mt-5 inline-flex items-center gap-2 text-sm text-[#6d695f]"><LoaderCircle className="h-4 w-4 animate-spin" />正在確認登入狀態……</p> : null}
          {hasTranscript && !loading && !user ? (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-l-2 border-[#ad3f29] bg-[#f3efe4] p-4">
              <p className="max-w-xl text-sm leading-6 text-[#6d695f]">逐字稿與自我檢查可以直接使用；AI 回饋只開放給已登入學生。登入後會返回同一題，並恢復這份逐字稿。</p>
              <Button type="button" onClick={continueToLogin} className="rounded-full bg-[#172019] text-white">保留逐字稿並登入</Button>
            </div>
          ) : null}

          {user && actionsAvailable ? (
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={requestFeedback} disabled={pendingAction !== null} aria-busy={pendingAction === "feedback"} className="rounded-full bg-[#48634c] px-5 text-white hover:bg-[#384f3c]">
                {pendingAction === "feedback" ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}取得證據化回饋
              </Button>
              {mode === "group-discussion" ? (
                <>
                  {!discussionEnded ? (
                    <Button onClick={requestTeammate} disabled={pendingAction !== null} aria-busy={pendingAction === "teammate"} variant="outline" className="rounded-full border-[#9f9687] px-5">
                      {pendingAction === "teammate" ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}請 AI 組員回應第 {nextDiscussionRound} 輪
                    </Button>
                  ) : null}
                  {completedDiscussionRounds > 0 && !discussionEnded ? <Button type="button" onClick={() => setDiscussionEnded(true)} variant="ghost" className="rounded-full text-[#665f55]"><Flag className="mr-2 h-4 w-4" />結束本輪討論</Button> : null}
                </>
              ) : null}
            </div>
          ) : null}

          {error ? <p role="alert" className="mt-5 border-l-2 border-[#ad3f29] pl-4 text-sm leading-6 text-[#a74231]">{error} 你的錄音與逐字稿仍保留在本頁。</p> : null}
        </section>
      ) : null}

      {assessment ? (
        <section className="paper-surface paper-rule p-6" aria-live="polite">
          <p className="eyebrow flex items-center gap-2 text-[#ad3f29]"><MessageSquareText className="h-4 w-4" />AI coach · formative only</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4"><div><h2 className="font-serif text-2xl">逐字稿訓練量表</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#4f4b44]">{assessment.summary}</p></div><div className="border border-[#ad3f29] px-4 py-3 text-center"><span className="block font-mono text-3xl text-[#ad3f29]">{assessment.trainingLevel}/5</span><span className="mt-1 block text-[10px] uppercase tracking-[0.16em] text-[#665f55]">training signal</span></div></div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">{assessment.rubrics.map((rubric) => <article key={rubric.criterion} className="border border-[#c9c0b1] bg-white/45 p-4"><div className="flex items-center justify-between gap-3"><h3 className="font-semibold text-[#26352a]">{rubric.criterion}</h3><span className="font-mono text-sm text-[#ad3f29]">{rubric.trainingLevel}/5</span></div><p className="mt-3 text-xs leading-5 text-[#6d695f]"><strong className="text-[#4f4b44]">證據：</strong>{rubric.evidence}</p><p className="mt-2 text-xs leading-5 text-[#6d695f]"><strong className="text-[#4f4b44]">下一步：</strong>{rubric.nextStep}</p></article>)}</div>
          <p className="mt-5 text-xs leading-5 text-[#665f55]">{assessment.caveat} 不能評估錄音中的發音、可聽流暢度、節奏或眼神交流。</p>
        </section>
      ) : null}

      {discussionTurns.length > 0 ? (
        <section className="border border-[#48634c] bg-[#edf0e8] p-5 sm:p-6" aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="eyebrow flex items-center gap-2 text-[#48634c]"><Bot className="h-4 w-4" />3-round discussion track</p>
            <span className="font-mono text-xs text-[#48634c]">{completedDiscussionRounds} / 3 ROUNDS</span>
          </div>
          <ol className="mt-5 space-y-3">
            {discussionTurns.map((turn, index) => (
              <li key={`${turn.speaker}-${index}`} className={`border p-4 ${turn.speaker === "ai" ? "border-[#8da08f] bg-[#f7f8f2]" : "border-[#c9c0b1] bg-[#faf7ef]"}`}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-[#48634c]">{turn.label}</p>
                  {turn.speaker === "ai" ? <Button type="button" onClick={() => speakReply(turn.text)} variant="ghost" size="sm" className="min-h-11 rounded-full text-[#48634c]"><Volume2 className="mr-1 h-4 w-4" />朗讀</Button> : null}
                </div>
                <p className="mt-2 text-sm leading-7 text-[#26352a]">{turn.text}</p>
              </li>
            ))}
          </ol>
          {discussionEnded ? (
            <div className="mt-5 border-t border-[#8da08f] pt-5">
              <p className="font-serif text-2xl text-[#26352a]">本輪練習已收束</p>
              <p className="mt-2 text-sm leading-6 text-[#5e5b53]">你完成了 {completedDiscussionRounds} 輪接話。回看上面的自我檢查，選一項未做到的行為，再用不同說法重練。</p>
              <Button type="button" onClick={startNewDiscussion} variant="outline" className="mt-4 rounded-full border-[#8da08f]"><RotateCcw className="mr-2 h-4 w-4" />開始新的 3 輪練習</Button>
            </div>
          ) : <p className="mt-4 text-xs leading-5 text-[#6d695f]">閱讀或播放 AI 組員的觀點後，回到上方錄下全新一輪發言。上一輪逐字稿已鎖定，不會被下一輪覆蓋。AI A／B 都是合成練習角色，不是真人或考官。</p>}
        </section>
      ) : null}
    </div>
  );
}
