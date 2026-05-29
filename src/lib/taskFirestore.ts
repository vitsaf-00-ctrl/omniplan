import { db } from './firebase';
import {
  collection, doc, setDoc, deleteDoc, onSnapshot,
  query, orderBy, where, Timestamp, getDocs, writeBatch,
} from 'firebase/firestore';
import type { Task, TagColor } from '../store/useTaskStore';

// ─── Serialization ───────────────────────────────────────────────────────────

function taskToDoc(task: Task): Record<string, unknown> {
  return {
    title: task.title,
    project: task.project,
    status: task.status,
    date: Timestamp.fromDate(new Date(task.date)),
    someday: task.someday ?? false,
    tagColor: task.tagColor,
    notes: task.notes ?? '',
    recurring: task.recurring ?? false,
    recurringType: (task as any).recurringType || null,
    recurringParentId: (task as any).recurringParentId || null,
    order: task.order ?? null,
    notifyAtTime: task.notifyAtTime ?? false,
    googleCalendarSync: task.googleCalendarSync ?? false,
    subtasks: (task.subtasks ?? []).map(st => ({
      id: st.id,
      title: st.title,
      done: st.done,
      date: st.date ? Timestamp.fromDate(new Date(st.date)) : null,
    })),
    createdAt: Timestamp.fromDate(new Date(task.createdAt)),
    priority: task.priority ?? null,
    time: task.time ?? '',
  };
}

const VALID_STATUSES = new Set<Task['status']>(['todo', 'in_progress', 'done']);
const VALID_COLORS = new Set<Task['tagColor']>(['blue', 'indigo', 'purple', 'emerald', 'amber', 'rose', 'slate']);
const VALID_PRIORITIES = new Set<NonNullable<Task['priority']>>(['high', 'medium', 'low']);

function docToTask(id: string, raw: Record<string, unknown>): Task {
  const toDate = (v: unknown): Date => {
    const d = v instanceof Timestamp ? v.toDate() : v ? new Date(v as string) : new Date();
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const rawStatus = raw.status as string;
  const rawColor = raw.tagColor as string;
  const rawPriority = raw.priority as string;

  return {
    id,
    title: String(raw.title ?? ''),
    project: String(raw.project ?? ''),
    status: VALID_STATUSES.has(rawStatus as Task['status']) ? rawStatus as Task['status'] : 'todo',
    date: toDate(raw.date),
    someday: Boolean(raw.someday),
    tagColor: VALID_COLORS.has(rawColor as Task['tagColor']) ? rawColor as Task['tagColor'] : 'slate',
    notes: (raw.notes as string) || undefined,
    recurring: (raw.recurring as boolean) || undefined,
    recurringType: (raw.recurringType as string) || undefined,
    recurringParentId: (raw.recurringParentId as string) || undefined,
    order: typeof raw.order === 'number' ? raw.order : undefined,
    notifyAtTime: (raw.notifyAtTime as boolean) || undefined,
    googleCalendarSync: (raw.googleCalendarSync as boolean) || undefined,
    subtasks: ((raw.subtasks as unknown[]) ?? []).map((st: unknown) => {
      const s = st as Record<string, unknown>;
      return {
        id: String(s.id),
        title: String(s.title),
        done: Boolean(s.done),
        date: s.date ? toDate(s.date) : undefined,
      };
    }),
    createdAt: toDate(raw.createdAt),
    priority: VALID_PRIORITIES.has(rawPriority as NonNullable<Task['priority']>) ? rawPriority as Task['priority'] : undefined,
    time: (raw.time as string) || undefined,
  };
}

// ─── Task CRUD ────────────────────────────────────────────────────────────────

export function subscribeToUserTasks(
  uid: string,
  onUpdate: (tasks: Task[]) => void,
  onError?: (e: Error) => void,
): () => void {
  const q = query(
    collection(db, 'users', uid, 'tasks'),
    orderBy('createdAt', 'asc'),
  );
  return onSnapshot(
    q,
    snapshot => onUpdate(snapshot.docs.map(d => docToTask(d.id, d.data() as Record<string, unknown>))),
    err => { console.error('[Firestore]', err); onError?.(err); },
  );
}

export async function fsSetTask(uid: string, task: Task): Promise<void> {
  await setDoc(doc(db, 'users', uid, 'tasks', task.id), taskToDoc(task));
}

export async function fsDeleteTask(uid: string, taskId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'tasks', taskId));
}

export async function fsBatchSync(uid: string, toSet: Task[], toDelete: string[]): Promise<void> {
  if (toSet.length === 0 && toDelete.length === 0) return;
  const batch = writeBatch(db);
  for (const task of toSet) batch.set(doc(db, 'users', uid, 'tasks', task.id), taskToDoc(task));
  for (const id of toDelete) batch.delete(doc(db, 'users', uid, 'tasks', id));
  await batch.commit();
}

