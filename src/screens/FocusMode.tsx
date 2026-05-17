import { useState, useEffect, useRef, useMemo } from 'react';
import { X, Play, Pause, RotateCcw, Check, Headphones, Trophy, Target, ArrowLeft } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useTaskStore, Task } from '../store/useTaskStore';

const CONFETTI_COLORS = ['#6366f1','#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#f97316'];
const SOUNDS = ['Lo-fi', 'Rain', 'White Noise', 'Forest'] as const;

function Confetti() {
  const particles = useMemo(() =>
    Array.from({ length: 70 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      w: Math.random() * 9 + 4,
      h: Math.random() * 6 + 3,
      delay: Math.random() * 3,
      dur: Math.random() * 3 + 2,
    })), []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-10">
      <style>{`@keyframes cffall{0%{transform:translateY(-30px) rotate(0deg);opacity:1}100%{transform:translateY(110vh) rotate(720deg);opacity:0}}`}</style>
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute', left: p.left, top: 0,
          width: p.w, height: p.h, backgroundColor: p.color, borderRadius: 2,
          animation: `cffall ${p.dur}s ${p.delay}s linear forwards`,
        }}/>
      ))}
    </div>
  );
}

function TaskPicker({ onSelect, onClose }: { onSelect: (id: string) => void; onClose: () => void }) {
  const { tasks } = useTaskStore();
  const active = tasks.filter(t => !t.someday && t.status !== 'done');

  return (
    <div className="fixed inset-0 z-[300] flex flex-col" style={{ background: '#0F0F0F' }}>
      <div className="absolute top-4 left-4 z-10">
        <button onClick={onClose}
          className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm font-semibold">
          <X className="w-4 h-4"/> Закрити
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
        <div className="w-full max-w-sm">
          <div className="w-16 h-16 rounded-full bg-blue-600/20 flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-blue-500"/>
          </div>
          <h1 className="text-2xl font-black text-white text-center mb-1">Оберіть задачу</h1>
          <p className="text-slate-500 text-sm text-center mb-6">Яку задачу ви хочете виконати зараз?</p>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {active.map(t => (
              <button key={t.id} onClick={() => onSelect(t.id)}
                className="w-full text-left p-4 rounded-2xl transition-all hover:border-blue-500 border"
                style={{ background: '#1a1a1a', borderColor: '#2a2a2a' }}>
                <p className="font-bold text-white text-sm">{t.title}</p>
                <p className="text-slate-500 text-xs mt-0.5">{t.project} · {t.status === 'in_progress' ? 'В процесі' : 'Заплановано'}</p>
              </button>
            ))}
            {active.length === 0 && (
              <p className="text-slate-600 text-center py-8 text-sm">Немає активних задач</p>
            )}
          </div>

          <button onClick={() => onSelect('')}
            className="w-full mt-4 text-slate-600 hover:text-slate-400 text-sm transition-colors text-center py-2">
            Продовжити без задачі →
          </button>
        </div>
      </div>
    </div>
  );
}

