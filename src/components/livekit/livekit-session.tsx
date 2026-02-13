"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useUser } from "@/hooks/use-user";
import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  Wifi,
  WifiOff,
  AlertCircle,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Expand,
  Shrink,
} from "lucide-react";
import type { RoomStatus } from "@/lib/supabase/types";

interface LiveKitSessionProps {
  roomId: string;
  roomStatus: RoomStatus;
  currentSpeakerUserId?: string;
  isSpectator?: boolean;
  isMarker?: boolean;
  /** Whether we're waiting for all mics before starting discussion timer */
  waitingForMics?: boolean;
  /** Number of expected participants (non-spectator) */
  expectedParticipantCount?: number;
  /** Called when all participants have their mic enabled */
  onAllMicsReady?: () => void;
  /** Larger inline viewport for discussion shell */
  layoutMode?: "default" | "immersive";
}

export function LiveKitSession({
  roomId,
  roomStatus,
  currentSpeakerUserId,
  isSpectator = false,
  isMarker = false,
  waitingForMics = false,
  expectedParticipantCount = 0,
  onAllMicsReady,
  layoutMode = "default",
}: LiveKitSessionProps) {
  const { user } = useUser();
  const { t } = useI18n();
  const [token, setToken] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [expandedView, setExpandedView] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [preJoinOpen, setPreJoinOpen] = useState(false);
  const [preJoinApproved, setPreJoinApproved] = useState(false);
  const [preJoinMicOn, setPreJoinMicOn] = useState(true);
  const [preJoinCamOn, setPreJoinCamOn] = useState(true);
  const [lkComponents, setLkComponents] = useState<{
    LiveKitRoom: React.ComponentType<Record<string, unknown>>;
    RoomAudioRenderer: React.ComponentType;
    VideoConference: React.ComponentType;
  } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [MediaControlsComp, setMediaControlsComp] = useState<React.ComponentType<any> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [DiscussionGridComp, setDiscussionGridComp] = useState<React.ComponentType<any> | null>(null);
  const hasAttemptedConnect = useRef(false);
  const [canAccessMediaDevices, setCanAccessMediaDevices] = useState(true);

  useEffect(() => {
    import("@livekit/components-react")
      .then((mod) => {
        setLkComponents({
          LiveKitRoom: mod.LiveKitRoom as unknown as React.ComponentType<Record<string, unknown>>,
          RoomAudioRenderer: mod.RoomAudioRenderer,
          VideoConference: mod.VideoConference as unknown as React.ComponentType,
        });
      })
      .catch(() => {});
    import("@livekit/components-styles").catch(() => {});

    // Dynamically import MediaControls (which uses LiveKit hooks)
    import("./media-controls")
      .then((mod) => {
        setMediaControlsComp(() => mod.MediaControls);
      })
      .catch(() => {});

    // Dynamically import DiscussionGrid
    import("./discussion-grid")
      .then((mod) => {
        setDiscussionGridComp(() => mod.DiscussionGrid);
      })
      .catch(() => {});

  }, []);

  useEffect(() => {
    // getUserMedia requires secure context in most browsers.
    const checkSecureContext = () => {
      if (typeof window === "undefined") return;
      const host = window.location.hostname;
      const isLocalhost =
        host === "localhost" || host === "127.0.0.1" || host === "::1";
      setCanAccessMediaDevices(window.isSecureContext || isLocalhost);
    };
    checkSecureContext();
  }, []);

  useEffect(() => {
    const updateViewport = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setIsMobileViewport(w < 1024);
      setIsLandscape(w > h);
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);
    window.addEventListener("orientationchange", updateViewport);
    return () => {
      window.removeEventListener("resize", updateViewport);
      window.removeEventListener("orientationchange", updateViewport);
    };
  }, []);

  // Removed: Mobile auto-expand was hiding the question content.
  // Users should see the paper/questions first, then manually expand video if needed.

  const fetchToken = useCallback(async () => {
    if (!user || !roomId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/livekit/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.error === "LiveKit not configured") {
          setError(t("livekit.livekitNotConfigured", "LiveKit is not configured"));
        } else {
          throw new Error(data.error || "Failed to get token");
        }
        return;
      }

      const data = await res.json();
      setToken(data.token);
      setUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("livekit.connectFailed", "Connection failed"));
    } finally {
      setLoading(false);
    }
  }, [user, roomId, t]);

  // Show pre-join dialog for participants (not observer) in preparing phase
  useEffect(() => {
    if (isSpectator || isMarker) return;
    if (roomStatus === "preparing" && !preJoinApproved && !token) {
      setPreJoinOpen(true);
    }
  }, [isSpectator, isMarker, roomStatus, preJoinApproved, token]);

  // Track previous role to detect changes
  const prevIsMarkerRef = useRef(isMarker);
  const prevIsSpectatorRef = useRef(isSpectator);
  const prevRoomStatusRef = useRef(roomStatus);

  // Unified auto-connect logic.
  // IMPORTANT: role detection (isMarker/isSpectator) may arrive AFTER initial
  // mount because allMembers loads asynchronously. We must handle role changes.
  useEffect(() => {
    const roleChanged =
      prevIsMarkerRef.current !== isMarker ||
      prevIsSpectatorRef.current !== isSpectator;
    const statusChanged = prevRoomStatusRef.current !== roomStatus;

    prevIsMarkerRef.current = isMarker;
    prevIsSpectatorRef.current = isSpectator;
    prevRoomStatusRef.current = roomStatus;

    // Reset attempt flag when role or status changes so we can retry
    if (roleChanged || statusChanged) {
      hasAttemptedConnect.current = false;
    }

    // Don't proceed if already connected or in-flight
    if (token || loading || hasAttemptedConnect.current) return;

    // Observer (marker/spectator): always auto-connect immediately
    if (isSpectator || isMarker) {
      hasAttemptedConnect.current = true;
      fetchToken();
      return;
    }

    // Participant in preparing phase: needs pre-join approval
    if (roomStatus === "preparing" && preJoinApproved) {
      hasAttemptedConnect.current = true;
      fetchToken();
      return;
    }

    // Participant in active phases: auto-connect without pre-join
    if (
      roomStatus === "discussing" ||
      roomStatus === "individual" ||
      roomStatus === "results" ||
      roomStatus === "free_discussion"
    ) {
      hasAttemptedConnect.current = true;
      fetchToken();
    }
  }, [
    roomStatus,
    token,
    loading,
    fetchToken,
    isSpectator,
    isMarker,
    preJoinApproved,
  ]);

  // IMPORTANT: useMemo must be BEFORE all conditional returns to satisfy React hooks rules
  const roomOptions = useMemo(
    () => ({
      audioCaptureDefaults: {
        autoGainControl: true,
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 48000,
        channelCount: 1,
      },
      videoCaptureDefaults: {
        resolution: { width: 640, height: 480, frameRate: 24 },
      },
      publishDefaults: {
        audioBitrate: 32_000,
        dtx: true,
        red: true,
      },
      adaptiveStream: true,
      dynacast: true,
    }),
    []
  );

  if (roomStatus === "finished") {
    return (
      <div className="text-center py-6">
        <WifiOff className="h-5 w-5 text-neutral-300 mx-auto mb-2" />
        <p className="text-[13px] text-neutral-400">
          {t("livekit.disconnect", "Disconnected")}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-6">
        <AlertCircle className="h-5 w-5 text-neutral-400 mx-auto mb-2" />
        <p className="text-[13px] text-neutral-500 mb-1">
          {t("livekit.notConnected", "Not connected")}
        </p>
        <p className="text-[12px] text-neutral-400 mb-3 px-2">{error}</p>
        <p className="text-[11px] text-neutral-300 mb-3">
          {isSpectator
            ? t("livekit.observerHint", "You can watch after LiveKit is configured")
            : t(
                "livekit.spectatorHint",
                "You can still practice without AV until LiveKit is configured"
              )}
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="text-[12px] text-neutral-400 hover:text-neutral-900"
          onClick={() => {
            hasAttemptedConnect.current = false;
            fetchToken();
          }}
          disabled={loading}
        >
          {t("common.retry", "Retry")}
        </Button>
      </div>
    );
  }

  if (loading) {
    const loadingHeight = layoutMode === "immersive" ? "100%" : "320px";
    return (
      <div className="bg-neutral-950 rounded-xl overflow-hidden p-3" style={{ height: loadingHeight }}>
        {/* Video skeleton grid */}
        <div className="grid grid-cols-2 gap-2 h-full">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-neutral-800 rounded-lg animate-pulse relative overflow-hidden"
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-neutral-700/50 to-transparent" />
              {/* Avatar placeholder */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-neutral-700" />
              </div>
              {/* Name tag placeholder */}
              <div className="absolute bottom-2 left-2 flex items-center gap-2">
                <div className="h-4 w-16 rounded bg-neutral-700" />
              </div>
            </div>
          ))}
        </div>
        {/* Connecting text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/60 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-white/80" />
            <span className="text-[13px] text-white/80">
              {t("common.connecting", "Connecting...")}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (token && url && lkComponents) {
    const inlineHeight = isMobileViewport
      ? isLandscape
        ? "55vh"
        : "35vh"
      : layoutMode === "immersive"
        ? "100%"
        : "320px";

    const {
      LiveKitRoom: LKRoom,
      RoomAudioRenderer: AudioRenderer,
      VideoConference: VConf,
    } = lkComponents;

    const isObserver = isSpectator || isMarker;

    const renderMediaControls = (isCompact: boolean) =>
      MediaControlsComp ? (
        <MediaControlsComp
          roomStatus={roomStatus}
          currentSpeakerUserId={currentSpeakerUserId}
          isSpectator={isSpectator}
          isMarker={isMarker}
          userId={user?.id}
          connected={connected}
          canAccessMediaDevices={canAccessMediaDevices}
          waitingForMics={waitingForMics}
          expectedParticipantCount={expectedParticipantCount}
          onAllMicsReady={onAllMicsReady}
          compact={isCompact}
        />
      ) : (
        <div className="flex items-center justify-center gap-1">
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              connected ? "bg-emerald-400" : "bg-neutral-300 animate-pulse"
            }`}
          />
          <span className={`text-[11px] ${isCompact ? "text-white/60" : "text-neutral-400"}`}>
            {connected
              ? t("common.connected", "Connected")
              : t("common.connecting", "Connecting...")}
          </span>
        </div>
      );

    return (
      <div>
        <LKRoom
          serverUrl={url}
          token={token}
          connect={true}
          audio={
            isSpectator
              ? false
              : isMarker
                ? false
                : canAccessMediaDevices
                  ? preJoinMicOn
                  : false
          }
          video={
            isSpectator || isMarker
              ? false
              : canAccessMediaDevices
                ? preJoinCamOn
                : false
          }
          options={roomOptions}
          onConnected={() => setConnected(true)}
          onDisconnected={() => setConnected(false)}
          style={{ height: "auto" }}
        >
          <AudioRenderer />

          {/* ── Expanded (fullscreen) overlay ── */}
          {expandedView && (
            <div
              className={
                isMobileViewport
                  ? "fixed inset-0 z-50 bg-neutral-950 flex flex-col"
                  : "fixed inset-3 z-50 bg-neutral-950 rounded-2xl shadow-2xl ring-1 ring-white/10 flex flex-col overflow-hidden"
              }
              style={{ height: isMobileViewport ? "100dvh" : undefined }}
            >
              {/* Top bar */}
              <div
                className="flex items-center justify-between shrink-0 px-3 z-10"
                style={{
                  paddingTop: isMobileViewport
                    ? "max(8px, env(safe-area-inset-top))"
                    : "10px",
                }}
              >
                <div className="flex items-center gap-1.5 rounded-full bg-black/40 backdrop-blur-md px-2.5 py-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-400" : "bg-neutral-400 animate-pulse"}`} />
                  <span className="text-[10px] text-white/80 font-medium">
                    {connected ? "LIVE" : "..."}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setExpandedView(false);
                  }}
                  className="flex items-center gap-1.5 rounded-full bg-black/40 backdrop-blur-md px-3 py-1.5 text-white/90 hover:bg-black/60 transition-colors"
                >
                  <Shrink className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-medium hidden sm:inline">
                    {t("livekit.shrinkVideos", "Exit")}
                  </span>
                </button>
              </div>

              {/* Video grid — takes all remaining space */}
              <div className="flex-1 min-h-0">
                {DiscussionGridComp ? <DiscussionGridComp isObserver={isObserver} /> : <VConf />}
              </div>

              {/* Bottom floating control bar */}
              <div
                className="shrink-0 px-4 pb-3 pt-2 z-10"
                style={{
                  paddingBottom: isMobileViewport
                    ? "max(12px, env(safe-area-inset-bottom))"
                    : "16px",
                }}
              >
                <div className="mx-auto max-w-md rounded-2xl bg-black/50 backdrop-blur-xl border border-white/10 px-4 py-3">
                  {renderMediaControls(true)}
                </div>
              </div>
            </div>
          )}

          {/* ── Inline (non-expanded) video ── */}
          {!expandedView && (
            <div
              className="bg-neutral-950 rounded-xl overflow-hidden relative"
              style={{ height: inlineHeight }}
            >
              {/* Top bar overlay */}
              <div className="absolute top-2 left-2.5 right-2.5 z-10 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-1.5 rounded-full bg-black/40 backdrop-blur-md px-2.5 py-1 pointer-events-auto">
                  <div className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-400" : "bg-neutral-400 animate-pulse"}`} />
                  <span className="text-[10px] text-white/80 font-medium">
                    {connected ? "LIVE" : "..."}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setExpandedView(true);
                  }}
                  className="flex items-center gap-1.5 rounded-full bg-black/40 backdrop-blur-md px-3 py-1.5 text-white/90 hover:bg-black/60 transition-colors pointer-events-auto"
                >
                  <Expand className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-medium hidden sm:inline">
                    {t("livekit.expandVideos", "Expand")}
                  </span>
                </button>
              </div>

              {/* Video grid */}
              <div className="h-full w-full">
                {DiscussionGridComp ? <DiscussionGridComp isObserver={isObserver} /> : <VConf />}
              </div>
            </div>
          )}

          {/* ── Controls below video (non-expanded only) ── */}
          {!expandedView && (
            <div className="mt-3">
              {renderMediaControls(false)}
            </div>
          )}
        </LKRoom>
      </div>
    );
  }

  return (
    <>
      <div className="text-center py-6">
        <Wifi className="h-5 w-5 text-neutral-300 mx-auto mb-2" />
        <p className="text-[13px] text-neutral-400 mb-1">
          {roomStatus === "preparing" && !isSpectator && !isMarker
            ? t("livekit.preparingTitle", "Preparation phase")
            : isSpectator
            ? t("livekit.connectWatch", "Connect to watch")
            : t("livekit.waitConnect", "Waiting to connect")}
        </p>
        {!isSpectator && !isMarker && roomStatus === "preparing" && (
          <p className="text-[12px] text-neutral-400 mb-3">
            {t(
              "livekit.preparingHint",
              "Set your microphone and camera before discussion starts"
            )}
          </p>
        )}
        {!canAccessMediaDevices && !isSpectator && (
          <p className="text-[12px] text-amber-600 mb-3 px-2">
            {t(
              "livekit.secureContextHint",
              "Microphone/camera require HTTPS or localhost. Open this site via https://... or http://localhost:3000."
            )}
          </p>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="text-[12px] text-neutral-400 hover:text-neutral-900"
          onClick={() => {
            if (!isSpectator && !isMarker && roomStatus === "preparing") {
              setPreJoinOpen(true);
              return;
            }
            fetchToken();
          }}
        >
          {t("livekit.connect", "Connect")}
        </Button>
      </div>

      <Dialog open={preJoinOpen} onOpenChange={setPreJoinOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("livekit.prejoinTitle", "Ready to join meeting")}</DialogTitle>
            <DialogDescription>
              {t(
                "livekit.prejoinDesc",
                "Choose whether to turn on microphone and camera, like Tencent Meeting pre-join setup."
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setPreJoinMicOn((v) => !v)}
              className="w-full flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-50"
            >
              <span className="flex items-center gap-2">
                {preJoinMicOn ? (
                  <Mic className="h-4 w-4 text-neutral-700" />
                ) : (
                  <MicOff className="h-4 w-4 text-neutral-400" />
                )}
                {t("livekit.microphone", "Microphone")}
              </span>
              <span className="text-xs text-neutral-400">
                {preJoinMicOn ? "ON" : "OFF"}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setPreJoinCamOn((v) => !v)}
              className="w-full flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-50"
            >
              <span className="flex items-center gap-2">
                {preJoinCamOn ? (
                  <Video className="h-4 w-4 text-neutral-700" />
                ) : (
                  <VideoOff className="h-4 w-4 text-neutral-400" />
                )}
                {t("livekit.camera", "Camera")}
              </span>
              <span className="text-xs text-neutral-400">
                {preJoinCamOn ? "ON" : "OFF"}
              </span>
            </button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreJoinOpen(false)}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              onClick={() => {
                setPreJoinApproved(true);
                setPreJoinOpen(false);
                hasAttemptedConnect.current = false;
                fetchToken();
              }}
            >
              {t("livekit.previewJoin", "Join with selected settings")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
