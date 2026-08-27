import { describe, expect, it } from "vitest";
import nextConfig from "../next.config";

describe("production security headers", () => {
  it("applies browser hardening to every route", async () => {
    const rules = await nextConfig.headers?.();
    const globalHeaders = rules?.find((rule) => rule.source === "/:path*")?.headers ?? [];
    const values = new Map(globalHeaders.map((header) => [header.key, header.value]));

    expect(values.get("Content-Security-Policy")).toContain("frame-ancestors 'none'");
    expect(values.get("Content-Security-Policy")).toContain("object-src 'none'");
    expect(values.get("Content-Security-Policy")).toContain("https://static.cloudflareinsights.com");
    expect(values.get("Content-Security-Policy")).toContain("https://cloudflareinsights.com");
    expect(values.get("X-Content-Type-Options")).toBe("nosniff");
    expect(values.get("X-Frame-Options")).toBe("DENY");
    expect(values.get("Permissions-Policy")).toContain("microphone=(self)");
  });

  it("prevents AI responses from being cached or indexed", async () => {
    const rules = await nextConfig.headers?.();
    const apiHeaders = rules?.find((rule) => rule.source === "/api/ai/:path*")?.headers ?? [];
    const values = new Map(apiHeaders.map((header) => [header.key, header.value]));

    expect(values.get("Cache-Control")).toContain("no-store");
    expect(values.get("X-Robots-Tag")).toContain("noindex");
  });
});
