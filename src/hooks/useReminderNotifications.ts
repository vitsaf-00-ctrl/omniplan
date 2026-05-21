import { useEffect, useRef } from 'react';
import { useTaskStore } from '../store/useTaskStore';

export function useReminderNotifications() {
  const firedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const check = () => {
      if (Notification.permission !== 'granted') return;
      const { tasks, settings } = useTaskStore.getState();
      if (!settings.notifyDesktop) return;

      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const dayKey = now.toDateString();

      for (const task of tasks) {
        if (!task.reminderEnabled || task.status === 'done' || task.someday) continue;
        if (task.reminderTime !== hhmm) continue;
        const key = `${dayKey}|${task.id}`;
        if (firedRef.current.has(key)) continue;
        firedRef.current.add(key);
        new Notification(task.title, {
          body: task.notes ? task.notes.slice(0, 60) : task.project || 'OmniPlan',
          icon: '/favicon.ico',
          tag: task.id,
        });
      }
    };

    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, []);
}
