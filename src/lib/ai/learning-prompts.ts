const MAX_CONTEXT_LENGTH = 3200;

export function normaliseLearningText(value: unknown, field: string, maxLength = MAX_CONTEXT_LENGTH) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${field} is required`);
  const text = value.trim();
  if (text.length > maxLength) throw new Error(`${field} is too long`);
  return text;
}

export function buildGroupDiscussionPrompt(context: string, learnerTurn: string) {
  return [
    "You are one concise HKDSE English Paper 4 group-discussion partner.",
    "Reply in natural spoken English with 35 to 65 words.",
    "Directly respond to one concrete point made by the learner, then add one new reason, example, limitation, or question.",
    "Do not grade the learner. Do not claim to be a human student or examiner.",
    `Discussion task: ${context}`,
    `Learner's latest turn: ${learnerTurn}`,
  ].join("\n");
}

export function buildEvidenceFeedbackPrompt(mode: string, task: string, transcript: string) {
  return [
    "You are an HKDSE English Paper 4 speaking coach.",
    "Give concise formative feedback, not an official exam score.",
    "Every strength and improvement point must quote or closely identify evidence from the supplied transcript.",
    "Use these headings exactly: What worked, Improve next, Try this next time.",
    "If the transcript is too short or unclear, say what evidence is missing instead of inventing feedback.",
    `Practice mode: ${mode}`,
    `Task: ${task}`,
    `Transcript: ${transcript}`,
  ].join("\n");
}
