"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Volume2, VolumeX, Play, Pause, Maximize2 } from "lucide-react";

export function PromoVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  // Sync play state with actual video element
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlay = () => { setPlaying(true); setHasStarted(true); };
    const onPause = () => setPlaying(false);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
    };
  }, []);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }, []);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play(); else v.pause();
  }, []);

  const handleFirstPlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = false;
    setMuted(false);
    v.play();
  }, []);

  const openFullscreen = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;

    // Try native fullscreen API on the video element directly
    if (v.requestFullscreen) {
      v.requestFullscreen();
    } else if ((v as unknown as { webkitEnterFullscreen?: () => void }).webkitEnterFullscreen) {
      // iOS Safari — only works on video element directly
      (v as unknown as { webkitEnterFullscreen: () => void }).webkitEnterFullscreen();
    } else if ((v as unknown as { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen) {
      (v as unknown as { webkitRequestFullscreen: () => void }).webkitRequestFullscreen();
    }
  }, []);

  const handleInteraction = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 2500);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative group rounded-2xl overflow-hidden bg-neutral-100 shadow-2xl shadow-neutral-900/10 ring-1 ring-neutral-200/50"
      onMouseEnter={handleInteraction}
      onMouseMove={handleInteraction}
      onMouseLeave={() => setShowControls(false)}
      onTouchStart={handleInteraction}
    >
      {/* 16:9 landscape */}
      <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
        <video
          ref={videoRef}
          src="/promo.mp4"
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Play overlay — shown before first play */}
        {!hasStarted && (
          <button
            type="button"
            onClick={handleFirstPlay}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 backdrop-blur-[2px] transition-all hover:bg-black/40 cursor-pointer z-10"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/90 shadow-xl flex items-center justify-center transition-transform hover:scale-105">
              <Play className="h-7 w-7 sm:h-8 sm:w-8 text-neutral-900 ml-1" />
            </div>
            <span className="mt-3 text-[13px] text-white/80 font-medium">觀看介紹影片</span>
          </button>
        )}

        {/* Bottom gradient for controls */}
        {hasStarted && (
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
        )}

        {/* Controls — shown on hover/touch after first play */}
        {hasStarted && (
          <div
            className={`absolute inset-x-0 bottom-0 flex items-center justify-between p-3 transition-opacity duration-300 ${
              showControls ? "opacity-100" : "opacity-0 sm:group-hover:opacity-100"
            }`}
          >
            <div className="flex items-center gap-2">
              {/* Play/Pause */}
              <button
                type="button"
                onClick={togglePlay}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors"
                aria-label={playing ? "Pause" : "Play"}
              >
                {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
              </button>

              {/* Mute/Unmute */}
              <button
                type="button"
                onClick={toggleMute}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors"
                aria-label={muted ? "Unmute" : "Mute"}
              >
                {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              </button>
            </div>

            {/* Fullscreen */}
            <button
              type="button"
              onClick={openFullscreen}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors"
              aria-label="Fullscreen"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
