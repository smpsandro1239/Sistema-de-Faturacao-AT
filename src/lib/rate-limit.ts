// Simple in-memory rate limiter
const rates = new Map<string, { count: number; lastReset: number }>();

/**
 * Checks if a request should be rate limited
 * @param identifier Unique identifier for the client (e.g., IP or user email)
 * @param limit Max number of requests allowed in the window
 * @param windowMs Time window in milliseconds
 * @returns boolean indicating if the request is allowed
 */
export function rateLimit(identifier: string, limit: number, windowMs: number): boolean {
  maybeCleanup();
  const now = Date.now();
  const current = rates.get(identifier);

  if (!current || now - current.lastReset > windowMs) {
    rates.set(identifier, { count: 1, lastReset: now });
    return true;
  }

  if (current.count >= limit) {
    return false;
  }

  current.count += 1;
  return true;
}

/**
 * Clean up old entries from the rate limit map
 */
export function cleanupRateLimits() {
  const now = Date.now();
  for (const [key, value] of rates.entries()) {
    if (now - value.lastReset > 60 * 60 * 1000) { // 1 hour
      rates.delete(key);
    }
  }
}

/**
 * Lazy cleanup triggered occasionally
 */
let lastCleanup = Date.now();
function maybeCleanup() {
  const now = Date.now();
  if (now - lastCleanup > 3600000) { // 1 hour
    cleanupRateLimits();
    lastCleanup = now;
  }
}

// Note: In production serverless environments, this in-memory map
// will not be shared across instances. Use Redis for a robust solution.
