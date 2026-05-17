import React, { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/src/lib/firebase';
import { useAppStore } from '@/src/store/useAppStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setAuthLoaded } = useAppStore();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthLoaded(true);
    });

    return () => unsub();
  }, [setUser, setAuthLoaded]);

  return <>{children}</>;
}