// ─── Invites ──────────────────────────────────────────────────────────────────

export interface Invite {
  id: string;
  fromUid: string;
  fromEmail: string;
  toEmail: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

function docToInvite(id: string, raw: Record<string, unknown>): Invite {
  const ts = (v: unknown) => v instanceof Timestamp ? v.toDate() : new Date();
  return {
    id,
    fromUid: String(raw.fromUid),
    fromEmail: String(raw.fromEmail),
    toEmail: String(raw.toEmail),
    status: (raw.status as Invite['status']) ?? 'pending',
    createdAt: ts(raw.createdAt),
  };
}

export async function sendInvite(fromUid: string, fromEmail: string, toEmail: string): Promise<void> {
  const ref = doc(collection(db, 'invites'));
  await setDoc(ref, {
    fromUid,
    fromEmail: fromEmail.toLowerCase().trim(),
    toEmail: toEmail.toLowerCase().trim(),
    status: 'pending',
    createdAt: Timestamp.now(),
  });
}

export function subscribeToSentInvites(
  uid: string,
  onUpdate: (invites: Invite[]) => void,
): () => void {
  const q = query(collection(db, 'invites'), where('fromUid', '==', uid));
  return onSnapshot(q, snap => {
    const list = snap.docs
      .map(d => docToInvite(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    onUpdate(list);
  });
}

export function subscribeToReceivedInvites(
  email: string,
  onUpdate: (invites: Invite[]) => void,
): () => void {
  const q = query(
    collection(db, 'invites'),
    where('toEmail', '==', email.toLowerCase().trim()),
    where('status', '==', 'pending'),
  );
  return onSnapshot(q, snap => {
    onUpdate(snap.docs.map(d => docToInvite(d.id, d.data() as Record<string, unknown>)));
  });
}

export async function respondToInvite(inviteId: string, status: 'accepted' | 'rejected'): Promise<void> {
  try {
    await setDoc(doc(db, 'invites', inviteId), { status }, { merge: true });
  } catch (e) {
    console.error('[Firestore] respondToInvite', e);
  }
}

// ── Projects ────────────────────────────────────────────────────────────────
export interface FirestoreProject {
  id: string;
  name: string;
  color: TagColor;
  createdAt: Date;
}

const DEFAULT_PROJECTS: { id: string; name: string; color: TagColor }[] = [
  { id: 'ai-officer', name: 'AI officer', color: 'indigo' },
  { id: 'dis', name: 'ДІС', color: 'blue' },
  { id: 'haifom', name: 'Хайфом', color: 'blue' },
  { id: 'acat', name: 'ACAT', color: 'emerald' },
  { id: 'treid', name: 'Трейд', color: 'purple' },
  { id: 'orli', name: 'Орлі', color: 'amber' },
  { id: 'yas', name: 'ЯС', color: 'rose' },
  { id: 'kabin', name: 'Кабін', color: 'slate' },
  { id: 'moye', name: 'Моє', color: 'emerald' },
  { id: 'navchannia', name: 'Навчання', color: 'emerald' },
  { id: 'rozrobka', name: 'Розробка', color: 'indigo' },
];

export async function initUserProjects(uid: string): Promise<FirestoreProject[]> {
  const ref = collection(db, 'users', uid, 'projects');
  const snap = await getDocs(ref);
  if (!snap.empty) {
    return snap.docs.map(d => ({ ...d.data(), id: d.id, createdAt: d.data().createdAt?.toDate() || new Date() } as FirestoreProject));
  }
  // Створюємо дефолтні проекти для нового користувача
  const projects: FirestoreProject[] = [];
  for (const p of DEFAULT_PROJECTS) {
    const createdAt = Timestamp.now();
    await setDoc(doc(ref, p.id), { ...p, createdAt });
    projects.push({ ...p, createdAt: createdAt.toDate() });
  }
  return projects;
}

export async function addUserProject(uid: string, name: string, color: TagColor): Promise<FirestoreProject> {
  const id = crypto.randomUUID();
  const ref = collection(db, 'users', uid, 'projects');
  const createdAt = Timestamp.now();
  await setDoc(doc(ref, id), { id, name, color, createdAt });
  return { id, name, color, createdAt: createdAt.toDate() };
}

export async function deleteUserProject(uid: string, projectId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'projects', projectId));
}

export function subscribeToUserProjects(uid: string, onUpdate: (projects: FirestoreProject[]) => void): () => void {
  const ref = collection(db, 'users', uid, 'projects');
  return onSnapshot(ref, snap => {
    const projects = snap.docs.map(d => ({
      ...d.data(), id: d.id,
      createdAt: d.data().createdAt?.toDate() || new Date()
    } as FirestoreProject));
    onUpdate(projects.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()));
  });
}
