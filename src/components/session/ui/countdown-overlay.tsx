"use client";

interface CountdownOverlayProps {
  countdownNumber: number | null;
  partBCountdownNumber: number | null;
}

export function CountdownOverlay({
  countdownNumber,
  partBCountdownNumber,
}: CountdownOverlayProps) {
  return (
    <>
      {countdownNumber !== null && countdownNumber > 0 && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <div
              key={countdownNumber}
              className="text-white text-[140px] font-bold leading-none animate-bounce"
              style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
            >
              {countdownNumber}
            </div>
            <p className="text-white/60 text-[16px] mt-6 tracking-wide">
              Discussion starts in...
            </p>
          </div>
        </div>
      )}

      {partBCountdownNumber !== null && partBCountdownNumber > 0 && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <div
              key={`partb-${partBCountdownNumber}`}
              className="text-white text-[140px] font-bold leading-none animate-bounce"
              style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
            >
              {partBCountdownNumber}
            </div>
            <p className="text-white/70 text-[15px] mt-5 tracking-wide">
              Part B starts in...
            </p>
          </div>
        </div>
      )}
    </>
  );
}
