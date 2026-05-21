import { LogOut, Calendar, Columns, CheckSquare, X, Plus, Settings, Sun, ChevronLeft, ChevronRight, BarChart2, Target, Pencil, Trash2, GripVertical, Check } from 'lucide-react';
import { useAppStore, ActiveView } from '../store/useAppStore';
import { useTaskStore } from '../store/useTaskStore';
import { auth, db } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { useState, useRef } from 'react';
import { deleteUserProject, addUserProject } from '../lib/taskFirestore';
import type { TagColor } from '../store/useTaskStore';
import { doc, updateDoc, collection } from 'firebase/firestore';

const DOT: Record<string,string> = {
  blue:'bg-blue-400', indigo:'bg-indigo-400', purple:'bg-purple-400',
  emerald:'bg-emerald-400', amber:'bg-amber-400', rose:'bg-rose-400', slate:'bg-slate-400',
};

const COLORS: TagColor[] = ['indigo','blue','purple','emerald','amber','rose','slate'];

export function Sidebar() {
  const { user, isMobileMenuOpen, setMobileMenuOpen, activeView, setActiveView } = useAppStore();
  const { projects, activeProjectFilter, setActiveProjectFilter, addProject, deleteProject, setProjects, userId } = useTaskStore();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState<TagColor>('indigo');
  const [collapsed, setCollapsed] = useState(false);
  const [editingId, setEditingId] = useState<string|null>(null);
  const [editName, setEditName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string|null>(null);
  const dragItem = useRef<number|null>(null);
  const dragOver = useRef<number|null>(null);

  const go = (v: ActiveView) => { setActiveView(v); setMobileMenuOpen(false); };
  const pickProject = (name: string) => { setActiveProjectFilter(activeProjectFilter===name?null:name); setMobileMenuOpen(false); };

  const handleAddProject = async () => {
    if (!newName.trim() || !userId) return;
    await addUserProject(userId, newName.trim(), newColor);
    setNewName(''); setAdding(false); setNewColor('indigo');
  };

  const handleRename = async (id: string) => {
    if (!editName.trim() || !userId) return;
    const ref = doc(collection(db, 'users', userId, 'projects'), id);
    await updateDoc(ref, { name: editName.trim() });
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!userId) return;
    await deleteUserProject(userId, id);
    deleteProject(id);
    setConfirmDeleteId(null);
  };

  const handleDragEnd = async () => {
    if (dragItem.current === null || dragOver.current === null) return;
    const reordered = [...projects];
    const dragged = reordered.splice(dragItem.current, 1)[0];
    reordered.splice(dragOver.current, 0, dragged);
    dragItem.current = null; dragOver.current = null;
    setProjects(reordered);
  };

  const nav = (v: ActiveView, label: string, Icon: any) => {
    const isActive = activeView === v;
    return (
      <button key={v} onClick={()=>go(v)} title={label}
        className={`w-full flex items-center rounded-lg text-sm transition-colors gap-2.5 px-3 py-2
          ${collapsed ? 'lg:justify-center lg:px-0 lg:py-2.5 lg:gap-0' : ''}
          ${isActive
            ? `bg-indigo-600/20 text-indigo-400${!collapsed?' border-l-2 border-indigo-500 pl-[10px]':' lg:border-l-0'}`
            : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
        <Icon className="w-4 h-4 shrink-0"/>
        <span className={collapsed?'lg:hidden':''}>{label}</span>
      </button>
    );
  };

  return (
    <>
      {isMobileMenuOpen&&<div className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden" onClick={()=>setMobileMenuOpen(false)}/>}
      <aside className={`fixed inset-y-0 left-0 z-50 bg-slate-900 flex flex-col shrink-0 h-full transition-all duration-300 lg:static lg:translate-x-0 overflow-y-auto overflow-x-hidden
        w-56 ${collapsed?'lg:w-14':'lg:w-56'}
        ${isMobileMenuOpen?'translate-x-0':'-translate-x-full lg:translate-x-0'}`}>

        <div className="p-3 flex-1 flex flex-col gap-4">
          {/* Logo */}
          <div className={`flex items-center ${collapsed?'lg:justify-center':'justify-between'}`}>
            <div className={`flex items-center gap-2 ${collapsed?'lg:hidden':''}`}>
              <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">Ω</span>
              </div>
              <h1 className="text-white font-bold text-sm">OmniPlan</h1>
            </div>
            <div className={`hidden items-center justify-center w-7 h-7 bg-indigo-500 rounded-lg shrink-0 ${collapsed?'lg:flex':''}`}>
              <span className="text-white font-bold text-sm">Ω</span>
            </div>
            <div className="flex items-center gap-0.5">
              <button className="lg:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800" onClick={()=>setMobileMenuOpen(false)}>
                <X className="w-4 h-4"/>
              </button>
              <button onClick={()=>setCollapsed(c=>!c)}
                className={`hidden lg:flex text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors ${collapsed?'lg:mx-auto':''}`}>
                {collapsed?<ChevronRight className="w-4 h-4"/>:<ChevronLeft className="w-4 h-4"/>}
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-0.5">
            <p className={`text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1.5 ${collapsed?'lg:hidden':''}`}>Навігація</p>
            {nav('today','Мій день',Sun)}
            {nav('calendar','Календар',Calendar)}
            {nav('board','Дошка',Columns)}
            {nav('tasks','Мої завдання',CheckSquare)}
            {nav('stats','Статистика',BarChart2)}
            {nav('focus','Фокус',Target)}
            {nav('settings','Налаштування',Settings)}
          </nav>

          {/* Projects */}
          <div className={`flex-1 ${collapsed?'lg:hidden':''}`}>
            <div className="flex justify-between items-center mb-1.5">
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Проєкти</p>
              <button onClick={()=>setAdding(true)} className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800">
                <Plus className="w-3.5 h-3.5"/>
              </button>
            </div>

            <button onClick={()=>{setActiveProjectFilter(null);setMobileMenuOpen(false);}}
              className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors mb-0.5 ${!activeProjectFilter?'bg-slate-700 text-white':'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              <div className="w-2 h-2 rounded-full bg-slate-500"/><span>Всі проєкти</span>
            </button>

            <ul className="space-y-0.5">
              {projects.map((p, i) => (
                <li key={p.id}
                  draggable
                  onDragStart={()=>{ dragItem.current=i; }}
                  onDragEnter={()=>{ dragOver.current=i; }}
                  onDragEnd={handleDragEnd}
                  onDragOver={e=>e.preventDefault()}
                  className="group relative">
                  {editingId === p.id ? (
                    <div className="flex gap-1 px-1 py-1">
                      <input autoFocus value={editName} onChange={e=>setEditName(e.target.value)}
                        onKeyDown={e=>{if(e.key==='Enter')handleRename(p.id);if(e.key==='Escape')setEditingId(null);}}
                        className="flex-1 bg-slate-800 text-white text-xs px-2 py-1.5 rounded-lg border border-indigo-500 focus:outline-none"/>
                      <button onClick={()=>handleRename(p.id)} className="text-emerald-400 hover:text-emerald-300 p-1">
                        <Check className="w-3.5 h-3.5"/>
                      </button>
                      <button onClick={()=>setEditingId(null)} className="text-slate-400 hover:text-white p-1">
                        <X className="w-3.5 h-3.5"/>
                      </button>
                    </div>
                  ) : confirmDeleteId === p.id ? (
                    <div className="px-2 py-1.5 bg-rose-900/30 rounded-lg">
                      <p className="text-[10px] text-rose-400 mb-1.5">Видалити «{p.name}»?</p>
                      <div className="flex gap-1">
                        <button onClick={()=>handleDelete(p.id)} className="flex-1 text-[10px] font-bold bg-rose-600 text-white py-1 rounded-lg">Так</button>
                        <button onClick={()=>setConfirmDeleteId(null)} className="flex-1 text-[10px] font-bold bg-slate-700 text-slate-300 py-1 rounded-lg">Ні</button>
                      </div>
                    </div>
                  ) : (
                    <div className={`flex items-center gap-1 rounded-lg transition-colors ${activeProjectFilter===p.name?'bg-slate-700':'hover:bg-slate-800'}`}>
                      <div className="text-slate-600 hover:text-slate-400 cursor-grab pl-1 py-1.5">
                        <GripVertical className="w-3 h-3"/>
                      </div>
                      <button onClick={()=>pickProject(p.name)}
                        className={`flex-1 flex items-center gap-2 px-2 py-1.5 text-sm ${activeProjectFilter===p.name?'text-white':'text-slate-400 hover:text-white'}`}>
                        <div className={`w-2 h-2 rounded-full shrink-0 ${DOT[p.color]||'bg-slate-400'}`}/>
                        <span className="truncate"># {p.name}</span>
                      </button>
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 pr-1 transition-opacity">
                        <button onClick={()=>{setEditingId(p.id);setEditName(p.name);}}
                          className="text-slate-500 hover:text-slate-300 p-1 rounded">
                          <Pencil className="w-3 h-3"/>
                        </button>
                        <button onClick={()=>setConfirmDeleteId(p.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 rounded">
                          <Trash2 className="w-3 h-3"/>
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>

            {adding && (
              <div className="mt-2 space-y-2">
                <input autoFocus value={newName} onChange={e=>setNewName(e.target.value)}
                  onKeyDown={e=>{if(e.key==='Enter')handleAddProject();if(e.key==='Escape')setAdding(false);}}
                  placeholder="Назва проєкту..."
                  className="w-full bg-slate-800 text-white text-xs px-3 py-2 rounded-lg border border-slate-600 focus:outline-none focus:border-indigo-500 placeholder-slate-500"/>
                <div className="flex gap-1 flex-wrap">
                  {COLORS.map(c=>(
                    <button key={c} onClick={()=>setNewColor(c)}
                      className={`w-5 h-5 rounded-full ${DOT[c]} ${newColor===c?'ring-2 ring-white ring-offset-1 ring-offset-slate-900':''}`}/>
                  ))}
                </div>
                <div className="flex gap-1">
                  <button onClick={handleAddProject} className="flex-1 bg-indigo-600 text-white text-xs py-1.5 rounded-lg hover:bg-indigo-700 font-bold">Додати</button>
                  <button onClick={()=>setAdding(false)} className="flex-1 bg-slate-700 text-slate-300 text-xs py-1.5 rounded-lg hover:bg-slate-600">Скасувати</button>
                </div>
              </div>
            )}
          </div>
          {collapsed&&<div className="flex-1 hidden lg:block"/>}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800">
          <div className={`flex items-center gap-2 p-2 hover:bg-slate-800 rounded-lg cursor-pointer group ${collapsed?'lg:justify-center':''}`}
            onClick={()=>signOut(auth)}>
            {user?.photoURL
              ? <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full shrink-0"/>
              : <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold uppercase shrink-0">
                  {user?.email?.slice(0,2)||'VS'}
                </div>}
            <div className={`flex flex-col flex-1 overflow-hidden ${collapsed?'lg:hidden':''}`}>
              <span className="text-white text-xs font-medium truncate">{user?.displayName||user?.email||'Гість'}</span>
              <span className="text-slate-500 text-[10px]">Вийти</span>
            </div>
            <LogOut className={`w-3.5 h-3.5 text-slate-500 group-hover:text-white shrink-0 ${collapsed?'lg:hidden':''}`}/>
          </div>
        </div>
      </aside>
    </>
  );
}
