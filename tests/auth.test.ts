import { describe, it, expect, afterEach } from "vitest";
import type { NextRequest } from "next/server";
import { authorized } from "../lib/auth";

// minimal NextRequest stand-in - authorized() only reads headers
function req(host: string, auth?: string): NextRequest {
  const headers = new Map<string, string>();
  headers.set("host", host);
  if (auth) headers.set("authorization", auth);
  return { headers: { get: (k: string) => headers.get(k.toLowerCase()) ?? null } } as NextRequest;
}

const ENV = process.env.BRIEFLY_TOKEN;
afterEach(() => {
  if (ENV === undefined) delete process.env.BRIEFLY_TOKEN;
  else process.env.BRIEFLY_TOKEN = ENV;
});

describe("authorized - no token configured (local/LAN only)", () => {
  it("allows localhost and LAN hosts", () => {
    delete process.env.BRIEFLY_TOKEN;
    expect(authorized(req("localhost:9877"))).toBe(true);
    expect(authorized(req("127.0.0.1"))).toBe(true);
    expect(authorized(req("192.168.1.20:9877"))).toBe(true);
    expect(authorized(req("10.0.0.218"))).toBe(true);
    expect(authorized(req("mac.local"))).toBe(true);
  });

  it("denies remote hosts", () => {
    delete process.env.BRIEFLY_TOKEN;
    expect(authorized(req("briefly-bheng.vercel.app"))).toBe(false);
    expect(authorized(req("8.8.8.8"))).toBe(false);
  });
});

describe("authorized - token configured", () => {
  it("requires the exact bearer token, even from localhost", () => {
    process.env.BRIEFLY_TOKEN = "s3cret";
    expect(authorized(req("localhost", "Bearer s3cret"))).toBe(true);
    expect(authorized(req("briefly-bheng.vercel.app", "Bearer s3cret"))).toBe(true);
    // wrong or missing token -> denied regardless of host
    expect(authorized(req("localhost", "Bearer nope"))).toBe(false);
    expect(authorized(req("localhost"))).toBe(false);
  });
});
