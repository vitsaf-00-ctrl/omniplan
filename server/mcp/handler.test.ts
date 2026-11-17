import './tz';
import { readFileSync } from 'node:fs';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { beforeEach, describe, expect, it } from 'vitest';
import { formatToken, generateSecret, hashSecret, parseToken } from '../../src/lib/mcpToken';
import { DEFAULT_DATABASE_ID, parseServiceAccount } from './firestoreRepo';
import { handleMcp, type McpDeps } from './handler';
import { MemoryRepo } from './memoryRepo';
import { dataToTask, taskToData } from './serialize';

const UID = 'user123ABC';
const URL_BASE = 'https://omniplan.test/api/mcp';

let repo: MemoryRepo;
let deps: McpDeps;
let token: string;
let touched = 0;

beforeEach(async () => {
  repo = new MemoryRepo([{ id: 'dis', name: 'ДІС', color: 'blue' }]);
  const secret = generateSecret();
  token = formatToken(UID, secret);
  const hash = await hashSecret(secret);
  touched = 0;
  deps = {
    configured: true,
    now: () => new Date(2026, 10, 17, 10, 0),
    repoFor: uid => { expect(uid).toBe(UID); return repo; },
    tokens: {
      find: async (uid, h) => (uid === UID && h === hash ? {} : null),
      touch: async () => { touched++; },
    },
  };
});

function fetchVia(d: McpDeps) {
  return (input: string | URL | Request, init?: RequestInit) => handleMcp(new Request(input, init), d);
}

async function connect(url: string, headers: Record<string, string> = {}) {
  const client = new Client({ name: 'test', version: '1.0.0' });
  await client.connect(new StreamableHTTPClientTransport(new URL(url), { fetch: fetchVia(deps), requestInit: { headers } }));
  return client;
}

describe('tokens', () => {
  it('round-trips and rejects malformed tokens', () => {
    const s = generateSecret();
    expect(parseToken(formatToken('abcDEF123', s))).toEqual({ uid: 'abcDEF123', secret: s });
    expect(parseToken('omni.abc.short')).toBeNull();
    expect(parseToken('Bearer xyz')).toBeNull();
    expect(parseToken(undefined)).toBeNull();
  });
});

describe('HTTP endpoint', () => {
  it('GET returns status JSON (used by the Settings screen)', async () => {
    const res = await handleMcp(new Request(URL_BASE), deps);
    expect(await res.json()).toEqual({ name: 'OmniPlan MCP', ok: true, configured: true });
  });

  it('rejects missing or wrong tokens with 401', async () => {
    const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' });
    const headers = { 'content-type': 'application/json', accept: 'application/json, text/event-stream' };
    expect((await handleMcp(new Request(URL_BASE, { method: 'POST', body, headers }), deps)).status).toBe(401);
    const wrong = formatToken(UID, generateSecret());
    expect((await handleMcp(new Request(`${URL_BASE}?token=${wrong}`, { method: 'POST', body, headers }), deps)).status).toBe(401);
  });

  it('503 when the server has no Firebase credentials', async () => {
    const res = await handleMcp(new Request(URL_BASE, { method: 'POST', body: '{}' }), { ...deps, configured: false });
    expect(res.status).toBe(503);
  });
});

describe('MCP protocol end-to-end', () => {
  it('works with the token in the URL (Claude) and lists all tools', async () => {
    const client = await connect(`${URL_BASE}?token=${encodeURIComponent(token)}`);
    const { tools } = await client.listTools();
    expect(tools.map(t => t.name).sort()).toEqual([
      'complete_task', 'create_task', 'delete_task', 'get_agenda', 'get_task', 'list_projects',
      'list_tasks', 'reschedule_tasks', 'search_tasks', 'stop_recurring', 'update_task',
    ]);
    expect(tools.find(t => t.name === 'delete_task')!.annotations?.destructiveHint).toBe(true);
    expect(tools.find(t => t.name === 'get_agenda')!.annotations?.readOnlyHint).toBe(true);
    expect(client.getInstructions()).toMatch(/Europe\/Kyiv/);
    expect(touched).toBeGreaterThan(0);
    await client.close();
  });

  it('works with a Bearer header (ChatGPT "Token") and performs a create → complete flow', async () => {
    const client = await connect(URL_BASE, { Authorization: `Bearer ${token}` });
    const created = await client.callTool({
      name: 'create_task',
      arguments: { title: 'SMM stories', project: 'ДІС', date: '2026-11-17', recurring: 'daily' },
    });
    expect(created.isError).toBeFalsy();
    const id = (created.structuredContent as any).created.id as string;

    const done = await client.callTool({ name: 'complete_task', arguments: { task_id: id } });
    expect((done.structuredContent as any).next_occurrence.date).toBe('2026-11-18');

    const agenda = await client.callTool({ name: 'get_agenda', arguments: { days: 2 } });
    const days = (agenda.structuredContent as any).days;
    expect(days[0].done).toBe(1);
    expect(days[1].tasks[0].title).toBe('SMM stories');
    await client.close();
  });

  it('returns tool errors as isError results, not protocol failures', async () => {
    const client = await connect(URL_BASE, { Authorization: `Bearer ${token}` });
    const r = await client.callTool({ name: 'create_task', arguments: { title: 'x', project: 'Немає' } });
    expect(r.isError).toBe(true);
    expect((r.content as any)[0].text).toMatch(/Existing projects: ДІС/);
    await client.close();
  });
});

describe('server config', () => {
  it('database id matches firebase-applet-config.json', () => {
    const cfg = JSON.parse(readFileSync(new URL('../../firebase-applet-config.json', import.meta.url), 'utf8'));
    expect(DEFAULT_DATABASE_ID).toBe(cfg.firestoreDatabaseId);
  });

  it('parses service account JSON (raw or base64) and fixes escaped newlines', () => {
    const sa = { project_id: 'p', client_email: 'e@x', private_key: '-----BEGIN-----\\nabc\\n-----END-----' };
    const raw = JSON.stringify(sa);
    expect(parseServiceAccount(raw)!.privateKey).toBe('-----BEGIN-----\nabc\n-----END-----');
    expect(parseServiceAccount(Buffer.from(raw).toString('base64'))!.projectId).toBe('p');
    expect(parseServiceAccount('')).toBeNull();
    expect(parseServiceAccount('{"x":1}')).toBeNull();
  });

  it('serialization round-trips every task field', () => {
    const t = {
      id: 't1', title: 'A', project: 'ДІС', status: 'in_progress' as const, date: new Date(2026, 10, 17), someday: false,
      tagColor: 'blue' as const, notes: 'n', recurring: true, recurringType: 'weekly', recurringParentId: 'p',
      recurringNextId: 'n1', order: 3, notifyAtTime: true, googleCalendarSync: false,
      subtasks: [{ id: 's', title: 'S', done: true, date: new Date(2026, 10, 18) }],
      createdAt: new Date(2026, 10, 1), priority: 'high' as const, time: '09:00',
    };
    expect(dataToTask('t1', taskToData(t))).toEqual({ ...t, googleCalendarSync: undefined });
  });
});
