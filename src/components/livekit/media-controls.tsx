"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  useLocalParticipant,
  useRoomContext,
} from "@livekit/components-react";
import { RoomEvent } from "livekit-client";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, Eye } from "lucide-react";
import type { RoomStatus } from "@/lib/supabase/types";

interface MediaControlsProps {
  roomStatus: RoomStatus;
  currentSpeakerUserId?: string;
  isSpectator: boolean;
  userId?: string;
  connected: boolean;
  /** Whether we're waiting for all mics before starting discussion */
  waitingForMics?: boolean;
  /** Number of expected participants (non-spectator) */
  expectedParticipantCount?: number;
  /** Called when all participants have their mic enabled */
  onAllMicsReady?: () => void;
}

/**
 * This component MUST be rendered INSIDE a <LiveKitRoom> context.
 * It uses LiveKit hooks to directly control and monitor audio/video tracks.
 */
export function MediaControls({
  roomStatus,
  currentSpeakerUserId,
  isSpectator,
  userId,
  connected,
  waitingForMics = false,
  expectedParticipantCount = 0,
  onAllMicsReady,
}: MediaControlsProps) {
  const room = useRoomContext();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } =
    useLocalParticipant();
  const prevRoomStatus = useRef<RoomStatus | null>(null);
  const hasAutoEnabled = useRef(false);
  const hasCalledAllMicsReady = useRef(false);
  const [micReadyCount, setMicReadyCount] = useState(0);

  // Auto-toggle audio/video based on room phase changes
  useEffect(() => {
    if (isSpectator || !connected) return;

    if (roomStatus === prevRoomStatus.current) return;
    prevRoomStatus.current = roomStatus;

    if (roomStatus === "discussing" && !hasAutoEnabled.current) {
      hasAutoEnabled.current = true;
      // Prompt user to enable mic — auto-enable after short delay
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

  // Check all participants' mic status using LiveKit room events
  const checkAllMics = useCallback(() => {
    if (!waitingForMics || isSpectator || !connected) return;

    const localMicOn = localParticipant.isMicrophoneEnabled;

    // Filter remote participants: exclude spectators (prefixed with [观众])
    const remoteNonSpectators = Array.from(
      room.remoteParticipants.values()
    ).filter((p) => !p.name?.includes("[观众]"));

    const remoteMicsOn = remoteNonSpectators.filter(
      (p) => p.isMicrophoneEnabled
    ).length;

    const totalReady = (localMicOn ? 1 : 0) + remoteMicsOn;
    setMicReadyCount(totalReady);

    const expectedRemote = Math.max(0, expectedParticipantCount - 1);
    const allReady =
      localMicOn &&
      remoteNonSpectators.length >= expectedRemote &&
      remoteNonSpectators
        .slice(0, expectedRemote)
        .every((p) => p.isMicrophoneEnabled);

    if (allReady && !hasCalledAllMicsReady.current && onAllMicsReady) {
      hasCalledAllMicsReady.current = true;
      onAllMicsReady();
    }
  }, [
    waitingForMics,
    isSpectator,
    connected,
    localParticipant,
    room,
    expectedParticipantCount,
    onAllMicsReady,
  ]);

  // Subscribe to room events for remote mic changes
  useEffect(() => {
    if (!waitingForMics || isSpectator || !connected) return;

    // Check immediately
    checkAllMics();

    const events = [
      RoomEvent.TrackPublished,
      RoomEvent.TrackUnpublished,
      RoomEvent.TrackMuted,
      RoomEvent.TrackUnmuted,
      RoomEvent.LocalTrackPublished,
      RoomEvent.LocalTrackUnpublished,
      RoomEvent.ParticipantConnected,
      RoomEvent.ParticipantDisconnected,
    ];

    events.forEach((e) => room.on(e, checkAllMics));
    return () => {
      events.forEach((e) => room.off(e, checkAllMics));
    };
  }, [waitingForMics, isSpectator, connected, room, checkAllMics]);

  // Also re-check when local mic state changes (from the reactive hook)
  useEffect(() => {
    checkAllMics();
  }, [isMicrophoneEnabled, checkAllMics]);

  // Reset when waitingForMics changes
  useEffect(() => {
    if (!waitingForMics) {
      hasCalledAllMicsReady.current = false;
    }
  }, [waitingForMics]);

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
    <div className="space-y-2">
      {/* Mic waiting status */}
      {waitingForMics && (
        <div className="text-center py-1">
          <p className="text-[12px] text-amber-600 font-medium">
            等待开启麦克风 {micReadyCount}/{expectedParticipantCount}
          </p>
        </div>
      )}

      <div className="flex items-center justify-center gap-1.5">
        <Button
          variant={isMicrophoneEnabled ? "default" : "outline"}
          size="sm"
          onClick={handleToggleMic}
          className={`h-8 w-8 p-0 transition-all ${
            isMicrophoneEnabled
              ? "bg-neutral-900 hover:bg-neutral-800"
              : waitingForMics
                ? "border-amber-300 text-amber-500 animate-pulse"
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
    </div>
  );
}
