import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useTaskStore, Task } from '../store/useTaskStore';
import { subscribeToUserTasks, subscribeToUserProjects, initUserProjects } from '../lib/taskFirestore';
import { collection, setDoc, doc, Timestamp } from 'firebase/firestore';
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

async function scheduleRecurringTasks(uid: string, tasks: Task[]) {
  const recurring = tasks.filter(t => t.recurring);
  if (!recurring.length) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in30days = new Date(today);
  in30days.setDate(today.getDate() + 30);

  for (const task of recurring) {
    const recurringType = (task as any).recurringType || 'weekly';
    let next = getNextDate(task);
    if (!next) continue;

    // Створюємо копії на 30 днів вперед
    while (next <= in30days) {
      const dateStr = next.toISOString().slice(0, 10);
      // Перевіряємо чи вже є така задача
      const exists = tasks.some(t =>
        t.title === task.title &&
        t.project === task.project &&
        new Date(t.date).toISOString().slice(0, 10) === dateStr &&
        t.id !== task.id
      );

      if (!exists) {
        const id = `rec_${task.id}_${dateStr}`;
        const tasksRef = collection(db, 'users', uid, 'tasks');
        await setDoc(doc(tasksRef, id), {
          id,
          title: task.title,
          project: task.project,
          status: 'todo',
          priority: task.priority || 'low',
          date: Timestamp.fromDate(next),
          createdAt: Timestamp.now(),
          subtasks: [],
          notes: task.notes || '',
          repeat: true,
          recurring: true,
          recurringType,
          recurringParentId: task.id,
        });
      }

      // Наступна дата
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
  const scheduledRef = useRef(false);

  useEffect(() => {
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    scheduledRef.current = false;

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
        setTasks(tasks);
        // Запускаємо планування тільки один раз при першому завантаженні
        if (!scheduledRef.current) {
          scheduledRef.current = true;
          scheduleRecurringTasks(user.uid, tasks).catch(console.error);
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
