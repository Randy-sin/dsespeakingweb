"use client";

import { useEffect } from "react";
import { useRoomContext } from "@livekit/components-react";
import { RoomEvent, Track } from "livekit-client";

/**
 * For spectator role: keep only audio subscriptions to save bandwidth.
 * Video tracks are unsubscribed immediately and on future publications.
 */
export function SpectatorAudioOnlyEnforcer() {
  const room = useRoomContext();

  useEffect(() => {
    const applyAudioOnly = () => {
      for (const participant of room.remoteParticipants.values()) {
        for (const publication of participant.trackPublications.values()) {
          if (publication.kind === Track.Kind.Video) {
            publication.setSubscribed(false);
          } else if (publication.kind === Track.Kind.Audio) {
            publication.setSubscribed(true);
          }
        }
      }
    };

    applyAudioOnly();
    room.on(RoomEvent.TrackPublished, applyAudioOnly);
    room.on(RoomEvent.ParticipantConnected, applyAudioOnly);

    return () => {
      room.off(RoomEvent.TrackPublished, applyAudioOnly);
      room.off(RoomEvent.ParticipantConnected, applyAudioOnly);
    };
  }, [room]);

  return null;
}
