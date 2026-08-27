import { ImageResponse } from "next/og";

export const alt = "DSE Speaking — HKDSE English Paper 4 教學與練習";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "stretch",
          background: "#f3efe4",
          color: "#172019",
          display: "flex",
          height: "100%",
          padding: "54px",
          width: "100%",
        }}
      >
        <div
          style={{
            border: "2px solid #172019",
            display: "flex",
            flex: 1,
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "48px 54px",
          }}
        >
          <div style={{ alignItems: "center", display: "flex", fontSize: 24, letterSpacing: 2 }}>
            <div
              style={{
                alignItems: "center",
                background: "#172019",
                color: "#faf7ef",
                display: "flex",
                height: 48,
                justifyContent: "center",
                marginRight: 18,
                width: 48,
              }}
            >
              P4
            </div>
            DSE SPEAKING
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 76, fontWeight: 700, letterSpacing: -4, lineHeight: 1 }}>
              Learn what to say.
            </div>
            <div style={{ color: "#ad3f29", fontSize: 76, fontStyle: "italic", lineHeight: 1.05 }}>
              Say it better.
            </div>
          </div>
          <div style={{ alignItems: "center", display: "flex", fontSize: 24, justifyContent: "space-between" }}>
            <span>HKDSE English Paper 4</span>
            <span style={{ color: "#48634c" }}>方法 · 真題 · AI 回饋</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
