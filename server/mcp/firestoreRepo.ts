import { cert, getApps, initializeApp, type ServiceAccount } from 'firebase-admin/app';
import { FieldValue, getFirestore, Timestamp, type Firestore, type QuerySnapshot } from 'firebase-admin/firestore';
import type { McpDeps, TokenStore } from './handler.js';
import { dataToTask, taskToData } from './serialize.js';
import type { ProjectRecord, Task, TaskRepo } from './types.js';

/** Must equal firestoreDatabaseId in firebase-applet-config.json (checked by a test). */
export const DEFAULT_DATABASE_ID = 'ai-studio-846c7243-98bd-497d-8607-abdd25f234ad';

const COLORS = new Set(['blue', 'indigo', 'purple', 'emerald', 'amber', 'rose', 'slate']);

/** Accepts the service-account JSON as-is or base64-encoded. */
export function parseServiceAccount(raw: string | undefined): ServiceAccount | null {
  if (!raw || !raw.trim()) return null;
  let text = raw.trim();
  if (!text.startsWith('{')) {
    try { text = Buffer.from(text, 'base64').toString('utf8'); } catch { return null; }
  }
  try {
    const sa = JSON.parse(text) as Record<string, string>;
    if (!sa.project_id || !sa.client_email || !sa.private_key) return null;
    return {
      projectId: sa.project_id,
      clientEmail: sa.client_email,
      privateKey: sa.private_key.replace(/\\n/g, '\n'),
    };
  } catch {
    return null;
  }
}

let db: Firestore | null = null;
function getDb(sa: ServiceAccount): Firestore {
  if (db) return db;
  const app = getApps()[0] ?? initializeApp({ credential: cert(sa) });
  db = getFirestore(app, process.env.FIRESTORE_DATABASE_ID || DEFAULT_DATABASE_ID);
  return db;
}

class FirestoreTaskRepo implements TaskRepo {
  constructor(private db: Firestore, private uid: string) {}
  private col() { return this.db.collection('users').doc(this.uid).collection('tasks'); }
  private map(snap: QuerySnapshot): Task[] {
    return snap.docs.map(d => dataToTask(d.id, d.data()));
  }
  async get(id: string) {
    const d = await this.col().doc(id).get();
    return d.exists ? dataToTask(d.id, d.data()!) : null;
  }
  async listBetween(start: Date, end: Date) {
    return this.map(await this.col()
      .where('date', '>=', Timestamp.fromDate(start))
      .where('date', '<', Timestamp.fromDate(end)).get());
  }
  async listByParent(parentId: string) {
    return this.map(await this.col().where('recurringParentId', '==', parentId).get());
  }
  async listAll() { return this.map(await this.col().get()); }
  async put(task: Task) { await this.col().doc(task.id).set(taskToData(task)); }
  async remove(id: string) { await this.col().doc(id).delete(); }
  async listProjects(): Promise<ProjectRecord[]> {
    const snap = await this.db.collection('users').doc(this.uid).collection('projects').get();
    return snap.docs
      .map(d => ({ data: d.data(), id: d.id }))
      .sort((a, b) => (a.data.createdAt?.toMillis?.() ?? 0) - (b.data.createdAt?.toMillis?.() ?? 0))
      .map(({ id, data }) => ({
        id,
        name: String(data.name ?? id),
        color: (COLORS.has(data.color) ? data.color : 'slate') as ProjectRecord['color'],
      }));
  }
}

class FirestoreTokenStore implements TokenStore {
  constructor(private db: Firestore) {}
  async find(uid: string, hash: string) {
    const snap = await this.db.collection('users').doc(uid).get();
    const meta = snap.exists ? (snap.get('mcpTokens') as Record<string, Record<string, unknown>> | undefined)?.[hash] : undefined;
    if (!meta) return null;
    const last = meta.lastUsedAt as { toDate?: () => Date } | undefined;
    return { lastUsedAt: last?.toDate?.() };
  }
  async touch(uid: string, hash: string) {
    await this.db.collection('users').doc(uid).update({ [`mcpTokens.${hash}.lastUsedAt`]: FieldValue.serverTimestamp() });
  }
}

export function firestoreDeps(env: NodeJS.ProcessEnv = process.env): McpDeps {
  const sa = parseServiceAccount(env.FIREBASE_SERVICE_ACCOUNT);
  // Lazy: a malformed key must not crash the module (the status GET still works).
  const db = () => {
    if (!sa) throw new Error('FIREBASE_SERVICE_ACCOUNT is not set');
    return getDb(sa);
  };
  return {
    configured: !!sa,
    now: () => new Date(),
    tokens: {
      find: (uid, hash) => new FirestoreTokenStore(db()).find(uid, hash),
      touch: (uid, hash) => new FirestoreTokenStore(db()).touch(uid, hash),
    },
    repoFor: uid => new FirestoreTaskRepo(db(), uid),
  };
}
