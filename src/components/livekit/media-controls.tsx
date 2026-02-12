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
  canAccessMediaDevices?: boolean;
  /** Whether we're waiting for all mics before starting discussion */
  waitingForMics?: boolean;
  /** Number of expected participants (non-spectator) */
  expectedParticipantCount?: number;
  /** Called when all participants have their mic enabled */
  onAllMicsReady?: () => void;
  /** Compact mode for floating overlay bar (dark bg) */
  compact?: boolean;
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
  canAccessMediaDevices = true,
  waitingForMics = false,
  expectedParticipantCount = 0,
  onAllMicsReady,
  compact = false,
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

    if (!canAccessMediaDevices) {
      localParticipant.setMicrophoneEnabled(false);
      localParticipant.setCameraEnabled(false);
      return;
    }

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
    canAccessMediaDevices,
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
    if (compact) {
      return (
        <div className="flex items-center justify-center gap-3">
          <Eye className="h-4 w-4 text-white/50" />
          <span className="text-[11px] text-white/70 font-medium">
            {t("livekit.watchMode", "View-only mode")}
          </span>
          <div className="flex items-center gap-1.5 ml-1">
            <div className={`h-1.5 w-1.5 rounded-full ${networkDotClass}`} />
            <span className="text-[10px] text-white/50">{networkLabel}</span>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center gap-3 py-1">
        <Eye className="h-3.5 w-3.5 text-neutral-400" />
        <span className="text-[12px] text-neutral-500 font-medium">
          {t("livekit.watchMode", "View-only mode")}
        </span>
        <div className="h-3 w-px bg-neutral-200" />
        <div className="flex items-center gap-1.5">
          <div className={`h-1.5 w-1.5 rounded-full ${networkDotClass}`} />
          <span className="text-[11px] text-neutral-400">{networkLabel}</span>
        </div>
      </div>
    );
  }

  const handleToggleMic = async () => {
    if (!canAccessMediaDevices) return;
    if (isSpectator) return;
    try {
      await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
    } catch (err) {
      console.error("Failed to toggle mic:", err);
    }
  };

  const handleToggleCam = async () => {
    if (!canAccessMediaDevices) return;
    try {
      await localParticipant.setCameraEnabled(!isCameraEnabled);
    } catch (err) {
      console.error("Failed to toggle camera:", err);
    }
  };

  // ── Compact mode: single-row layout for floating overlay bar ──
  if (compact) {
    return (
      <div className="flex items-center justify-center gap-2">
        {waitingForMics && (
          <span className="text-[11px] text-amber-400 font-medium mr-1">
            {micReadyCount}/{expectedParticipantCount}
          </span>
        )}

        {/* Mic button */}
        <button
          type="button"
          onClick={handleToggleMic}
          disabled={
            !canAccessMediaDevices ||
            (isMarker && roomStatus === "discussing") ||
            (isSpectator && roomStatus !== "free_discussion")
          }
          className={`relative h-10 w-10 rounded-full flex items-center justify-center transition-all ${
            isMicrophoneEnabled
              ? "bg-white/20 text-white hover:bg-white/30"
              : "bg-red-500/80 text-white hover:bg-red-500/90"
          } ${waitingForMics && !isMicrophoneEnabled ? "ring-2 ring-amber-400/60 animate-pulse" : ""} disabled:opacity-30 disabled:cursor-not-allowed`}
        >
          {isMicrophoneEnabled ? (
            <Mic className="h-4 w-4" />
          ) : (
            <MicOff className="h-4 w-4" />
          )}
        </button>

        {/* Camera button */}
        <button
          type="button"
          onClick={handleToggleCam}
          disabled={isMarker || isSpectator || !canAccessMediaDevices}
          className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${
            isCameraEnabled
              ? "bg-white/20 text-white hover:bg-white/30"
              : "bg-red-500/80 text-white hover:bg-red-500/90"
          } disabled:opacity-30 disabled:cursor-not-allowed`}
        >
          {isCameraEnabled ? (
            <Video className="h-4 w-4" />
          ) : (
            <VideoOff className="h-4 w-4" />
          )}
        </button>

        {/* Divider */}
        <div className="h-5 w-px bg-white/15 mx-0.5" />

        {/* Network quality */}
        <div className="flex items-center gap-1.5">
          <div className={`h-1.5 w-1.5 rounded-full ${networkDotClass}`} />
          <span className="text-[10px] text-white/50 hidden sm:inline">{networkLabel}</span>
        </div>

        {isMarker && (
          <>
            <div className="h-5 w-px bg-white/15 mx-0.5" />
            <span className="text-[10px] text-white/40">Marker</span>
          </>
        )}
      </div>
    );
  }

  // ── Normal mode: below video controls ──
  return (
    <div className="space-y-2.5">
      {waitingForMics && (
        <div className="text-center">
          <p className="text-[12px] text-amber-600 font-medium">
            {t("livekit.micWaiting", "Waiting for microphones")}{" "}
            <span className="tabular-nums">{micReadyCount}/{expectedParticipantCount}</span>
          </p>
        </div>
      )}

      <div className="flex items-center justify-center gap-2">
        {/* Mic */}
        <button
          type="button"
          onClick={handleToggleMic}
          disabled={
            !canAccessMediaDevices ||
            (isMarker && roomStatus === "discussing") ||
            (isSpectator && roomStatus !== "free_discussion")
          }
          className={`h-10 w-10 rounded-full flex items-center justify-center transition-all border ${
            isMicrophoneEnabled
              ? "bg-neutral-900 border-neutral-900 text-white hover:bg-neutral-800"
              : "bg-white border-neutral-200 text-neutral-400 hover:border-neutral-300"
          } ${waitingForMics && !isMicrophoneEnabled ? "ring-2 ring-amber-300 animate-pulse" : ""} disabled:opacity-30 disabled:cursor-not-allowed`}
        >
          {isMicrophoneEnabled ? (
            <Mic className="h-4 w-4" />
          ) : (
            <MicOff className="h-4 w-4" />
          )}
        </button>

        {/* Camera */}
        <button
          type="button"
          onClick={handleToggleCam}
          disabled={isMarker || isSpectator || !canAccessMediaDevices}
          className={`h-10 w-10 rounded-full flex items-center justify-center transition-all border ${
            isCameraEnabled
              ? "bg-neutral-900 border-neutral-900 text-white hover:bg-neutral-800"
              : "bg-white border-neutral-200 text-neutral-400 hover:border-neutral-300"
          } disabled:opacity-30 disabled:cursor-not-allowed`}
        >
          {isCameraEnabled ? (
            <Video className="h-4 w-4" />
          ) : (
            <VideoOff className="h-4 w-4" />
          )}
        </button>

        {/* Status pill */}
        <div className="flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1.5 ml-1">
          <div className={`h-1.5 w-1.5 rounded-full ${connected ? networkDotClass : "bg-neutral-300 animate-pulse"}`} />
          <span className="text-[11px] text-neutral-500 font-medium">
            {connected ? networkLabel : t("common.connecting", "Connecting...")}
          </span>
        </div>
      </div>

      {!canAccessMediaDevices && (
        <p className="text-center text-[11px] text-amber-600">
          {t(
            "livekit.secureContextShort",
            "Mic/camera unavailable on insecure HTTP. Use HTTPS or localhost."
          )}
        </p>
      )}
      {isMarker && (
        <p className="text-center text-[10px] text-neutral-400">
          {t("livekit.markerHint", "Marker: camera disabled, microphone available")}
        </p>
      )}
    </div>
  );
}
