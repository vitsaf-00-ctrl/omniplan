import { useState, useEffect } from 'react';
import { Send, Check, Users, X, Clock } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import {
  sendInvite, subscribeToSentInvites, subscribeToReceivedInvites,
  respondToInvite, type Invite,
} from '../../lib/taskFirestore';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';

export function TeamTab() {
  const { user } = useAppStore();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [sentInvites, setSentInvites] = useState<Invite[]>([]);
  const [receivedInvites, setReceivedInvites] = useState<Invite[]>([]);

  useEffect(() => {
    if (!user) return;
    const u1 = subscribeToSentInvites(user.uid, setSentInvites);
    const u2 = user.email ? subscribeToReceivedInvites(user.email, setReceivedInvites) : () => {};
    return () => { u1(); u2(); };
  }, [user?.uid]);

  const handleInvite = async () => {
    if (!email.trim() || !user) return;
    if (email.toLowerCase() === user.email?.toLowerCase()) { setError('Не можна запросити себе'); return; }
    setSending(true); setError('');
    try {
      await sendInvite(user.uid, user.email || '', email.trim());
      setEmail(''); setSent(true); setTimeout(() => setSent(false), 3000);
    } catch {
      setError('Помилка надсилання. Спробуйте ще раз.');
    } finally { setSending(false); }
  };

  const statusBadge = (s: Invite['status']) => ({
    pending: 'bg-amber-100 text-amber-700',
    accepted: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-rose-100 text-rose-500',
  }[s]);
  const statusLabel = (s: Invite['status']) => ({ pending: 'Очікує', accepted: 'Прийнято', rejected: 'Відхилено' }[s]);

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Запросити учасника</h4>
        <div className="flex gap-2">
          <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleInvite()}
            placeholder="email@example.com"
            className="flex-1 text-sm border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"/>
          <button onClick={handleInvite} disabled={!email.trim() || sending}
            className={`px-4 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-40
              ${sent ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
            {sent ? <><Check className="w-4 h-4"/> Надіслано!</> : sending ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"/> : <><Send className="w-4 h-4"/> Запросити</>}
          </button>
        </div>
        {error && <p className="text-xs text-rose-500 mt-1.5 font-semibold">{error}</p>}
        <p className="text-[10px] text-slate-400 mt-2">Запрошена особа отримає доступ до ваших спільних проєктів.</p>
      </div>

      {receivedInvites.length > 0 && (
        <div>
          <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Запрошення до вас</h4>
          <div className="space-y-2">
            {receivedInvites.map(inv => (
              <div key={inv.id} className="flex items-center gap-3 p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-black text-sm shrink-0">
                  {inv.fromEmail.slice(0,1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{inv.fromEmail}</p>
                  <p className="text-[10px] text-slate-400">запрошує вас до спільної роботи</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => respondToInvite(inv.id, 'accepted')}
                    className="px-3 py-1.5 text-[10px] font-black uppercase bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                    Прийняти
                  </button>
                  <button onClick={() => respondToInvite(inv.id, 'rejected')}
                    className="p-1.5 text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors">
                    <X className="w-4 h-4"/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
          Надіслані запрошення {sentInvites.length > 0 && `(${sentInvites.length})`}
        </h4>
        {sentInvites.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-30"/>
            <p className="text-sm font-semibold">Ще немає запрошень</p>
            <p className="text-xs mt-1">Запросіть колег до спільної роботи</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sentInvites.map(inv => (
              <div key={inv.id} className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-black text-sm shrink-0">
                  {inv.toEmail.slice(0,1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{inv.toEmail}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-3 h-3 text-slate-300"/>
                    <p className="text-[10px] text-slate-400">
                      {format(inv.createdAt, 'd MMM yyyy', { locale: uk })}
                    </p>
                  </div>
                </div>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${statusBadge(inv.status)}`}>
                  {statusLabel(inv.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
