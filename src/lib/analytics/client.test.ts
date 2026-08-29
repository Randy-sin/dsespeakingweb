import { afterEach, describe, expect, it, vi } from "vitest";

type MutableStorage = Pick<Storage, "getItem"> & { value: string | null };

function createStorage(): MutableStorage {
  return {
    value: null,
    getItem() {
      return this.value;
    },
  };
}

function deferredResponse() {
  let resolve!: (response: Response) => void;
  const promise = new Promise<Response>((next) => {
    resolve = next;
  });
  return { promise, resolve };
}

async function loadClient(storage: MutableStorage) {
  vi.resetModules();
  vi.stubGlobal("window", { localStorage: storage });
  vi.stubGlobal("navigator", { doNotTrack: "0" });
  vi.stubGlobal("crypto", {
    randomUUID: vi.fn(() => "019d0000-0000-7000-8000-000000000001"),
  });
  return import("./client");
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("product analytics delivery", () => {
  it("sends events serially so the first response can establish the session", async () => {
    const storage = createStorage();
    const firstResponse = deferredResponse();
    const methods: string[] = [];
    const fetchMock = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      methods.push(init?.method ?? "GET");
      if (methods.length === 1) return firstResponse.promise;
      return Promise.resolve(new Response(null, { status: 202 }));
    });
    vi.stubGlobal("fetch", fetchMock);
    const { trackProductEvent } = await loadClient(storage);

    trackProductEvent({ name: "site_session_started", surface: "home" });
    trackProductEvent({ name: "primary_cta_clicked", surface: "home" });

    await vi.waitFor(() => expect(methods).toEqual(["POST"]));
    firstResponse.resolve(new Response(null, { status: 202 }));
    await vi.waitFor(() => expect(methods).toEqual(["POST", "POST"]));
  });

  it("rechecks privacy immediately before sending a queued event", async () => {
    const storage = createStorage();
    const firstResponse = deferredResponse();
    const methods: string[] = [];
    const fetchMock = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      methods.push(init?.method ?? "GET");
      if (methods.length === 1) return firstResponse.promise;
      return Promise.resolve(new Response(null, { status: 202 }));
    });
    vi.stubGlobal("fetch", fetchMock);
    const { trackProductEvent } = await loadClient(storage);

    trackProductEvent({ name: "site_session_started", surface: "home" });
    trackProductEvent({ name: "practice_started", surface: "practice" });
    await vi.waitFor(() => expect(methods).toEqual(["POST"]));

    storage.value = "1";
    firstResponse.resolve(new Response(null, { status: 202 }));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(methods).toEqual(["POST"]);
  });

  it("places opt-out after an in-flight POST and cancels queued POSTs", async () => {
    const storage = createStorage();
    const firstResponse = deferredResponse();
    const methods: string[] = [];
    const fetchMock = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      methods.push(method);
      if (methods.length === 1) return firstResponse.promise;
      return Promise.resolve(new Response(null, { status: method === "DELETE" ? 204 : 202 }));
    });
    vi.stubGlobal("fetch", fetchMock);
    const { disableProductAnalyticsSession, trackProductEvent } = await loadClient(storage);

    trackProductEvent({ name: "site_session_started", surface: "home" });
    trackProductEvent({ name: "practice_started", surface: "practice" });
    await vi.waitFor(() => expect(methods).toEqual(["POST"]));

    storage.value = "1";
    const disablePromise = disableProductAnalyticsSession();
    await Promise.resolve();
    expect(methods).toEqual(["POST"]);

    firstResponse.resolve(new Response(null, { status: 202 }));
    await expect(disablePromise).resolves.toBe(true);
    expect(methods).toEqual(["POST", "DELETE"]);

    trackProductEvent({ name: "primary_cta_clicked", surface: "home" });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(methods).toEqual(["POST", "DELETE"]);
  });
});
