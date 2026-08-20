import type { NextRequest } from "next/server";

// POST /api/books is allowed from localhost/LAN without a token (the owner runs
// it locally to add a book). From anywhere else a bearer token is required.
// If BRIEFLY_TOKEN is unset, only local/private-network callers are allowed.
export function authorized(req: NextRequest): boolean {
  const token = process.env.BRIEFLY_TOKEN;
  const auth = req.headers.get("authorization") || "";
  if (token && auth === `Bearer ${token}`) return true;

  const host = (req.headers.get("host") || "").split(":")[0];
  const isLocal =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.endsWith(".local") ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host);

  // With no token configured, allow only local/LAN. With a token configured,
  // remote callers must present it (handled above).
  return token ? false : isLocal;
}
