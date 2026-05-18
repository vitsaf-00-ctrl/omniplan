import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/src/lib/firebase';
import { useAppStore } from '@/src/store/useAppStore';

export function Login() {
  const { setUser, setAuthLoaded } = useAppStore();

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDevLogin = () => {
    setUser({ email: 'dev@omniplan.local', displayName: 'Віталій Сафонов', uid: 'dev-user', photoURL: null } as any);
    setAuthLoaded(true);
  };

  return (
    <div className="flex h-screen items-center justify-center bg-[#f1f5f9]">
      <div className="w-[400px] bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">Ω</span>
          </div>
          <h1 className="text-slate-800 font-semibold text-2xl tracking-tight">OmniPlan</h1>
        </div>
        <p className="text-center text-slate-500 text-sm mb-6">
          Увійдіть, щоб керувати завданнями, проектами та співпрацювати з командою.
        </p>
        <button onClick={handleLogin}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-3 mb-3">
          Увійти через Google
        </button>
      </div>
    </div>
  );
}