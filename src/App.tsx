import { AuthProvider } from '@/src/components/AuthProvider';
import { FirestoreSync } from '@/src/components/FirestoreSync';
import { ConfirmDialog } from '@/src/components/ConfirmDialog';
import { ToastContainer } from '@/src/components/ToastContainer';
import { useAppStore } from '@/src/store/useAppStore';
import { useTaskStore } from '@/src/store/useTaskStore';
import { Login } from '@/src/screens/Login';
import { Dashboard } from '@/src/screens/Dashboard';

function AppContent() {
  const { user, isAuthLoaded } = useAppStore();
  const isFirestoreLoaded = useTaskStore(s => s.isFirestoreLoaded);

  if (!isAuthLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"/>
          <p className="text-sm text-slate-400 font-semibold">Завантаження...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Login />;

  if (!isFirestoreLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"/>
          <p className="text-sm text-slate-400 font-semibold">Синхронізація даних...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Dashboard />
      <ConfirmDialog />
      <ToastContainer />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <FirestoreSync />
      <AppContent />
    </AuthProvider>
  );
}
