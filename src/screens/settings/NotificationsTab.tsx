import { useState } from 'react';
import { Send } from 'lucide-react';
import { useTaskStore } from '../../store/useTaskStore';
import { Toggle } from './Toggle';

export function NotificationsTab() {
  const { settings, updateSettings } = useTaskStore();
  const [emailAlerts, setEmailAlerts] = useState(settings.notifyEmail);
  const [desktopAlerts, setDesktopAlerts] = useState(false);

  const testTelegram = async () => {
    if (!settings.telegramBotToken || !settings.telegramChatId) return alert('Введіть токен і Chat ID');
    try {
      await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: settings.telegramChatId, text: '✅ OmniPlan підключено!' }),
      });
      alert('Повідомлення надіслано!');
    } catch { alert('Помилка. Перевірте токен і Chat ID.'); }
  };

  return (
    <div className="space-y-4">
      {[
        { label: 'Email сповіщення', desc: 'Отримувати нагадування на пошту', on: emailAlerts, toggle: () => { setEmailAlerts(!emailAlerts); updateSettings({ notifyEmail: !emailAlerts }); } },
        { label: 'Desktop сповіщення', desc: 'Спливаючі сповіщення в браузері', on: desktopAlerts, toggle: () => setDesktopAlerts(!desktopAlerts) },
      ].map(item => (
        <div key={item.label} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-white">{item.label}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{item.desc}</p>
          </div>
          <Toggle on={item.on} onChange={item.toggle}/>
        </div>
      ))}

      {settings.notifyEmail && (
        <div>
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Email адреса</label>
          <input type="email" value={settings.email} onChange={e => updateSettings({ email: e.target.value })}
            placeholder="your@email.com"
            className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"/>
        </div>
      )}

      <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-blue-500"/>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-white">Telegram</p>
              <p className="text-[10px] text-slate-400">Бот нагадувань</p>
            </div>
          </div>
          <Toggle on={settings.notifyTelegram} onChange={() => updateSettings({ notifyTelegram: !settings.notifyTelegram })}/>
        </div>
        {settings.notifyTelegram && (
          <>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Bot Token</label>
              <input type="text" value={settings.telegramBotToken} onChange={e => updateSettings({ telegramBotToken: e.target.value })}
                placeholder="1234567890:AAF..." className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 bg-white dark:bg-slate-700 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30"/>
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Chat ID</label>
              <input type="text" value={settings.telegramChatId} onChange={e => updateSettings({ telegramChatId: e.target.value })}
                placeholder="-1001234567890" className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 bg-white dark:bg-slate-700 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30"/>
            </div>
            <button onClick={testTelegram} className="w-full bg-blue-500 hover:bg-blue-600 text-white text-xs font-black py-2.5 rounded-xl uppercase tracking-widest transition-all">
              Надіслати тест
            </button>
          </>
        )}
      </div>
    </div>
  );
}
