import { AuthProvider } from '@/src/components/AuthProvider';
import { useAppStore } from '@/src/store/useAppStore';
import { Login } from '@/src/screens/Login';
import { Dashboard } from '@/src/screens/Dashboard';

function AppContent() {
  const { user, isAuthLoaded } = useAppStore();
  if (!isAuthLoaded) return <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-400 text-sm">Завантаження...</div>;
  if (!user) return <Login />;
  return <Dashboard />;
}

export default function App() {
  return <AuthProvider><AppContent /></AuthProvider>;
}
