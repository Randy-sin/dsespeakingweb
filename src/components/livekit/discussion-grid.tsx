"use client";

import { useTracks, ParticipantTile } from "@livekit/components-react";
import { Track } from "livekit-client";

interface DiscussionGridProps {
  isObserver?: boolean;
}

export function DiscussionGrid({ isObserver = false }: DiscussionGridProps) {
  const tracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }],
    { onlySubscribed: false }
  );

  const videoTracks = isObserver
    ? tracks.filter((t) => !t.participant.isLocal)
    : tracks;

  const visibleTracks = videoTracks.slice(0, 4);
  const missing = Math.max(0, 4 - visibleTracks.length);

  return (
    <div className="h-full w-full grid grid-cols-2 grid-rows-2 gap-2 p-2 bg-neutral-800">
      {visibleTracks.map((trackRef) => (
        <div key={trackRef.participant.identity} className="min-h-0 min-w-0">
          <ParticipantTile trackRef={trackRef} />
        </div>
      ))}
      {Array.from({ length: missing }).map((_, idx) => (
        <div
          key={`placeholder-${idx}`}
          className="rounded-xl border border-white/10 bg-neutral-700/40 flex items-center justify-center"
        >
          <span className="text-[12px] text-white/55">等待加入</span>
        </div>
      ))}
    </div>
  );
}
