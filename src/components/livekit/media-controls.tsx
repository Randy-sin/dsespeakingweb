"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  useLocalParticipant,
  useRoomContext,
} from "@livekit/components-react";
import { ConnectionQuality, RoomEvent } from "livekit-client";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/providers/i18n-provider";
import { Mic, MicOff, Video, VideoOff, Eye } from "lucide-react";
import type { RoomStatus } from "@/lib/supabase/types";

interface MediaControlsProps {
  roomStatus: RoomStatus;
  currentSpeakerUserId?: string;
  isSpectator: boolean;
  isMarker?: boolean;
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
  isMarker = false,
  userId,
  connected,
  waitingForMics = false,
  expectedParticipantCount = 0,
  onAllMicsReady,
}: MediaControlsProps) {
  const { t } = useI18n();
  const room = useRoomContext();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } =
    useLocalParticipant();
  const prevRoomStatus = useRef<RoomStatus | null>(null);
  const hasAutoEnabled = useRef(false);
  const hasCalledAllMicsReady = useRef(false);
  const [micReadyCount, setMicReadyCount] = useState(0);

  const localNetworkQuality = localParticipant.connectionQuality ?? ConnectionQuality.Unknown;
  const networkLabel =
    localNetworkQuality === ConnectionQuality.Excellent
      ? t("livekit.networkExcellent", "Network: excellent")
      : localNetworkQuality === ConnectionQuality.Good
        ? t("livekit.networkGood", "Network: good")
        : localNetworkQuality === ConnectionQuality.Poor
          ? t("livekit.networkPoor", "Network: weak")
          : t("livekit.networkUnknown", "Network: checking");
  const networkDotClass =
    localNetworkQuality === ConnectionQuality.Excellent
      ? "bg-emerald-500"
      : localNetworkQuality === ConnectionQuality.Good
        ? "bg-amber-500"
        : localNetworkQuality === ConnectionQuality.Poor
          ? "bg-rose-500"
          : "bg-neutral-300";

  // Auto-toggle audio/video based on room phase changes
  useEffect(() => {
    if (!connected) return;

    if (roomStatus === prevRoomStatus.current) return;
    prevRoomStatus.current = roomStatus;

    if (isSpectator) {
      localParticipant.setMicrophoneEnabled(false);
      localParticipant.setCameraEnabled(false);
      return;
    }

    if (isMarker) {
      if (roomStatus === "preparing" && !hasAutoEnabled.current) {
        hasAutoEnabled.current = true;
        // Keep marker camera off, but allow microphone control.
        localParticipant.setMicrophoneEnabled(false);
      }
      localParticipant.setCameraEnabled(false);
      return;
    }

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
    } else if (roomStatus === "results") {
      localParticipant.setMicrophoneEnabled(false);
      localParticipant.setCameraEnabled(true);
    } else if (roomStatus === "free_discussion") {
      localParticipant.setMicrophoneEnabled(true);
      localParticipant.setCameraEnabled(true);
    }
  }, [
    roomStatus,
    currentSpeakerUserId,
    userId,
    isSpectator,
    isMarker,
    localParticipant,
    connected,
  ]);

  // Check all participants' mic status using LiveKit room events
  const checkAllMics = useCallback(() => {
    if (!waitingForMics || isSpectator || !connected) return;

    const localMicOn = localParticipant.isMicrophoneEnabled;

    // Filter remote participants: exclude observers (prefixed with [觀眾] or [Marker])
    const remoteNonSpectators = Array.from(
      room.remoteParticipants.values()
    ).filter(
      (p) => !p.name?.includes("[觀眾]") && !p.name?.includes("[Marker]")
    );

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
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Eye className="h-3.5 w-3.5 text-neutral-400" />
          <span className="text-[11px] text-neutral-500">
            {t("livekit.watchMode", "View-only mode")}
          </span>
          <div className="h-1 w-1 rounded-full bg-neutral-300" />
          <span className="text-[11px] text-neutral-400">
            {connected ? t("common.connected", "Connected") : t("common.connecting", "Connecting...")}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1.5 text-center text-[11px] text-neutral-500">
            {t("livekit.micLocked", "Mic locked")}
          </div>
          <div className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1.5 text-center text-[11px] text-neutral-500">
            {t("livekit.cameraLocked", "Camera locked")}
          </div>
        </div>
        <div className="flex items-center justify-center gap-1.5">
          <div className={`h-1.5 w-1.5 rounded-full ${networkDotClass}`} />
          <span className="text-[11px] text-neutral-400">{networkLabel}</span>
        </div>
      </div>
    );
  }

  const handleToggleMic = async () => {
    if (isSpectator) return;
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
            {t("livekit.micWaiting", "Waiting for microphones")}{" "}
            {micReadyCount}/{expectedParticipantCount}
          </p>
        </div>
      )}

      <div className="flex items-center justify-center gap-1.5">
        <Button
          variant={isMicrophoneEnabled ? "default" : "outline"}
          size="sm"
          onClick={handleToggleMic}
          disabled={
            (isMarker && roomStatus === "discussing") ||
            (isSpectator && roomStatus !== "free_discussion")
          }
          className={`h-10 w-10 p-0 transition-all ${
            isMicrophoneEnabled
              ? "bg-neutral-900 hover:bg-neutral-800 shadow-sm"
              : isMarker && roomStatus === "discussing"
                ? "border-neutral-200 text-neutral-300"
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
          disabled={isMarker || isSpectator}
          className={`h-10 w-10 p-0 ${
            isCameraEnabled
              ? "bg-neutral-900 hover:bg-neutral-800 shadow-sm"
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
            className={`w-1.5 h-1.5 rounded-full ${connected ? networkDotClass : "bg-neutral-300"}`}
          />
          <span className="text-[11px] text-neutral-400">
            {connected ? networkLabel : t("common.connecting", "Connecting...")}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div
          className={`rounded-md border px-2 py-1.5 text-center ${
            isMicrophoneEnabled
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-neutral-200 bg-neutral-50 text-neutral-500"
          }`}
        >
          {isMicrophoneEnabled ? t("livekit.micOn", "Mic on") : t("livekit.micOff", "Mic off")}
        </div>
        <div
          className={`rounded-md border px-2 py-1.5 text-center ${
            isCameraEnabled
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-neutral-200 bg-neutral-50 text-neutral-500"
          }`}
        >
          {isCameraEnabled ? t("livekit.camOn", "Camera on") : t("livekit.camOff", "Camera off")}
        </div>
      </div>
      {isMarker && (
        <p className="text-center text-[11px] text-neutral-400">
          Marker camera is disabled. Microphone is available.
        </p>
      )}
    </div>
  );
}
