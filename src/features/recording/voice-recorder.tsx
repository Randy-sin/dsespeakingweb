"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FileAudio, LoaderCircle, Mic, RotateCcw, Square, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { convertAudioBlobToWav } from "@/features/recording/audio-to-wav";
import { recordPractice } from "@/lib/learning/store";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import type { PracticeMode } from "@/lib/learning/types";

type RecorderState = "idle" | "recording" | "recorded" | "text";

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
  onTranscriptChange?: (transcript: string) => void;
  onSessionChange?: (sessionId: string | null) => void;
};

function getSpeechRecognitionConstructor() {
  const speechWindow = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructorLike;
    webkitSpeechRecognition?: SpeechRecognitionConstructorLike;
  };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

export function VoiceRecorder({ maxSeconds = 60, mode, task, onTranscriptChange, onSessionChange }: VoiceRecorderProps) {
  const [state, setState] = useState<RecorderState>("idle");
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncRecording, setSyncRecording] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const { user } = useUser();
  const supabase = useMemo(() => createClient(), []);
  const recorderRef = useRef<MediaRecorder | null>(null);
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
    if (state === "recording" && seconds >= maxSeconds) recorderRef.current?.stop();
  }, [maxSeconds, seconds, state]);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    recognitionRef.current?.stop();
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  const startRecording = async () => {
    setError(null);
    if (!("MediaRecorder" in window) || !navigator.mediaDevices?.getUserMedia) {
      setError("這個瀏覽器不支援錄音，你仍可以切換到文字模式完成練習。");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => { if (event.data.size > 0) chunksRef.current.push(event.data); };
      recorder.onstop = async () => {
        recognitionRef.current?.stop();
        recognitionRef.current = null;
        const mimeType = recorder.mimeType?.split(";")[0] || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setAudioUrl((current) => { if (current) URL.revokeObjectURL(current); return URL.createObjectURL(blob); });
        stream.getTracks().forEach((track) => track.stop());
        const duration = startedAtRef.current ? Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000)) : 1;
        recordPractice(duration);
        startedAtRef.current = null;
        if (syncRecording && user) {
          const extension = mimeType.includes("mp4") ? "m4a" : mimeType.includes("ogg") ? "ogg" : "webm";
          const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
          const { error: uploadError } = await supabase.storage.from("speaking-recordings").upload(path, blob, { contentType: mimeType });
          if (uploadError) {
            setSaveMessage("錄音仍可在本頁回放，但雲端儲存失敗。請稍後再試。");
          } else {
            const { data: session, error: sessionError } = await supabase.from("practice_sessions").insert({ user_id: user.id, mode, task_text: task, status: "recorded", duration_seconds: duration, recording_path: path }).select("id").single();
            if (session?.id) {
              sessionIdRef.current = session.id;
              onSessionChange?.(session.id);
            }
            setSaveMessage(sessionError ? "錄音已私人儲存，但未能建立練習記錄。" : "錄音已儲存到你的私人練習記錄。");
          }
        }
        setState("recorded");
      };
      setSeconds(0);
      sessionIdRef.current = null;
      onSessionChange?.(null);
      startedAtRef.current = Date.now();
      const SpeechRecognition = getSpeechRecognitionConstructor();
      if (SpeechRecognition && onTranscriptChange) {
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
        try {
          recognition.start();
          recognitionRef.current = recognition;
        } catch {
          recognitionRef.current = null;
        }
      }
      recorder.start();
      setState("recording");
    } catch {
      setError("未能使用麥克風。請在瀏覽器設定允許錄音，或改用文字模式。");
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
    setState("idle");
  };

  const transcribeRecording = async () => {
    if (!audioBlob) return;
    setError(null);
    setSaveMessage(null);
    setTranscribing(true);
    try {
      const wav = await convertAudioBlobToWav(audioBlob);
      const form = new FormData();
      form.append("audio", wav, "practice.wav");
      form.append("mode", mode);
      form.append("task", task);
      if (sessionIdRef.current) form.append("sessionId", sessionIdRef.current);
      const response = await fetch("/api/ai/transcribe", { method: "POST", body: form });
      const data = (await response.json()) as { ok?: boolean; transcript?: string; sessionId?: string; error?: string };
      if (!response.ok || !data.ok || !data.transcript) {
        throw new Error(response.status === 401 ? "請先登入，再使用 AI 逐字稿。" : data.error || "AI 逐字稿暫時無法使用。請稍後再試。");
      }
      onTranscriptChange?.(data.transcript);
      if (data.sessionId) {
        sessionIdRef.current = data.sessionId;
        onSessionChange?.(data.sessionId);
      }
      setSaveMessage("AI 逐字稿已生成並保存到你的私人練習記錄；請先校對，再取得分析。");
    } catch (transcriptionError) {
      setError(transcriptionError instanceof Error ? transcriptionError.message : "AI 逐字稿暫時無法使用。請稍後再試。");
    } finally {
      setTranscribing(false);
    }
  };

  const formatted = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="border border-[#bdb3a2] bg-[#faf7ef] p-5 sm:p-7">
      <div className="flex items-center justify-between"><p className="eyebrow text-[#8a8175]">Your response</p><span className={`h-2.5 w-2.5 rounded-full ${state === "recording" ? "animate-pulse bg-[#c84b31]" : "bg-[#bdb3a2]"}`} /></div>
      {user && state === "idle" ? <label className="mt-5 flex items-center gap-3 text-xs text-[#6d695f]"><input type="checkbox" checked={syncRecording} onChange={(event) => setSyncRecording(event.target.checked)} className="h-4 w-4 accent-[#48634c]" />把本次錄音儲存到我的私人帳號</label> : null}
      {state === "text" ? (
        <div className="mt-6"><p className="text-sm leading-7 text-[#6d695f]">已切換到文字模式。請在下方的「逐字稿草稿」輸入你原本會說的答案。</p><Button variant="ghost" onClick={reset} className="mt-3 rounded-full"><RotateCcw className="mr-2 h-4 w-4" />返回錄音模式</Button></div>
      ) : (
        <div className="mt-8 text-center">
          <p className="font-mono text-5xl tracking-[-0.07em]">{formatted}</p><p className="mt-2 font-mono text-[10px] text-[#8a8175]">LIMIT {Math.floor(maxSeconds / 60)}:{String(maxSeconds % 60).padStart(2, "0")}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {state === "idle" ? <Button onClick={startRecording} className="h-[52px] rounded-full bg-[#c84b31] px-7 text-white hover:bg-[#aa3d27]"><Mic className="mr-2 h-4 w-4" />開始錄音</Button> : null}
            {state === "recording" ? <Button onClick={() => recorderRef.current?.stop()} className="h-[52px] rounded-full bg-[#172019] px-7 text-white"><Square className="mr-2 h-4 w-4" />完成錄音</Button> : null}
            {state === "recorded" && audioUrl ? <><audio controls src={audioUrl} className="w-full max-w-md" />{user ? <Button onClick={transcribeRecording} disabled={transcribing} className="rounded-full bg-[#48634c] px-5 text-white hover:bg-[#384f3c]">{transcribing ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <FileAudio className="mr-2 h-4 w-4" />}生成 AI 逐字稿</Button> : null}<Button onClick={reset} variant="outline" className="rounded-full border-[#9f9687]"><RotateCcw className="mr-2 h-4 w-4" />重錄</Button></> : null}
          </div>
          {error ? <p role="alert" className="mx-auto mt-5 max-w-md text-sm leading-6 text-[#a74231]">{error}</p> : null}
          {saveMessage ? <p role="status" className="mx-auto mt-5 max-w-md text-sm leading-6 text-[#48634c]">{saveMessage}</p> : null}
          {state === "recorded" && user ? <p className="mx-auto mt-4 max-w-xl text-xs leading-5 text-[#8a8175]">按下「生成 AI 逐字稿」後，錄音會轉成 WAV 並傳送到火山引擎進行識別；逐字稿會儲存到你的私人記錄。原始錄音只會在勾選上方選項時儲存。</p> : null}
          {state === "idle" || error ? <button type="button" onClick={() => setState("text")} className="mt-5 inline-flex items-center gap-2 text-xs text-[#6d695f] underline underline-offset-4"><Type className="h-3.5 w-3.5" />改用文字模式</button> : null}
        </div>
      )}
    </div>
  );
}
