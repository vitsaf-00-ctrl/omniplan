import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { hashSecret, parseToken } from '../../src/lib/mcpToken.js';
import { buildMcpServer } from './server.js';
import type { TaskRepo } from './types.js';

/** Looks up stored token metadata for users/{uid}.mcpTokens[hash]. */
export interface TokenStore {
  find(uid: string, hash: string): Promise<{ lastUsedAt?: Date } | null>;
  touch(uid: string, hash: string): Promise<void>;
}

export interface McpDeps {
  /** False when the server has no Firebase credentials yet. */
  configured: boolean;
  tokens: TokenStore;
  repoFor(uid: string): TaskRepo;
  now(): Date;
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, Accept, Mcp-Session-Id, Mcp-Protocol-Version, X-OmniPlan-Token',
  'Access-Control-Expose-Headers': 'Mcp-Session-Id',
};

function json(status: number, body: unknown, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...CORS, ...extra },
  });
}

export function extractToken(request: Request): string | null {
  const auth = request.headers.get('authorization');
  if (auth && /^bearer\s+/i.test(auth)) return auth.replace(/^bearer\s+/i, '').trim();
  const header = request.headers.get('x-omniplan-token');
  if (header) return header.trim();
  const url = new URL(request.url);
  return url.searchParams.get('token') || url.searchParams.get('key');
}

const TOUCH_EVERY_MS = 10 * 60 * 1000;

export async function authenticate(request: Request, deps: McpDeps): Promise<string | null> {
  const parsed = parseToken(extractToken(request));
  if (!parsed) return null;
  const hash = await hashSecret(parsed.secret);
  const meta = await deps.tokens.find(parsed.uid, hash);
  if (!meta) return null;
  if (!meta.lastUsedAt || deps.now().getTime() - meta.lastUsedAt.getTime() > TOUCH_EVERY_MS) {
    deps.tokens.touch(parsed.uid, hash).catch(e => console.error('[mcp] touch failed', e));
  }
  return parsed.uid;
}

export async function handleMcp(request: Request, deps: McpDeps): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

  if (request.method === 'GET') {
    // Stateless server: no server-initiated SSE stream.
    if ((request.headers.get('accept') ?? '').includes('text/event-stream')) {
      return json(405, { error: 'Method not allowed' }, { Allow: 'POST' });
    }
    return json(200, { name: 'OmniPlan MCP', ok: true, configured: deps.configured });
  }

  if (request.method !== 'POST') return json(405, { error: 'Method not allowed' }, { Allow: 'POST' });

  if (!deps.configured) {
    return json(503, { error: 'OmniPlan MCP server is not configured: FIREBASE_SERVICE_ACCOUNT is missing on Vercel.' });
  }

  let uid: string | null;
  try {
    uid = await authenticate(request, deps);
  } catch (e) {
    console.error('[mcp] auth error', e);
    const keyProblem = /private key|PEM|credential|DECODER|service account/i.test(String(e));
    return json(500, {
      error: keyProblem
        ? 'FIREBASE_SERVICE_ACCOUNT on Vercel looks invalid — paste the whole service-account JSON file again.'
        : 'Authentication check failed',
    });
  }
  if (!uid) {
    return json(401, { error: 'Invalid or missing OmniPlan token. Create one in OmniPlan → Налаштування → Інтеграції.' });
  }

  const server = buildMcpServer({ repo: deps.repoFor(uid), now: deps.now });
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  try {
    await server.connect(transport);
    const res = await transport.handleRequest(request);
    const headers = new Headers(res.headers);
    for (const [k, v] of Object.entries(CORS)) headers.set(k, v);
    headers.set('Cache-Control', 'no-store');
    const body = await res.text();
    return new Response(body || null, { status: res.status, headers });
  } finally {
    await server.close().catch(() => {});
  }
}
