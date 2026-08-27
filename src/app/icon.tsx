import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#172019",
          color: "#faf7ef",
          display: "flex",
          fontSize: 25,
          fontWeight: 700,
          height: "100%",
          justifyContent: "center",
          letterSpacing: -1,
          width: "100%",
        }}
      >
        P4
      </div>
    ),
    size,
  );
}
