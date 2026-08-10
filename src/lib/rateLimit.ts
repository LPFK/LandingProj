// In-memory, per-IP rate limiter for the waitlist endpoint. A single Passenger
// worker serves this landing page, so an in-process map is sufficient and
// avoids adding external infrastructure (Redis/Upstash) on shared hosting. If
// the app is ever scaled to multiple workers, swap this for a shared store.

type Bucket = { count: number; resetAt: number };

const DEFAULT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const DEFAULT_MAX = 5;
const MAX_TRACKED_KEYS = 10_000;

const buckets = new Map<string, Bucket>();

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSec: number };

function sweep(now: number): void {
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) buckets.delete(key);
  }
}

export function rateLimit(
  key: string,
  opts?: { windowMs?: number; max?: number },
): RateLimitResult {
  const windowMs = opts?.windowMs ?? DEFAULT_WINDOW_MS;
  const max = opts?.max ?? DEFAULT_MAX;
  const now = Date.now();

  // Opportunistic cleanup so the map cannot grow without bound under abuse.
  if (buckets.size > MAX_TRACKED_KEYS) sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (bucket.count >= max) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }

  bucket.count += 1;
  return { ok: true };
}

// Behind O2switch's Apache/Passenger the socket peer is the proxy, so the real
// client address arrives in a forwarded header. Fall back to Astro's
// clientAddress for direct connections (e.g. local dev).
export function getClientIp(request: Request, clientAddress?: string): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return clientAddress || "unknown";
}