function SessionReport({ sessionTime, task, onBack, onNew }: {
  sessionTime: number;
  task: Task | null;
  onBack: () => void;
  onNew: () => void;
}) {
  const sub = task?.subtasks || [];
  const subPct = sub.length > 0 ? Math.round((sub.filter(s => s.done).length / sub.length) * 100) : 100;
  const mins = Math.floor((25 * 60 - sessionTime) / 60);

  return (
    <div className="fixed inset-0 z-[400] flex flex-col items-center justify-center p-6" style={{ background: '#0F0F0F' }}>
      <Confetti/>
      <div className="relative z-20 flex flex-col items-center gap-6 max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl">
          <Trophy className="w-10 h-10 text-white"/>
        </div>
        <div>
          <h1 className="text-4xl font-black text-white mb-2">Well Done! 🎉</h1>
          <p className="text-slate-400 text-sm">Сесія завершена · {mins} хв глибокої роботи</p>
        </div>

        <div className="grid grid-cols-3 gap-3 w-full">
          {[
            { label: 'Tasks Completed', value: task ? '1' : '0', icon: '✅' },
            { label: 'Checklist', value: `${subPct}%`, icon: '📋' },
            { label: 'Deep Work', value: `${Math.min(100, Math.round(subPct * 0.7 + 30))}`, icon: '🧠' },
          ].map(c => (
            <div key={c.label} className="rounded-2xl p-4 text-center" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
              <div className="text-2xl mb-1">{c.icon}</div>
              <div className="text-xl font-black text-white">{c.value}</div>
              <div className="text-[10px] text-slate-500 uppercase font-bold mt-0.5">{c.label}</div>
            </div>
          ))}
        </div>

        {task && (
          <div className="w-full rounded-2xl p-4 text-left" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">Session Accomplishments</p>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 text-white"/>
              </div>
              <span className="text-white text-sm font-medium">{task.title}</span>
            </div>
          </div>
        )}

        <div className="flex gap-3 w-full">
          <button onClick={onBack}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-slate-400 transition-colors hover:text-white"
            style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
            <ArrowLeft className="w-4 h-4"/> Назад
          </button>
          <button onClick={onNew}
            className="flex-1 py-3 rounded-2xl text-sm font-black text-white bg-blue-600 hover:bg-blue-700 transition-colors">
            Нова сесія
          </button>
        </div>
      </div>
    </div>
  );
}

