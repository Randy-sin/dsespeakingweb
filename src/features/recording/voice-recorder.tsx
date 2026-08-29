"use client";

import { useEffect, useRef, useState } from "react";
import { FileAudio, LoaderCircle, Mic, RotateCcw, Square, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { convertAudioBlobToWav } from "@/features/recording/audio-to-wav";
import { trackProductEvent } from "@/lib/analytics/client";
import { bucketDuration, type ProductEventContext, type ProductEventErrorCode, type ProductEventSurface } from "@/lib/analytics/events";
import { recordPractice } from "@/lib/learning/store";
import { useUser } from "@/hooks/use-user";
import { formatDuration } from "@/lib/format-duration";
import type { PracticeMode } from "@/lib/learning/types";

export type RecorderState = "idle" | "recording" | "recorded" | "text";

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  readonly length: number;
  readonly isFinal: boolean;
  readonly [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike extends Event {
  readonly resultIndex: number;
  readonly results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionConstructorLike {
  new (): SpeechRecognitionLike;
}

type VoiceRecorderProps = {
  maxSeconds?: number;
  mode: PracticeMode;
  task: string;
  paperId?: string;
  allowTextFallback?: boolean;
  showAccountOptions?: boolean;
  onRecordingComplete?: (duration: number) => void;
  onRecordingStart?: () => void;
  onReset?: () => void;
  onStateChange?: (state: RecorderState) => void;
  onTranscriptChange?: (transcript: string) => void;
  onSessionChange?: (sessionId: string | null) => void;
  analyticsContext?: {
    surface: ProductEventSurface;
    context: ProductEventContext;
    contentId?: string;
  };
};

function classifyRecordingError(error: unknown): ProductEventErrorCode {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") return "permission-denied";
  if (["NotFoundError", "DevicesNotFoundError", "NotReadableError", "TrackStartError"].includes(name)) return "device-unavailable";
  return "recording-failed";
}

function getSpeechRecognitionConstructor() {
  const speechWindow = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructorLike;
    webkitSpeechRecognition?: SpeechRecognitionConstructorLike;
  };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

export function VoiceRecorder({
  maxSeconds = 60,
  mode,
  task,
  paperId,
  allowTextFallback = true,
  showAccountOptions = true,
  onRecordingComplete,
  onRecordingStart,
  onReset,
  onStateChange,
  onTranscriptChange,
  onSessionChange,
  analyticsContext,
}: VoiceRecorderProps) {
  const [state, setState] = useState<RecorderState>("idle");
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncRecording, setSyncRecording] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const { user, supabase } = useUser();
  const recorderRef = useRef<MediaRecorder | null>(null);
  const stopButtonRef = useRef<HTMLButtonElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (state !== "recording") return;
    const interval = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(interval);
  }, [state]);

  useEffect(() => {
    if (state === "recording") stopButtonRef.current?.focus();
    if (state === "recorded") audioRef.current?.focus();
  }, [state]);

  useEffect(() => {
    onStateChange?.(state);
  }, [onStateChange, state]);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  useEffect(() => {
    if (state === "recording" && seconds >= maxSeconds && recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
  }, [maxSeconds, seconds, state]);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    recognitionRef.current?.stop();
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  const startRecording = async () => {
    setError(null);
    if (!("MediaRecorder" in window) || !navigator.mediaDevices?.getUserMedia) {
      if (analyticsContext) {
        trackProductEvent({
          name: "recording_failed",
          ...analyticsContext,
          mode,
          outcome: "failure",
          errorCode: "unsupported-browser",
          inputSource: "voice",
          authState: user ? "authenticated" : "anonymous",
        });
      }
      setError(allowTextFallback
        ? "這個瀏覽器不支援錄音。你可以使用下方的文字後備，題目不會消失。"
        : "這個瀏覽器不支援錄音。請改用支援麥克風的瀏覽器，或先進入第一課。",
      );
      return;
    }
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const activeStream = stream;
      streamRef.current = activeStream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(activeStream);
      recorderRef.current = recorder;
      let stopHandled = false;
      let recordingHadError = false;
      recorder.ondataavailable = (event) => { if (event.data.size > 0) chunksRef.current.push(event.data); };
      recorder.onerror = () => {
        if (recordingHadError) return;
        recordingHadError = true;
        if (analyticsContext) {
          trackProductEvent({
            name: "recording_failed",
            ...analyticsContext,
            mode,
            outcome: "failure",
            errorCode: "recording-failed",
            inputSource: "voice",
            authState: user ? "authenticated" : "anonymous",
          });
        }
        setError("錄音被瀏覽器中斷。請檢查麥克風連線後再試。");
      };
      recorder.onstop = async () => {
        if (stopHandled) return;
        stopHandled = true;
        recognitionRef.current?.stop();
        recognitionRef.current = null;
        if (recordingHadError) {
          activeStream.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
          recorderRef.current = null;
          startedAtRef.current = null;
          setState("idle");
          return;
        }
        const mimeType = recorder.mimeType?.split(";")[0] || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setAudioUrl((current) => { if (current) URL.revokeObjectURL(current); return URL.createObjectURL(blob); });
        activeStream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        recorderRef.current = null;
        const duration = startedAtRef.current ? Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000)) : 1;
        recordPractice(duration);
        if (analyticsContext) {
          trackProductEvent({
            name: "recording_completed",
            ...analyticsContext,
            mode,
            outcome: "success",
            inputSource: "voice",
            durationBucket: bucketDuration(duration),
            authState: user ? "authenticated" : "anonymous",
          });
        }
        onRecordingComplete?.(duration);
        startedAtRef.current = null;
        setState("recorded");
        if (syncRecording && user) {
          const extension = mimeType.includes("mp4") ? "m4a" : mimeType.includes("ogg") ? "ogg" : "webm";
          const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
          const { error: uploadError } = await supabase.storage.from("speaking-recordings").upload(path, blob, { contentType: mimeType });
          if (uploadError) {
            setSaveMessage("錄音仍可在本頁回放，但雲端儲存失敗。請稍後再試。");
          } else {
            const { data: session, error: sessionError } = await supabase.from("practice_sessions").insert({ user_id: user.id, mode, paper_id: paperId ?? null, task_text: task, status: "recorded", duration_seconds: duration, recording_path: path }).select("id").single();
            if (session?.id) {
              sessionIdRef.current = session.id;
              onSessionChange?.(session.id);
            }
            setSaveMessage(sessionError ? "錄音已私人儲存，但未能建立練習記錄。" : "錄音已儲存到你的私人練習記錄。");
          }
        }
      };
      setSeconds(0);
      sessionIdRef.current = null;
      onSessionChange?.(null);
      recorder.start();
      startedAtRef.current = Date.now();
      if (analyticsContext) {
        trackProductEvent({
          name: "recording_started",
          ...analyticsContext,
          mode,
          authState: user ? "authenticated" : "anonymous",
          inputSource: "voice",
        });
      }
      onRecordingStart?.();
      setState("recording");

      const SpeechRecognition = getSpeechRecognitionConstructor();
      if (SpeechRecognition && onTranscriptChange) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = "en-HK";
          recognition.onresult = (event) => {
            let draft = "";
            for (let index = 0; index < event.results.length; index += 1) {
              draft += event.results[index][0]?.transcript ?? "";
            }
            if (draft.trim()) onTranscriptChange(draft.trim());
          };
          recognition.onerror = () => {
            recognitionRef.current = null;
          };
          recognition.start();
          recognitionRef.current = recognition;
        } catch {
          recognitionRef.current = null;
        }
      }
    } catch (recordingError) {
      stream?.getTracks().forEach((track) => track.stop());
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      streamRef.current = null;
      recorderRef.current = null;
      const errorName = recordingError instanceof DOMException ? recordingError.name : "";
      if (analyticsContext) {
        trackProductEvent({
          name: "recording_failed",
          ...analyticsContext,
          mode,
          outcome: "failure",
          errorCode: classifyRecordingError(recordingError),
          authState: user ? "authenticated" : "anonymous",
          inputSource: "voice",
        });
      }
      const recovery = allowTextFallback ? "，或使用下方的文字後備" : "後再試";
      if (errorName === "NotAllowedError") {
        setError(`瀏覽器未允許使用麥克風。請在網址列開啟麥克風權限${recovery}。`);
      } else if (errorName === "NotFoundError") {
        setError(`找不到可用的麥克風。請連接裝置${recovery}。`);
      } else if (errorName === "NotReadableError") {
        setError(`麥克風可能正被其他程式使用。關閉其他錄音程式${recovery}。`);
      } else {
        setError(`未能開始錄音。請檢查麥克風設定${recovery}。`);
      }
    }
  };

  const reset = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setAudioBlob(null);
    setSeconds(0);
    setError(null);
    setSaveMessage(null);
    sessionIdRef.current = null;
    onSessionChange?.(null);
    onReset?.();
    setState("idle");
  };

  const useTextFallback = () => {
    setError(null);
    onReset?.();
    if (analyticsContext) {
      trackProductEvent({
        name: "text_fallback_opened",
        ...analyticsContext,
        mode,
        outcome: "success",
        inputSource: "text-fallback",
        authState: user ? "authenticated" : "anonymous",
      });
    }
    setState("text");
  };

  const transcribeRecording = async () => {
    if (!audioBlob) return;
    setError(null);
    setSaveMessage(null);
    setTranscribing(true);
    let requestReachedServer = false;
    let clientErrorCode: ProductEventErrorCode = "transcription-failed";
    try {
      const wav = await convertAudioBlobToWav(audioBlob);
      const form = new FormData();
      form.append("audio", wav, "practice.wav");
      form.append("mode", mode);
      form.append("task", task);
      if (paperId) form.append("paperId", paperId);
      if (sessionIdRef.current) form.append("sessionId", sessionIdRef.current);
      clientErrorCode = "network-failed";
      const response = await fetch("/api/ai/transcribe", { method: "POST", body: form });
      requestReachedServer = true;
      const data = (await response.json()) as { ok?: boolean; transcript?: string; sessionId?: string; error?: string };
      if (!response.ok || !data.ok || !data.transcript) {
        if (response.status === 401) throw new Error("請先登入，再使用 AI 逐字稿。");
        if (response.status === 429) throw new Error("你剛才生成逐字稿的次數較多，請稍後再試。錄音仍保留在本頁。");
        throw new Error(data.error || "AI 逐字稿暫時無法使用。請稍後再試。");
      }
      onTranscriptChange?.(data.transcript);
      if (data.sessionId) {
        sessionIdRef.current = data.sessionId;
        onSessionChange?.(data.sessionId);
      }
      setSaveMessage("AI 逐字稿已生成並保存到你的私人練習記錄；請先校對，再取得分析。");
    } catch (transcriptionError) {
      if (!requestReachedServer && analyticsContext) {
        trackProductEvent({
          name: "transcription_failed",
          ...analyticsContext,
          mode,
          outcome: "failure",
          errorCode: clientErrorCode,
          inputSource: "voice",
          authState: user ? "authenticated" : "anonymous",
        });
      }
      setError(transcriptionError instanceof Error ? transcriptionError.message : "AI 逐字稿暫時無法使用。請稍後再試。");
    } finally {
      setTranscribing(false);
    }
  };

  const recorderStatus = state === "recording" ? "錄音中" : state === "recorded" ? "錄音完成" : state === "text" ? "文字模式" : "尚未開始";

  return (
    <div className="border border-[#bdb3a2] bg-[#faf7ef] p-5 sm:p-7">
      <div className="flex items-center justify-between gap-4"><p className="eyebrow text-[#665f55]">Your response</p><p role="status" className="inline-flex items-center gap-2 text-xs text-[#665f55]"><span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${state === "recording" ? "animate-pulse bg-[#ad3f29]" : "bg-[#bdb3a2]"}`} />{recorderStatus}</p></div>
      {user && showAccountOptions && state === "idle" ? <label className="mt-5 flex items-center gap-3 text-xs text-[#6d695f]"><input type="checkbox" checked={syncRecording} onChange={(event) => setSyncRecording(event.target.checked)} className="h-4 w-4 accent-[#48634c]" />把本次錄音儲存到我的私人帳號</label> : null}
      {state === "text" ? (
        <div className="mt-6"><p className="text-sm leading-7 text-[#6d695f]">麥克風後備已開啟。只有在無法錄音時，才需要使用下方文字欄。</p><Button variant="ghost" onClick={reset} className="mt-3 min-h-11 rounded-full"><RotateCcw className="mr-2 h-4 w-4" />返回錄音模式</Button></div>
      ) : (
        <div className="mt-8 text-center">
          <p role="timer" aria-label={`已錄音 ${seconds} 秒`} className="font-mono text-5xl tracking-[-0.07em]">{formatDuration(seconds)}</p><p className="mt-2 font-mono text-[10px] text-[#665f55]">LIMIT {formatDuration(maxSeconds)}</p>
          {state === "idle" ? <p className="mx-auto mt-4 max-w-sm text-xs leading-5 text-[#665f55]">按下後才會請求麥克風權限。錄音預設只留在這個瀏覽器。</p> : null}
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {state === "idle" ? <Button onClick={startRecording} className="h-24 w-24 flex-col rounded-full bg-[#ad3f29] px-3 text-white shadow-[0_0_0_10px_rgba(173,63,41,0.10)] hover:bg-[#aa3d27]"><Mic className="mb-1 h-6 w-6" /><span>開始說</span></Button> : null}
            {state === "recording" ? <Button ref={stopButtonRef} onClick={() => recorderRef.current?.stop()} className="h-24 w-24 flex-col rounded-full bg-[#172019] px-3 text-white shadow-[0_0_0_10px_rgba(23,32,25,0.10)]"><Square className="mb-1 h-5 w-5" /><span>說完了</span></Button> : null}
            {state === "recorded" && audioUrl ? <><audio ref={audioRef} controls src={audioUrl} aria-label="你的練習錄音" className="w-full max-w-md" />{user && showAccountOptions ? <Button onClick={transcribeRecording} disabled={transcribing} aria-busy={transcribing} className="min-h-11 rounded-full bg-[#48634c] px-5 text-white hover:bg-[#384f3c]">{transcribing ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <FileAudio className="mr-2 h-4 w-4" />}整理成 AI 逐字稿</Button> : null}<Button onClick={reset} variant="outline" className="min-h-11 rounded-full border-[#9f9687]"><RotateCcw className="mr-2 h-4 w-4" />再說一次</Button></> : null}
          </div>
          {error ? <p ref={errorRef} tabIndex={-1} role="alert" className="mx-auto mt-5 max-w-md outline-none text-sm leading-6 text-[#a74231]">{error}</p> : null}
          {saveMessage ? <p role="status" className="mx-auto mt-5 max-w-md text-sm leading-6 text-[#48634c]">{saveMessage}</p> : null}
          {state === "recorded" && user && showAccountOptions ? <p className="mx-auto mt-4 max-w-xl text-xs leading-5 text-[#665f55]">按下「整理成 AI 逐字稿」後，錄音會轉成 WAV 並傳送到火山引擎進行識別；逐字稿會儲存到你的私人記錄。原始錄音只會在勾選上方選項時儲存。</p> : null}
          {error && allowTextFallback ? <button type="button" onClick={useTextFallback} className="mt-5 inline-flex min-h-11 items-center gap-2 text-xs text-[#6d695f] underline underline-offset-4"><Type className="h-3.5 w-3.5" />麥克風無法使用，開啟文字後備</button> : null}
        </div>
      )}
    </div>
  );
}
