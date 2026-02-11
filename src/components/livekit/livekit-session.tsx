"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Loader2,
  Wifi,
  WifiOff,
  AlertCircle,
} from "lucide-react";
import type { RoomStatus } from "@/lib/supabase/types";

interface LiveKitSessionProps {
  roomId: string;
  roomStatus: RoomStatus;
  currentSpeakerUserId?: string;
}

export function LiveKitSession({
  roomId,
  roomStatus,
  currentSpeakerUserId,
}: LiveKitSessionProps) {
  const { user } = useUser();
  const [token, setToken] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [lkComponents, setLkComponents] = useState<{
    LiveKitRoom: React.ComponentType<Record<string, unknown>>;
    RoomAudioRenderer: React.ComponentType;
    VideoConference: React.ComponentType;
  } | null>(null);
  const hasAttemptedConnect = useRef(false);

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
  }, []);

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
          setError("LiveKit 尚未配置");
        } else {
          throw new Error(data.error || "Failed to get token");
        }
        return;
      }

      const data = await res.json();
      setToken(data.token);
      setUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "连接失败");
    } finally {
      setLoading(false);
    }
  }, [user, roomId]);

  useEffect(() => {
    if (
      (roomStatus === "discussing" || roomStatus === "individual") &&
      !token &&
      !hasAttemptedConnect.current
    ) {
      hasAttemptedConnect.current = true;
      fetchToken();
    }
  }, [roomStatus, token, fetchToken]);

  useEffect(() => {
    if (roomStatus === "preparing") {
      setAudioEnabled(false);
      setVideoEnabled(false);
    } else if (roomStatus === "discussing") {
      setAudioEnabled(true);
      setVideoEnabled(true);
    } else if (roomStatus === "individual") {
      const isSpeaker = user?.id === currentSpeakerUserId;
      setAudioEnabled(isSpeaker);
      setVideoEnabled(true);
    }
  }, [roomStatus, currentSpeakerUserId, user?.id]);

  if (roomStatus === "preparing") {
    return (
      <div className="text-center py-6">
        <MicOff className="h-5 w-5 text-neutral-300 mx-auto mb-2" />
        <p className="text-[13px] text-neutral-500 mb-1">准备阶段</p>
        <p className="text-[12px] text-neutral-400">讨论开始后自动开启</p>
        <Button
          variant="ghost"
          size="sm"
          className="mt-3 text-[12px] text-neutral-400 hover:text-neutral-900"
          onClick={fetchToken}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
          ) : (
            <Wifi className="h-3.5 w-3.5 mr-1" />
          )}
          预连接
        </Button>
      </div>
    );
  }

  if (roomStatus === "finished") {
    return (
      <div className="text-center py-6">
        <WifiOff className="h-5 w-5 text-neutral-300 mx-auto mb-2" />
        <p className="text-[13px] text-neutral-400">已断开</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-6">
        <AlertCircle className="h-5 w-5 text-neutral-400 mx-auto mb-2" />
        <p className="text-[13px] text-neutral-500 mb-1">未连接</p>
        <p className="text-[12px] text-neutral-400 mb-3 px-2">{error}</p>
        <p className="text-[11px] text-neutral-300 mb-3">
          可以正常练习，音视频需要配置 LiveKit 后使用
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
          重试
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-neutral-300 mx-auto mb-2" />
        <p className="text-[13px] text-neutral-400">连接中...</p>
      </div>
    );
  }

  // Audio optimisation: noise suppression + echo cancellation + auto gain
  const roomOptions = useMemo(
    () => ({
      audioCaptureDefaults: {
        autoGainControl: true,
        echoCancellation: true,
        noiseSuppression: true,
        // Constrain sample rate for speech clarity
        sampleRate: 48000,
        channelCount: 1,
      },
      videoCaptureDefaults: {
        resolution: { width: 640, height: 480, frameRate: 24 },
      },
      publishDefaults: {
        // Use higher audio bitrate for clearer voice
        audioBitrate: 32_000,
        dtx: true,            // discontinuous transmission — save bandwidth when silent
        red: true,            // redundant encoding — recover from packet loss
      },
      adaptiveStream: true,
      dynacast: true,
    }),
    []
  );

  if (token && url && lkComponents) {
    const {
      LiveKitRoom: LKRoom,
      RoomAudioRenderer: AudioRenderer,
      VideoConference: VConf,
    } = lkComponents;

    return (
      <div className="space-y-3">
        <LKRoom
          serverUrl={url}
          token={token}
          connect={true}
          audio={audioEnabled}
          video={videoEnabled}
          options={roomOptions}
          onConnected={() => setConnected(true)}
          onDisconnected={() => setConnected(false)}
          style={{ height: "auto" }}
        >
          <div className="space-y-3">
            <AudioRenderer />
            <div className="bg-neutral-950 rounded-lg overflow-hidden aspect-video relative">
              <VConf />
            </div>
          </div>
        </LKRoom>
        <div className="flex items-center justify-center gap-1.5">
          <Button
            variant={audioEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`h-8 w-8 p-0 ${
              audioEnabled
                ? "bg-neutral-900 hover:bg-neutral-800"
                : "border-neutral-200 text-neutral-400"
            }`}
          >
            {audioEnabled ? (
              <Mic className="h-3.5 w-3.5" />
            ) : (
              <MicOff className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            variant={videoEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => setVideoEnabled(!videoEnabled)}
            className={`h-8 w-8 p-0 ${
              videoEnabled
                ? "bg-neutral-900 hover:bg-neutral-800"
                : "border-neutral-200 text-neutral-400"
            }`}
          >
            {videoEnabled ? (
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

  return (
    <div className="text-center py-6">
      <Wifi className="h-5 w-5 text-neutral-300 mx-auto mb-2" />
      <p className="text-[13px] text-neutral-400 mb-2">等待连接</p>
      <Button
        variant="ghost"
        size="sm"
        className="text-[12px] text-neutral-400 hover:text-neutral-900"
        onClick={fetchToken}
      >
        连接
      </Button>
    </div>
  );
}
