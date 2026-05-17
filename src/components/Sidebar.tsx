import { LogOut, Calendar, Columns, CheckSquare, X, Plus, Settings, Sun, ChevronLeft, ChevronRight, BarChart2, Target } from 'lucide-react';
import { useAppStore, ActiveView } from '../store/useAppStore';
import { useTaskStore } from '../store/useTaskStore';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { useState } from 'react';

const DOT: Record<string,string> = {
  blue:'bg-blue-400', indigo:'bg-indigo-400', purple:'bg-purple-400',
  emerald:'bg-emerald-400', amber:'bg-amber-400', rose:'bg-rose-400', slate:'bg-slate-400',
};

export function Sidebar() {
  const { user, isMobileMenuOpen, setMobileMenuOpen, activeView, setActiveView } = useAppStore();
  const { projects, activeProjectFilter, setActiveProjectFilter, addProject } = useTaskStore();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [collapsed, setCollapsed] = useState(false);

  const go = (v: ActiveView) => { setActiveView(v); setMobileMenuOpen(false); };
  const pickProject = (name: string) => { setActiveProjectFilter(activeProjectFilter===name?null:name); setMobileMenuOpen(false); };

  const nav = (v: ActiveView, label: string, Icon: any) => {
    const isActive = activeView === v;
    return (
      <button key={v} onClick={()=>go(v)} title={label}
        className={`w-full flex items-center rounded-lg text-sm transition-colors
          gap-2.5 px-3 py-2
          ${collapsed ? 'lg:justify-center lg:px-0 lg:py-2.5 lg:gap-0' : ''}
          ${isActive
            ? `bg-indigo-600/20 text-indigo-400${!collapsed ? ' border-l-2 border-indigo-500 pl-[10px]' : ' lg:border-l-0'}`
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}>
        <Icon className="w-4 h-4 shrink-0"/>
        <span className={collapsed ? 'lg:hidden' : ''}>{label}</span>
      </button>
    );
  };

  return (
    <>
      {isMobileMenuOpen&&<div className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden" onClick={()=>setMobileMenuOpen(false)}/>}
      <aside className={`fixed inset-y-0 left-0 z-50 bg-slate-900 flex flex-col shrink-0 h-full transition-all duration-300 lg:static lg:translate-x-0 overflow-y-auto overflow-x-hidden
        w-56 ${collapsed ? 'lg:w-14' : 'lg:w-56'}
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

        <div className="p-3 flex-1 flex flex-col gap-4">
          {/* Logo + toggle */}
          <div className={`flex items-center ${collapsed ? 'lg:justify-center' : 'justify-between'}`}>
            <div className={`flex items-center gap-2 ${collapsed ? 'lg:hidden' : ''}`}>
              <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">Ω</span>
              </div>
              <h1 className="text-white font-bold text-sm">OmniPlan</h1>
            </div>
            <div className={`hidden items-center justify-center w-7 h-7 bg-indigo-500 rounded-lg shrink-0 ${collapsed ? 'lg:flex' : ''}`}>
              <span className="text-white font-bold text-sm">Ω</span>
            </div>
            <div className="flex items-center gap-0.5">
              <button className="lg:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800" onClick={()=>setMobileMenuOpen(false)}>
                <X className="w-4 h-4"/>
              </button>
              <button onClick={()=>setCollapsed(c=>!c)} title={collapsed ? 'Розгорнути' : 'Згорнути'}
                className={`hidden lg:flex text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors ${collapsed ? 'lg:mx-auto' : ''}`}>
                {collapsed ? <ChevronRight className="w-4 h-4"/> : <ChevronLeft className="w-4 h-4"/>}
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-0.5">
            <p className={`text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1.5 ${collapsed ? 'lg:hidden' : ''}`}>Навігація</p>
            {nav('today','Мій день',Sun)}
            {nav('calendar','Календар',Calendar)}
            {nav('board','Дошка',Columns)}
            {nav('tasks','Мої завдання',CheckSquare)}
            {nav('stats','Статистика',BarChart2)}
            {nav('focus','Фокус',Target)}
            {nav('settings','Налаштування',Settings)}
          </nav>

          {/* Projects — hidden on desktop when collapsed */}
          <div className={`flex-1 ${collapsed ? 'lg:hidden' : ''}`}>
            <div className="flex justify-between items-center mb-1.5">
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Проєкти</p>
              <button onClick={()=>setAdding(true)} className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"><Plus className="w-3.5 h-3.5"/></button>
            </div>
            <button onClick={()=>{setActiveProjectFilter(null);setMobileMenuOpen(false);}}
              className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors mb-0.5 ${!activeProjectFilter?'bg-slate-700 text-white':'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              <div className="w-2 h-2 rounded-full bg-slate-500"/><span>Всі проєкти</span>
            </button>
            <ul className="space-y-0.5">
              {projects.map(p=>(
                <li key={p.id}>
                  <button onClick={()=>pickProject(p.name)}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${activeProjectFilter===p.name?'bg-slate-700 text-white':'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                    <div className={`w-2 h-2 rounded-full shrink-0 ${DOT[p.color]||'bg-slate-400'}`}/><span className="truncate"># {p.name}</span>
                  </button>
                </li>
              ))}
            </ul>
            {adding&&(
              <div className="mt-2 flex gap-1">
                <input autoFocus value={newName} onChange={e=>setNewName(e.target.value)}
                  onKeyDown={e=>{if(e.key==='Enter'&&newName.trim()){addProject(newName.trim());setNewName('');setAdding(false);}if(e.key==='Escape')setAdding(false);}}
                  placeholder="Назва..." className="flex-1 bg-slate-800 text-white text-xs px-3 py-2 rounded-lg border border-slate-600 focus:outline-none focus:border-indigo-500 placeholder-slate-500"/>
                <button onClick={()=>{if(newName.trim()){addProject(newName.trim());setNewName('');setAdding(false);}}} className="bg-indigo-600 text-white px-2 rounded-lg hover:bg-indigo-700 text-xs font-bold">+</button>
              </div>
            )}
          </div>
          {collapsed && <div className="flex-1 hidden lg:block"/>}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800">
          <div className={`flex items-center gap-2 p-2 hover:bg-slate-800 rounded-lg cursor-pointer group ${collapsed ? 'lg:justify-center' : ''}`}
            onClick={()=>signOut(auth)} title={user?.displayName||user?.email||''}>
            {user?.photoURL
              ? <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full shrink-0"/>
              : <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold uppercase shrink-0">
                  {user?.email?.slice(0,2)||'VS'}
                </div>}
            <div className={`flex flex-col flex-1 overflow-hidden ${collapsed ? 'lg:hidden' : ''}`}>
              <span className="text-white text-xs font-medium truncate">{user?.displayName||user?.email||'Гість'}</span>
              <span className="text-slate-500 text-[10px]">Вийти</span>
            </div>
            <LogOut className={`w-3.5 h-3.5 text-slate-500 group-hover:text-white shrink-0 ${collapsed ? 'lg:hidden' : ''}`}/>
          </div>
        </div>
      </aside>
    </>
  );
}
