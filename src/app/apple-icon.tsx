import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#172019",
          color: "#faf7ef",
          display: "flex",
          fontSize: 68,
          fontWeight: 700,
          height: "100%",
          justifyContent: "center",
          letterSpacing: -3,
          width: "100%",
        }}
      >
        P4
      </div>
    ),
    size,
  );
}
