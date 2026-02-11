"use client";

import { useEffect, useRef } from "react";
import { useLocalParticipant } from "@livekit/components-react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, Eye } from "lucide-react";
import type { RoomStatus } from "@/lib/supabase/types";

interface MediaControlsProps {
  roomStatus: RoomStatus;
  currentSpeakerUserId?: string;
  isSpectator: boolean;
  userId?: string;
  connected: boolean;
}

/**
 * This component MUST be rendered INSIDE a <LiveKitRoom> context.
 * It uses the useLocalParticipant hook to directly control audio/video tracks.
 */
export function MediaControls({
  roomStatus,
  currentSpeakerUserId,
  isSpectator,
  userId,
  connected,
}: MediaControlsProps) {
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } =
    useLocalParticipant();
  const prevRoomStatus = useRef<RoomStatus | null>(null);
  const hasAutoEnabled = useRef(false);

  // Auto-toggle audio/video based on room phase changes
  useEffect(() => {
    if (isSpectator || !connected) return;

    // Only auto-toggle when roomStatus changes (not on every render)
    if (roomStatus === prevRoomStatus.current) return;
    prevRoomStatus.current = roomStatus;

    if (roomStatus === "discussing" && !hasAutoEnabled.current) {
      hasAutoEnabled.current = true;
      // Small delay to ensure LiveKit room is ready
      setTimeout(() => {
        localParticipant.setMicrophoneEnabled(true);
        localParticipant.setCameraEnabled(true);
      }, 500);
    } else if (roomStatus === "individual") {
      const isSpeaker = userId === currentSpeakerUserId;
      localParticipant.setMicrophoneEnabled(isSpeaker);
      localParticipant.setCameraEnabled(true);
    }
  }, [
    roomStatus,
    currentSpeakerUserId,
    userId,
    isSpectator,
    localParticipant,
    connected,
  ]);

  if (isSpectator) {
    return (
      <div className="flex items-center justify-center gap-1.5">
        <Eye className="h-3.5 w-3.5 text-neutral-400" />
        <span className="text-[11px] text-neutral-400">观看模式</span>
        <div className="flex items-center gap-1 ml-2">
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              connected ? "bg-neutral-900" : "bg-neutral-300"
            }`}
          />
          <span className="text-[11px] text-neutral-400">
            {connected ? "Connected" : "Connecting..."}
          </span>
        </div>
      </div>
    );
  }

  const handleToggleMic = async () => {
    try {
      await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
    } catch (err) {
      console.error("Failed to toggle mic:", err);
    }
  };

  const handleToggleCam = async () => {
    try {
      await localParticipant.setCameraEnabled(!isCameraEnabled);
    } catch (err) {
      console.error("Failed to toggle camera:", err);
    }
  };

  return (
    <div className="flex items-center justify-center gap-1.5">
      <Button
        variant={isMicrophoneEnabled ? "default" : "outline"}
        size="sm"
        onClick={handleToggleMic}
        className={`h-8 w-8 p-0 ${
          isMicrophoneEnabled
            ? "bg-neutral-900 hover:bg-neutral-800"
            : "border-neutral-200 text-neutral-400"
        }`}
      >
        {isMicrophoneEnabled ? (
          <Mic className="h-3.5 w-3.5" />
        ) : (
          <MicOff className="h-3.5 w-3.5" />
        )}
      </Button>
      <Button
        variant={isCameraEnabled ? "default" : "outline"}
        size="sm"
        onClick={handleToggleCam}
        className={`h-8 w-8 p-0 ${
          isCameraEnabled
            ? "bg-neutral-900 hover:bg-neutral-800"
            : "border-neutral-200 text-neutral-400"
        }`}
      >
        {isCameraEnabled ? (
          <Video className="h-3.5 w-3.5" />
        ) : (
          <VideoOff className="h-3.5 w-3.5" />
        )}
      </Button>
      <div className="flex items-center gap-1 ml-2">
        <div
          className={`w-1.5 h-1.5 rounded-full ${
            connected ? "bg-neutral-900" : "bg-neutral-300"
          }`}
        />
        <span className="text-[11px] text-neutral-400">
          {connected ? "Connected" : "Connecting..."}
        </span>
      </div>
    </div>
  );
}