export function FocusMode() {
  const { setActiveView, focusTaskId, setFocusTaskId } = useAppStore();
  const { tasks, toggleSubtask, moveTask } = useTaskStore();

  // null = show picker; '' = no task; 'task_xxx' = specific task
  const [selectedId, setSelectedId] = useState<string | null>(focusTaskId);

  const activeTask = selectedId ? tasks.find(t => t.id === selectedId) || null : null;

  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [sound, setSound] = useState<string | null>(null);
  const [soundOpen, setSoundOpen] = useState(false);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);

  // BUG-02: ESC closes focus mode
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setFocusTaskId(null); setActiveView('today'); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [setActiveView, setFocusTaskId]);

  // Clear focusTaskId from store on unmount
  useEffect(() => () => setFocusTaskId(null), [setFocusTaskId]);

  useEffect(() => {
    if (isRunning) {
      interval.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { setIsRunning(false); setDone(true); return 0; }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (interval.current) clearInterval(interval.current); };
  }, [isRunning]);

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const secs = String(timeLeft % 60).padStart(2, '0');
  const progress = 1 - timeLeft / (25 * 60);
  const circumference = 2 * Math.PI * 90;

  const handleFinish = () => {
    if (activeTask) moveTask(activeTask.id, 'done');
    setIsRunning(false);
    setDone(true);
  };

  const handleNewSession = () => {
    setDone(false);
    setTimeLeft(25 * 60);
    setIsRunning(false);
    setSelectedId(null); // go back to picker
  };

  // BUG-01: Show task picker if no task selected yet
  if (selectedId === null) {
    return (
      <TaskPicker
        onSelect={id => setSelectedId(id)}
        onClose={() => { setFocusTaskId(null); setActiveView('today'); }}
      />
    );
  }

  if (done) {
    return (
      <SessionReport
        sessionTime={timeLeft}
        task={activeTask}
        onBack={() => { setFocusTaskId(null); setActiveView('today'); }}
        onNew={handleNewSession}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[300] flex flex-col" style={{ background: '#0F0F0F' }}>
      {/* Exit */}
      <div className="absolute top-4 left-4 z-10">
        <button onClick={() => { setFocusTaskId(null); setActiveView('today'); }}
          className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm font-semibold">
          <X className="w-4 h-4"/> Exit Focus
        </button>
      </div>

      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 text-slate-500 text-xs font-bold">
        <Target className="w-3.5 h-3.5"/>
        Pomodoro Session
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6">
        {/* Circular timer */}
        <div className="relative">
          <svg width="220" height="220" viewBox="0 0 220 220" className="rotate-[-90deg]">
            <circle cx="110" cy="110" r="90" fill="none" stroke="#1a1a1a" strokeWidth="12"/>
            <circle cx="110" cy="110" r="90" fill="none" stroke="#3b82f6" strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear' }}/>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-black text-white tabular-nums tracking-tight">{mins}:{secs}</span>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
              {isRunning ? 'Фокус...' : timeLeft === 25 * 60 ? 'Готово' : 'Пауза'}
            </span>
          </div>
        </div>

        {/* Task name */}
        {activeTask ? (
          <div className="text-center">
            <p className="text-blue-400 text-xl font-bold">{activeTask.title}</p>
            <p className="text-slate-600 text-sm mt-0.5">{activeTask.project}</p>
          </div>
        ) : (
          <p className="text-slate-600 text-sm">Вільна сесія — без прив'язки до задачі</p>
        )}

        {/* Subtask checklist */}
        {activeTask?.subtasks && activeTask.subtasks.length > 0 && (
          <div className="w-full max-w-sm space-y-2">
            <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mb-1">
              Підзадачі {activeTask.subtasks.filter(s => s.done).length}/{activeTask.subtasks.length}
            </p>
            {activeTask.subtasks.map(st => (
              <div key={st.id} onClick={() => toggleSubtask(activeTask.id, st.id)}
                className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors"
                style={{ background: '#1a1a1a', border: '1px solid #252525' }}>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${st.done ? 'bg-blue-600 border-blue-600' : 'border-slate-600 hover:border-blue-500'}`}>
                  {st.done && <Check className="w-3 h-3 text-white"/>}
                </div>
                <span className={`text-sm flex-1 transition-all ${st.done ? 'line-through text-slate-600' : 'text-slate-300'}`}>
                  {st.title}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-5">
          <button onClick={() => { setTimeLeft(25 * 60); setIsRunning(false); }}
            className="w-12 h-12 rounded-full flex items-center justify-center text-slate-500 hover:text-white transition-colors"
            style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
            <RotateCcw className="w-5 h-5"/>
          </button>

          <button onClick={() => setIsRunning(!isRunning)}
            className="w-16 h-16 rounded-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/30">
            {isRunning
              ? <Pause className="w-7 h-7 text-white"/>
              : <Play className="w-7 h-7 text-white ml-0.5"/>}
          </button>

          <button onClick={handleFinish}
            className="px-5 h-12 rounded-full text-sm font-black text-white transition-colors"
            style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#252525')}
            onMouseLeave={e => (e.currentTarget.style.background = '#1a1a1a')}>
            Finish Task
          </button>
        </div>
      </div>

      {/* Ambient sounds */}
      <div className="absolute bottom-5 right-5">
        {soundOpen && (
          <div className="absolute bottom-12 right-0 rounded-xl overflow-hidden shadow-2xl"
            style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', minWidth: 150 }}>
            {SOUNDS.map(s => (
              <button key={s} onClick={() => { setSound(sound === s ? null : s); setSoundOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${sound === s ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-white'}`}
                style={{ borderBottom: '1px solid #252525' }}>
                {s === 'Lo-fi' ? '🎵' : s === 'Rain' ? '🌧️' : s === 'White Noise' ? '〰️' : '🌲'} {s}
                {sound === s && ' ✓'}
              </button>
            ))}
          </div>
        )}
        <button onClick={() => setSoundOpen(!soundOpen)}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${sound ? 'text-blue-400' : 'text-slate-600 hover:text-slate-400'}`}
          style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
          <Headphones className="w-5 h-5"/>
        </button>
      </div>

      {sound && (
        <div className="absolute bottom-5 left-0 right-0 flex justify-center pointer-events-none">
          <span className="text-[10px] text-slate-600 font-bold">♪ {sound} playing</span>
        </div>
      )}
    </div>
  );
}
