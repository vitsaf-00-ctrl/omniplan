import { useState } from 'react';
import { Slack, Chrome, Mail } from 'lucide-react';

export function IntegrationsTab() {
  const [connected, setConnected] = useState<Record<string, boolean>>({});
  const integrations = [
    { id: 'slack', name: 'Slack', desc: 'Сповіщення в канали Slack', icon: Slack, color: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' },
    { id: 'teams', name: 'Microsoft Teams', desc: 'Інтеграція з Teams', icon: Chrome, color: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800' },
    { id: 'outlook', name: 'Outlook', desc: 'Синхронізація з поштою та календарем', icon: Mail, color: 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800' },
  ];

  return (
    <div className="space-y-3">
      {integrations.map(item => {
        const Icon = item.icon;
        const isConnected = !!connected[item.id];
        return (
          <div key={item.id} className={`flex items-center gap-4 p-4 rounded-xl border ${item.color}`}>
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm shrink-0">
              <Icon className="w-5 h-5 text-slate-600 dark:text-slate-300"/>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-800 dark:text-white">{item.name}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
            </div>
            <button onClick={() => setConnected(c => ({ ...c, [item.id]: !c[item.id] }))}
              className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all shrink-0
                ${isConnected ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
              {isConnected ? '✓ Connected' : 'Connect'}
            </button>
          </div>
        );
      })}
    </div>
  );
}
