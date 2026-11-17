// Personal access tokens for the OmniPlan MCP server (AI assistants).
// Shared by the web app (creates tokens) and the server (verifies them), so it
// uses only Web Crypto — available in browsers and Node 18+.
//
// Format: omni.<firebase uid>.<secret>
// Only SHA-256(secret) is stored, in users/{uid}.mcpTokens[<hash>]; the token
// itself is shown once on creation and never saved.

export const TOKEN_PREFIX = 'omni';
const TOKEN_RE = /^omni\.([A-Za-z0-9_-]{1,128})\.([A-Za-z0-9_-]{32,128})$/;

export interface ParsedToken { uid: string; secret: string }

/** Metadata stored per token in users/{uid}.mcpTokens[hash]. */
export interface McpTokenMeta {
  label: string;
  createdAt: unknown;      // Firestore Timestamp
  lastUsedAt?: unknown;    // Firestore Timestamp, set by the server (throttled)
  hint?: string;           // first chars of the secret, for recognising a token
}

function base64url(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function generateSecret(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64url(bytes);
}

export function formatToken(uid: string, secret: string): string {
  return `${TOKEN_PREFIX}.${uid}.${secret}`;
}

export function parseToken(token: string | null | undefined): ParsedToken | null {
  const m = TOKEN_RE.exec((token ?? '').trim());
  return m ? { uid: m[1], secret: m[2] } : null;
}

export async function hashSecret(secret: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}
