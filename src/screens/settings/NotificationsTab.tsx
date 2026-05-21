import { useState } from 'react';
import { useTaskStore } from '../../store/useTaskStore';
import { Toggle } from './Toggle';

export function NotificationsTab() {
  const { settings, updateSettings } = useTaskStore();
  const [emailAlerts, setEmailAlerts] = useState(settings.notifyEmail);
  const [desktopAlerts, setDesktopAlerts] = useState(false);

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
    </div>
  );
}
