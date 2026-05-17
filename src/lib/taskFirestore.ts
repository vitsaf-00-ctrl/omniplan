import { db } from './firebase';
import {
  collection, doc, setDoc, deleteDoc, onSnapshot,
  query, orderBy, where, Timestamp,
} from 'firebase/firestore';
import type { Task } from '../store/useTaskStore';

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
    reminderEnabled: task.reminderEnabled ?? false,
    reminderTime: task.reminderTime ?? '',
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

function docToTask(id: string, raw: Record<string, unknown>): Task {
  const toDate = (v: unknown): Date =>
    v instanceof Timestamp ? v.toDate() : v ? new Date(v as string) : new Date();

  return {
    id,
    title: String(raw.title ?? ''),
    project: String(raw.project ?? ''),
    status: (raw.status as Task['status']) ?? 'todo',
    date: toDate(raw.date),
    someday: Boolean(raw.someday),
    tagColor: (raw.tagColor as Task['tagColor']) ?? 'slate',
    notes: (raw.notes as string) || undefined,
    recurring: (raw.recurring as boolean) || undefined,
    reminderEnabled: (raw.reminderEnabled as boolean) || undefined,
    reminderTime: (raw.reminderTime as string) || undefined,
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
    priority: (raw.priority as Task['priority']) || undefined,
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
  try {
    await setDoc(doc(db, 'users', uid, 'tasks', task.id), taskToDoc(task));
  } catch (e) {
    console.error('[Firestore] fsSetTask', e);
  }
}

export async function fsDeleteTask(uid: string, taskId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'users', uid, 'tasks', taskId));
  } catch (e) {
    console.error('[Firestore] fsDeleteTask', e);
  }
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
