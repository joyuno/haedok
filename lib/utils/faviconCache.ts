/**
 * In-memory favicon cache with deduplication.
 *
 * - Caches resolved (successful) favicon URLs per domain.
 * - Caches failed domains to prevent retries.
 * - Deduplicates concurrent requests for the same domain
 *   so that multiple BrandIcon instances sharing a domain
 *   only trigger a single probe sequence.
 */

type CacheEntry =
  | { status: 'resolved'; url: string }
  | { status: 'failed' };

const cache = new Map<string, CacheEntry>();

/**
 * In-flight probe promises keyed by domain.
 * While a probe is running for a domain, subsequent callers
 * receive the same promise instead of starting a new probe.
 */
const inflight = new Map<string, Promise<string | null>>();

/**
 * Probe a single image URL.
 * Resolves to `true` if the image loads successfully.
 *
 * Works in both browser (via Image()) and SSR (always fails gracefully).
 */
function probeUrl(url: string): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);

  return new Promise<boolean>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

/**
 * Try each candidate URL in order and return the first that loads.
 */
async function probeSequence(urls: string[]): Promise<string | null> {
  for (const url of urls) {
    const ok = await probeUrl(url);
    if (ok) return url;
  }
  return null;
}

/**
 * Look up or resolve the best favicon URL for `domain`.
 *
 * @param domain    e.g. "netflix.com"
 * @param urls      ordered candidate URLs (already built by getFaviconUrls)
 * @returns         the first working URL, or `null` if all fail
 */
export async function resolveFavicon(
  domain: string,
  urls: string[],
): Promise<string | null> {
  // 1. Cache hit
  const entry = cache.get(domain);
  if (entry) {
    return entry.status === 'resolved' ? entry.url : null;
  }

  // 2. Dedup: join existing in-flight probe
  const existing = inflight.get(domain);
  if (existing) return existing;

  // 3. Start new probe
  const promise = probeSequence(urls).then((result) => {
    if (result) {
      cache.set(domain, { status: 'resolved', url: result });
    } else {
      cache.set(domain, { status: 'failed' });
    }
    inflight.delete(domain);
    return result;
  });

  inflight.set(domain, promise);
  return promise;
}

/**
 * Synchronous cache lookup (no network).
 * Returns the cached URL, `'failed'` if the domain is known-bad,
 * or `undefined` if the domain hasn't been probed yet.
 */
export function getFaviconFromCache(
  domain: string,
): string | 'failed' | undefined {
  const entry = cache.get(domain);
  if (!entry) return undefined;
  return entry.status === 'resolved' ? entry.url : 'failed';
}

/** Clear entire cache (useful for testing). */
export function clearFaviconCache(): void {
  cache.clear();
  inflight.clear();
}
