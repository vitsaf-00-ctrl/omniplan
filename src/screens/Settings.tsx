import { useState } from 'react';
import { User, Palette, Bell, Link, Shield, Users, Wrench, Keyboard } from 'lucide-react';
import { ProfileTab } from './settings/ProfileTab';
import { AppearanceTab } from './settings/AppearanceTab';
import { NotificationsTab } from './settings/NotificationsTab';
import { IntegrationsTab } from './settings/IntegrationsTab';
import { SecurityTab } from './settings/SecurityTab';
import { TeamTab } from './settings/TeamTab';
import { MaintenanceTab } from './settings/MaintenanceTab';
import { ShortcutsTab } from './settings/ShortcutsTab';

type Tab = 'profile' | 'appearance' | 'notifications' | 'integrations' | 'security' | 'team' | 'maintenance' | 'shortcuts';

const TABS: { id: Tab; label: string; icon: typeof User }[] = [
  { id: 'profile', label: 'Профіль', icon: User },
  { id: 'appearance', label: 'Вигляд', icon: Palette },
  { id: 'notifications', label: 'Сповіщення', icon: Bell },
  { id: 'integrations', label: 'Інтеграції', icon: Link },
  { id: 'security', label: 'Безпека', icon: Shield },
  { id: 'team', label: 'Команда', icon: Users },
  { id: 'maintenance', label: 'Технічне', icon: Wrench },
  { id: 'shortcuts', label: 'Гарячі клавіші', icon: Keyboard },
];

export function Settings() {
  const [active, setActive] = useState<Tab>('profile');

  return (
    <div className="flex flex-col md:flex-row h-full gap-4 overflow-hidden">
      <div className="shrink-0 md:w-44">
        <div className="flex gap-1 overflow-x-auto pb-1 md:hidden">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setActive(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all shrink-0
                  ${active === t.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                <Icon className="w-3.5 h-3.5"/>{t.label}
              </button>
            );
          })}
        </div>
        <div className="hidden md:flex flex-col gap-0.5">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setActive(t.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left w-full
                  ${active === t.id ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                <Icon className="w-4 h-4 shrink-0"/>
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto md:mx-0">
          <h3 className="text-sm font-black text-slate-800 dark:text-white mb-4">
            {TABS.find(t => t.id === active)?.label}
          </h3>
          {active === 'profile' && <ProfileTab/>}
          {active === 'appearance' && <AppearanceTab/>}
          {active === 'notifications' && <NotificationsTab/>}
          {active === 'integrations' && <IntegrationsTab/>}
          {active === 'security' && <SecurityTab/>}
          {active === 'team' && <TeamTab/>}
          {active === 'maintenance' && <MaintenanceTab/>}
          {active === 'shortcuts' && <ShortcutsTab/>}
        </div>
      </div>
    </div>
  );
}
