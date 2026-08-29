import type { SupabaseClient } from "@supabase/supabase-js";
import type { BasicAssessmentCoaching } from "@/lib/ai/basic-coaching";
import type { PracticeAssessment } from "@/lib/ai/practice-assessment";
import type { PracticeMode } from "@/lib/learning/types";

type SaveBase = {
  supabase: SupabaseClient;
  userId: string;
  mode: PracticeMode;
  task: string;
  transcript: string;
  sessionId?: string | null;
  paperId?: string | null;
};

async function ensureSession(input: SaveBase, feedback: Record<string, unknown>, status: "transcribed" | "analyzed") {
  if (input.sessionId) {
    const { data, error } = await input.supabase
      .from("practice_sessions")
      .update({ transcript: input.transcript, feedback, status })
      .eq("id", input.sessionId)
      .eq("user_id", input.userId)
      .select("id")
      .single();
    if (error || !data) throw new Error("Unable to update the private practice session");
    return { id: data.id as string, created: false };
  }
  const { data, error } = await input.supabase
    .from("practice_sessions")
    .insert({ user_id: input.userId, mode: input.mode, paper_id: input.paperId ?? null, task_text: input.task, transcript: input.transcript, feedback, status })
    .select("id")
    .single();
  if (error || !data) throw new Error("Unable to save the private practice session");
  return { id: data.id as string, created: true };
}

async function rollbackCreatedSession(supabase: SupabaseClient, sessionId: string, created: boolean) {
  if (created) await supabase.from("practice_sessions").delete().eq("id", sessionId);
}

export async function saveTranscript(input: SaveBase) {
  const session = await ensureSession(input, { evidenceSource: "provider_transcript" }, "transcribed");
  const { error } = await input.supabase.from("practice_turns").upsert(
    { session_id: session.id, user_id: input.userId, sequence_number: 1, speaker: "learner", transcript: input.transcript },
    { onConflict: "session_id,sequence_number" }
  );
  if (error) {
    await rollbackCreatedSession(input.supabase, session.id, session.created);
    throw new Error("Unable to save the private transcript");
  }
  return session.id;
}

export async function saveAssessment(input: SaveBase, assessment: PracticeAssessment) {
  const feedback = { kind: "formative_transcript_assessment", evidenceSource: "learner_transcript", assessment };
  const session = await ensureSession(input, feedback, "analyzed");
  const { error } = await input.supabase.from("practice_turns").upsert(
    { session_id: session.id, user_id: input.userId, sequence_number: 1, speaker: "learner", transcript: input.transcript, evidence_feedback: feedback },
    { onConflict: "session_id,sequence_number" }
  );
  if (error) {
    await rollbackCreatedSession(input.supabase, session.id, session.created);
    throw new Error("Unable to save the private assessment");
  }
  return session.id;
}

export async function saveBasicCoaching(input: SaveBase, basicCoaching: BasicAssessmentCoaching) {
  const feedback = {
    kind: "deterministic_basic_coaching",
    evidenceSource: "local_rules",
    providerStatus: "degraded",
    basicCoaching,
  };
  const session = await ensureSession(input, feedback, "analyzed");
  return session.id;
}

export async function saveDiscussionTurns(input: SaveBase, aiResponse: string) {
  let previousFeedback: Record<string, unknown> = {};
  if (input.sessionId) {
    const { data } = await input.supabase
      .from("practice_sessions")
      .select("feedback")
      .eq("id", input.sessionId)
      .eq("user_id", input.userId)
      .maybeSingle();
    if (data?.feedback && typeof data.feedback === "object" && !Array.isArray(data.feedback)) {
      previousFeedback = data.feedback as Record<string, unknown>;
    }
  }
  const feedback = { ...previousFeedback, aiTeammate: { kind: "ai_teammate_turn", evidenceSource: "learner_transcript" } };
  const session = await ensureSession(input, feedback, "analyzed");
  const { data: lastTurn } = await input.supabase
    .from("practice_turns")
    .select("sequence_number")
    .eq("session_id", session.id)
    .eq("user_id", input.userId)
    .order("sequence_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  const learnerSequence = (lastTurn?.sequence_number ?? 0) + 1;
  const { error } = await input.supabase.from("practice_turns").insert([
    {
      session_id: session.id,
      user_id: input.userId,
      sequence_number: learnerSequence,
      speaker: "learner",
      transcript: input.transcript,
      evidence_feedback: Object.keys(previousFeedback).length > 0 ? previousFeedback : null,
    },
    { session_id: session.id, user_id: input.userId, sequence_number: learnerSequence + 1, speaker: "ai", transcript: aiResponse, evidence_feedback: feedback },
  ]);
  if (error) {
    await rollbackCreatedSession(input.supabase, session.id, session.created);
    throw new Error("Unable to save the private discussion turns");
  }
  return session.id;
}
