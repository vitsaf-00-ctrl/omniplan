import { useState } from 'react';
import { useTaskStore } from '../../store/useTaskStore';
import { Toggle } from './Toggle';

export function NotificationsTab() {
  const { settings, updateSettings } = useTaskStore();
  const [emailAlerts, setEmailAlerts] = useState(settings.notifyEmail);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const handleDesktopToggle = async () => {
    if (settings.notifyDesktop) {
      updateSettings({ notifyDesktop: false });
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      updateSettings({ notifyDesktop: true });
      setPermissionDenied(false);
    } else {
      setPermissionDenied(true);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
        <div>
          <p className="text-sm font-bold text-slate-800 dark:text-white">Email сповіщення</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Отримувати нагадування на пошту</p>
        </div>
        <Toggle on={emailAlerts} onChange={() => { setEmailAlerts(!emailAlerts); updateSettings({ notifyEmail: !emailAlerts }); }}/>
      </div>

      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
        <div>
          <p className="text-sm font-bold text-slate-800 dark:text-white">Desktop сповіщення</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Спливаючі сповіщення в браузері</p>
          {permissionDenied && (
            <p className="text-[10px] text-rose-500 mt-1">Дозвіл відхилено — змініть у налаштуваннях браузера</p>
          )}
        </div>
        <Toggle on={settings.notifyDesktop} onChange={handleDesktopToggle}/>
      </div>

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
