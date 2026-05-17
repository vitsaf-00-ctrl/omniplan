import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useTaskStore } from '../store/useTaskStore';
import { subscribeToUserTasks } from '../lib/taskFirestore';

export function FirestoreSync() {
  const user = useAppStore(s => s.user);
  const { setUserId, setTasks, setFirestoreLoaded } = useTaskStore();
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Tear down previous subscription
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }

    if (!user) {
      setUserId(null);
      setTasks([]);
      setFirestoreLoaded(false);
      return;
    }

    setUserId(user.uid);

    // Subscribe to real-time task updates
    unsubRef.current = subscribeToUserTasks(
      user.uid,
      (tasks) => setTasks(tasks),
      () => setFirestoreLoaded(true), // treat error as "loaded" to unblock UI
    );

    return () => {
      if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    };
  }, [user?.uid]); // re-subscribe only when uid changes

  return null;
}
