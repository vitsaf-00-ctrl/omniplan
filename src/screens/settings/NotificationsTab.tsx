import { useState } from 'react';
import { useTaskStore } from '../../store/useTaskStore';
import { Toggle } from './Toggle';

export function NotificationsTab() {
  const { settings, updateSettings } = useTaskStore();
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
          <p className="text-sm font-bold text-slate-800 dark:text-white">Desktop сповіщення</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Спливаючі сповіщення в браузері</p>
          {permissionDenied && (
            <p className="text-[10px] text-rose-500 mt-1">Дозвіл відхилено — змініть у налаштуваннях браузера</p>
          )}
        </div>
        <Toggle on={settings.notifyDesktop} onChange={handleDesktopToggle}/>
      </div>
    </div>
  );
}
