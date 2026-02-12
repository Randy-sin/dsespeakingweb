"use client";

import { useTracks, GridLayout, ParticipantTile } from "@livekit/components-react";
import { Track } from "livekit-client";

/**
 * A grid view specifically for spectators/markers that shows all remote
 * participants' camera + screen share tracks. Unlike VideoConference,
 * this always renders remote tracks even when the local user has no
 * published tracks.
 */
export function SpectatorGrid() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
      { source: Track.Source.Microphone, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  // Filter to only remote tracks (spectators don't publish)
  const remoteTracks = tracks.filter(
    (t) => t.participant.isLocal === false
  );

  if (remoteTracks.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-neutral-900">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-[13px] text-neutral-400">等待參與者連接...</p>
          <p className="text-[11px] text-neutral-500 mt-1">參與者開啟音視訊後即可觀看</p>
        </div>
      </div>
    );
  }

  return (
    <GridLayout tracks={remoteTracks} style={{ height: "100%" }}>
      <ParticipantTile />
    </GridLayout>
  );
}
