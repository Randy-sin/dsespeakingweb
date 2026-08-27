# DSE Speaking redesign QA

Reference: [MotionSites — Ink Dynasty](https://motionsites.ai/?prompt=ink-dynasty)

## Adaptation boundary

- Only adapted publicly observable visual ideas: warm paper surface, editorial asymmetry, vertical margin labels, oversized serif display type, restrained reveal motion and compact category labels.
- Did not copy MotionSites branding, prompt text, assets, source code or paid-library content.
- Replaced the original showcase/marketing purpose with an HKDSE Paper 4 learning hierarchy and Traditional Chinese teaching copy.

## Desktop review

- 1280 px homepage: hero, lesson paper, navigation and CTA remain above the fold with a clear learning-first message.
- Learning dashboard: new learners now see a complete first-20-minute path; returning learners see one progress-aware daily task and a direct next lesson.
- Course maps expose every lesson for browsing while visually distinguishing completed, recommended and available states.
- Practice landing pages use one shared three-step flow before topic selection, so preparation, speaking and retry expectations are consistent.
- Lesson page: principle, answer framework, weak/strong examples and short practice follow one reading spine.
- Practice: IR preparation, recorder entry and text fallback are visible; GD clearly identifies the generated teammate as AI rather than a live room.

## Mobile review

- Tested at 390 × 844 with no horizontal overflow (`scrollWidth = clientWidth = 390`).
- Mobile navigation exposes learning path, GD, IR, papers and today's practice.
- Mobile sheet closes after route navigation; all six retested learning/practice routes keep a single reading spine.
- Onboarding stacks the profile context, question and choices without clipping interactive controls.
- Touch targets use at least 44 px for principal actions.

## Interaction review

- Completed onboarding and generated a weakness-based first-week plan.
- Opened the recommended GD lesson, entered practice notes and persisted completion.
- Entered IR preparation, skipped to recording, and activated text fallback without requesting microphone permission.
- Entered a GD answer in text mode, verified the editable transcript, word count and logged-out AI sign-in boundary.
- Verified both anonymous AI endpoints return `401` when sent as same-origin requests; origin-less scripts are rejected before authentication/provider work.
- Verified legacy `/rooms/*` returns a 307 redirect to `/practice/group-discussion`.
- Verified keyboard Tab reveals the skip link and Enter moves directly to `#main-content`.
- Verified forum and paper pages no longer render nested button/link controls.

## Real AI acceptance · 2026-08-27

- Called the configured Doubao provider directly with a 40-word IR transcript. It returned all three required headings, cited the learner's concrete evidence and completed in 8.7 seconds.
- Called the configured Doubao provider as a GD teammate. It replied to the voucher point, added a new book-sharing idea, stayed within the requested 35–65 words and completed in 5.1 seconds.
- Repeated feedback with a four-word transcript. The model explicitly identified that the response was too short and requested reasons or examples instead of producing an official score.
- Walked the real IR and GD browser flows through preparation, text mode, editable transcript and word count. Logged-out users were correctly stopped at the AI sign-in boundary.
- Verified same-origin anonymous requests to both AI routes return `401`; no provider resources are consumed before authentication.
- Opened the current Volcengine application and enabled the free trial for the BigModel flash recording recognizer: 20 hours and 2 concurrent requests.
- Sent a real 7.4-second English WAV to `volc.bigasr.auc_turbo`. The provider returned the expected English transcript, proving that the newly enabled entitlement is active.
- Replaced free-form feedback with a four-dimension transcript rubric. A real Doubao call returned all four required criteria, evidence for each row, a next step and an explicit transcript-only caveat in 17.8 seconds.
- Connected provider transcripts, rubric assessments and AI teammate turns to private Supabase practice records.
- Verified authenticated-role RLS write/read for one practice session and two turns inside a transaction, then rolled it back. The production tables remain unchanged at zero test records.
- Rechecked same-origin anonymous calls after the API contract changes. Analysis and multipart transcription both return `401` before consuming provider resources.

## Issues found and resolved

- Added Next.js smooth-scroll metadata to remove the route-transition warning.
- Added an explicit Sheet dialog description override to remove the Radix accessibility warning.
- Updated Next.js and `ws`; full and production npm audits now report zero vulnerabilities.
- Migrated deprecated `middleware.ts` to the current `proxy.ts` convention.
- Restarted the local development server after a Turbopack stylesheet cache miss, then confirmed the skip-link and learning-rail styles were present in the browser.

final result: ASR entitlement, real transcription, structured rubric generation, private persistence schema, anonymous boundaries, lint, typecheck and production build passed. Formal release acceptance still requires one signed-in student browser run through recording upload, rubric display, AI teammate response and persisted progress.
