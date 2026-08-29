alter table private.product_events
  drop constraint if exists product_events_event_name_check;

alter table private.product_events
  add constraint product_events_event_name_check check (
    event_name in (
      'site_session_started',
      'primary_cta_clicked',
      'paper_opened',
      'practice_started',
      'preparation_started',
      'recording_started',
      'recording_completed',
      'recording_failed',
      'text_fallback_opened',
      'transcription_completed',
      'transcription_failed',
      'analysis_completed',
      'analysis_failed',
      'basic_coaching_delivered',
      'discussion_turn_completed',
      'discussion_completed',
      'auth_started',
      'auth_completed',
      'auth_failed',
      'onboarding_completed',
      'lesson_completed',
      'flow_error'
    )
  );
