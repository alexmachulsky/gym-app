/**
 * Parse JWT payload without verifying signature (client-side only).
 */
function parseJwtPayload(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

/**
 * Returns true if the token is expired or unparseable.
 */
export function isTokenExpired(token) {
  if (!token) return true;
  const payload = parseJwtPayload(token);
  if (!payload || !payload.exp) return true;
  // exp is in seconds; add a 10s buffer to avoid edge cases
  return Date.now() / 1000 > payload.exp - 10;
}
