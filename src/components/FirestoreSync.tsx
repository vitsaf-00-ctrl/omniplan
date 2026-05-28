import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useTaskStore } from '../store/useTaskStore';
import { subscribeToUserTasks, subscribeToUserProjects, initUserProjects } from '../lib/taskFirestore';

export function FirestoreSync() {
  const user = useAppStore(s => s.user);
  const { setUserId, setTasks, setFirestoreLoaded } = useTaskStore();
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }

    if (!user) {
      setUserId(null);
      setTasks([]);
      setFirestoreLoaded(false);
      return;
    }

    setUserId(user.uid);

    initUserProjects(user.uid).then(projects => {
      useTaskStore.getState().setProjects(projects);
    });
    const unsubProjects = subscribeToUserProjects(user.uid, (projects) => {
      useTaskStore.getState().setProjects(projects);
    });

    unsubRef.current = subscribeToUserTasks(
      user.uid,
      (tasks) => {
        useTaskStore.temporal.getState().pause();
        setTasks(tasks);
        useTaskStore.temporal.getState().resume();
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
