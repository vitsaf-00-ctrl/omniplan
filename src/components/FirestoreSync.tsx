import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useTaskStore, Task } from '../store/useTaskStore';
import { subscribeToUserTasks, subscribeToUserProjects, initUserProjects } from '../lib/taskFirestore';
import { collection, setDoc, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

function getNextDate(task: Task): Date | null {
  const base = new Date(task.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const recurringType = (task as any).recurringType || 'weekly';

  let next = new Date(base);

  if (recurringType === 'daily') {
    next = new Date(today);
    next.setDate(today.getDate() + 1);
  } else if (recurringType === 'weekdays') {
    next = new Date(today);
    next.setDate(today.getDate() + 1);
    while (next.getDay() === 0 || next.getDay() === 6) {
      next.setDate(next.getDate() + 1);
    }
  } else if (recurringType === 'weekly') {
    next = new Date(base);
    while (next <= today) next.setDate(next.getDate() + 7);
  } else if (recurringType === 'monthly') {
    next = new Date(base);
    while (next <= today) next.setMonth(next.getMonth() + 1);
  }

  return next;
}

async function cleanupSpuriousInstances(uid: string, tasks: Task[]) {
  const spurious = tasks.filter(t => (t as any).recurringParentId?.startsWith('rec_'));
  if (!spurious.length) return;
  const tasksRef = collection(db, 'users', uid, 'tasks');
  for (const t of spurious) {
    await deleteDoc(doc(tasksRef, t.id));
  }
}

async function scheduleRecurringTasks(uid: string, tasks: Task[], onlyIds?: Set<string>) {
  // Only process parent tasks — instances have recurringParentId set
  const recurring = tasks.filter(t => t.recurring && !(t as any).recurringParentId);
  const toSchedule = onlyIds ? recurring.filter(t => onlyIds.has(t.id)) : recurring;
  if (!toSchedule.length) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in30days = new Date(today);
  in30days.setDate(today.getDate() + 30);

  const existingIds = new Set(tasks.map(t => t.id));

  for (const task of toSchedule) {
    const recurringType = (task as any).recurringType || 'weekly';
    let next = getNextDate(task);
    if (!next) continue;

    while (next <= in30days) {
      const dateStr = next.toISOString().slice(0, 10);
      const id = `rec_${task.id}_${dateStr}`;

      if (!existingIds.has(id)) {
        const tasksRef = collection(db, 'users', uid, 'tasks');
        await setDoc(doc(tasksRef, id), {
          id,
          title: task.title,
          project: task.project,
          tagColor: task.tagColor,
          status: 'todo',
          priority: task.priority ?? null,
          time: task.time ?? '',
          date: Timestamp.fromDate(next),
          createdAt: Timestamp.now(),
          subtasks: [],
          notes: task.notes || '',
          recurring: true,
          recurringType,
          recurringParentId: task.id,
        });
        existingIds.add(id);
      }

      if (recurringType === 'daily') {
        next = new Date(next);
        next.setDate(next.getDate() + 1);
      } else if (recurringType === 'weekdays') {
        next = new Date(next);
        next.setDate(next.getDate() + 1);
        while (next.getDay() === 0 || next.getDay() === 6) {
          next.setDate(next.getDate() + 1);
        }
      } else if (recurringType === 'weekly') {
        next = new Date(next);
        next.setDate(next.getDate() + 7);
      } else if (recurringType === 'monthly') {
        next = new Date(next);
        next.setMonth(next.getMonth() + 1);
      }
    }
  }
}

export function FirestoreSync() {
  const user = useAppStore(s => s.user);
  const { setUserId, setTasks, setFirestoreLoaded } = useTaskStore();
  const unsubRef = useRef<(() => void) | null>(null);
  const scheduledIdsRef = useRef<Set<string>>(new Set());
  const cleanedRef = useRef(false);

  useEffect(() => {
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    scheduledIdsRef.current = new Set();
    cleanedRef.current = false;

    if (!user) {
      setUserId(null);
      setTasks([]);
      setFirestoreLoaded(false);
      return;
    }

    setUserId(user.uid);

    // Init and subscribe to projects
    initUserProjects(user.uid).then(projects => {
      useTaskStore.getState().setProjects(projects);
    });
    const unsubProjects = subscribeToUserProjects(user.uid, (projects) => {
      useTaskStore.getState().setProjects(projects);
    });

    unsubRef.current = subscribeToUserTasks(
      user.uid,
      (tasks) => {
        // Firestore sync не повинна потрапляти в undo-history
        useTaskStore.temporal.getState().pause();
        setTasks(tasks);
        useTaskStore.temporal.getState().resume();
        // Одноразове очищення помилкових копій-з-копій
        if (!cleanedRef.current) {
          cleanedRef.current = true;
          cleanupSpuriousInstances(user.uid, tasks).catch(console.error);
        }
        // Планування для нових батьківських повторюваних задач
        const newIds = new Set(
          tasks
            .filter(t => t.recurring && !(t as any).recurringParentId && !scheduledIdsRef.current.has(t.id))
            .map(t => t.id)
        );
        if (newIds.size > 0) {
          newIds.forEach(id => scheduledIdsRef.current.add(id));
          scheduleRecurringTasks(user.uid, tasks, newIds).catch(console.error);
        }
      },
      () => setFirestoreLoaded(true),
    );

    return () => {
      if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
      unsubProjects();
    };
  }, [user?.uid]);

  return null;
}
