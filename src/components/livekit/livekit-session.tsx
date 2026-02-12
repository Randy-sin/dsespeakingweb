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
}: LiveKitSessionProps) {
  const { user } = useUser();
  const { t } = useI18n();
  const [token, setToken] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [expandedView, setExpandedView] = useState(false);
  const [hasManualResize, setHasManualResize] = useState(false);
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
  const hasAttemptedConnect = useRef(false);
  const [canAccessMediaDevices, setCanAccessMediaDevices] = useState(true);

  useEffect(() => {
    import("@livekit/components-react")
      .then((mod) => {
        setLkComponents({
          LiveKitRoom: mod.LiveKitRoom as unknown as React.ComponentType<Record<string, unknown>>,
          RoomAudioRenderer: mod.RoomAudioRenderer,
          VideoConference: mod.VideoConference,
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

  useEffect(() => {
    // Mobile-first AV UX: default to expanded so users can see everyone.
    if (isMobileViewport && !hasManualResize) {
      setExpandedView(true);
    }
  }, [isMobileViewport, hasManualResize]);

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

  useEffect(() => {
    if (isSpectator || isMarker) return;
    if (roomStatus === "preparing" && !preJoinApproved && !token) {
      setPreJoinOpen(true);
    }
  }, [isSpectator, isMarker, roomStatus, preJoinApproved, token]);

  // Auto-connect observers immediately.
  // Participants in active phases (discussing/individual/results/free_discussion)
  // should not be blocked by pre-join approval.
  useEffect(() => {
    if (
      (isSpectator || isMarker) &&
      !token &&
      !loading &&
      !hasAttemptedConnect.current
    ) {
      hasAttemptedConnect.current = true;
      fetchToken();
    } else if (
      !isSpectator &&
      !isMarker &&
      roomStatus === "preparing" &&
      preJoinApproved &&
      !token &&
      !hasAttemptedConnect.current
    ) {
      hasAttemptedConnect.current = true;
      fetchToken();
    } else if (
      !isSpectator &&
      !isMarker &&
      (roomStatus === "discussing" ||
        roomStatus === "individual" ||
        roomStatus === "results" ||
        roomStatus === "free_discussion") &&
      !token &&
      !hasAttemptedConnect.current
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

  // If observer connection dropped (or token fetch failed), auto-allow retry on status changes.
  useEffect(() => {
    if (!isSpectator && !isMarker) return;
    hasAttemptedConnect.current = false;
  }, [isSpectator, isMarker, roomStatus]);

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
    return (
      <div className="text-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-neutral-300 mx-auto mb-2" />
        <p className="text-[13px] text-neutral-400">
          {t("common.connecting", "Connecting...")}
        </p>
      </div>
    );
  }

  if (token && url && lkComponents) {
    const {
      LiveKitRoom: LKRoom,
      RoomAudioRenderer: AudioRenderer,
      VideoConference: VConf,
    } = lkComponents;

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
      <div className="space-y-3">
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

          {/* ── Video Container ── */}
          <div
            className={`bg-neutral-950 overflow-hidden relative ${
              expandedView
                ? isMobileViewport
                  ? "fixed inset-0 z-50"
                  : "fixed inset-3 z-50 rounded-2xl shadow-2xl ring-1 ring-white/10"
                : "rounded-xl"
            }`}
            style={
              expandedView
                ? undefined
                : {
                    height: isMobileViewport
                      ? isLandscape ? "55vh" : "35vh"
                      : "320px",
                  }
            }
          >
            {/* Video grid fills entire container */}
            <div className="absolute inset-0">
              <VConf />
            </div>

            {/* ── Top overlay: minimal, non-intrusive ── */}
            <div
              className="absolute left-0 right-0 z-20 flex items-center justify-between pointer-events-none"
              style={{
                top: expandedView && isMobileViewport
                  ? "max(8px, env(safe-area-inset-top))"
                  : "8px",
                paddingLeft: expandedView && isMobileViewport
                  ? "max(12px, env(safe-area-inset-left))"
                  : "10px",
                paddingRight: expandedView && isMobileViewport
                  ? "max(12px, env(safe-area-inset-right))"
                  : "10px",
              }}
            >
              {/* Connection pill */}
              <div className="flex items-center gap-1.5 rounded-full bg-black/40 backdrop-blur-md px-2.5 py-1 pointer-events-auto">
                <div className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-400" : "bg-neutral-400 animate-pulse"}`} />
                <span className="text-[10px] text-white/80 font-medium">
                  {connected ? "LIVE" : "..."}
                </span>
              </div>

              {/* Expand / Shrink button */}
              <button
                type="button"
                onClick={() => {
                  setHasManualResize(true);
                  setExpandedView((v) => !v);
                }}
                className="flex items-center gap-1.5 rounded-full bg-black/40 backdrop-blur-md px-3 py-1.5 text-white/90 hover:bg-black/60 transition-colors pointer-events-auto"
              >
                {expandedView ? (
                  <>
                    <Shrink className="h-3.5 w-3.5" />
                    <span className="text-[11px] font-medium hidden sm:inline">
                      {t("livekit.shrinkVideos", "Exit")}
                    </span>
                  </>
                ) : (
                  <>
                    <Expand className="h-3.5 w-3.5" />
                    <span className="text-[11px] font-medium hidden sm:inline">
                      {t("livekit.expandVideos", "Expand")}
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* ── Bottom floating control bar (only in expanded view) ── */}
            {expandedView && (
              <div
                className="absolute left-0 right-0 z-20"
                style={{
                  bottom: isMobileViewport
                    ? "max(12px, env(safe-area-inset-bottom))"
                    : "16px",
                  paddingLeft: isMobileViewport
                    ? "max(12px, env(safe-area-inset-left))"
                    : "16px",
                  paddingRight: isMobileViewport
                    ? "max(12px, env(safe-area-inset-right))"
                    : "16px",
                }}
              >
                <div className="mx-auto max-w-md rounded-2xl bg-black/50 backdrop-blur-xl border border-white/10 px-4 py-3 shadow-2xl">
                  {renderMediaControls(true)}
                </div>
              </div>
            )}
          </div>

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
