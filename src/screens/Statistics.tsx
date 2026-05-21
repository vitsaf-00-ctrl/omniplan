import { useMemo } from 'react';
import { BarChart2, CheckCircle2, FileText, Download } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import { exportToExcel, exportToPDF } from '../utils/export';
import { addDays, format, startOfWeek } from 'date-fns';
import { uk } from 'date-fns/locale';

const TODAY = new Date();

const DOT: Record<string,string> = {
  blue:'#3b82f6', indigo:'#6366f1', purple:'#8b5cf6',
  emerald:'#10b981', amber:'#f59e0b', rose:'#ef4444', slate:'#94a3b8',
};

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function PieChart({ slices }: { slices: { label: string; value: number; color: string }[] }) {
  const total = slices.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div className="w-36 h-36 rounded-full bg-slate-100 dark:bg-slate-700 mx-auto"/>;

  let angle = 0;
  const paths = slices.map(s => {
    const start = angle;
    const sweep = (s.value / total) * 360;
    angle += sweep;
    if (sweep === 0) return null;
    const from = polarToXY(80, 80, 72, start);
    const to = polarToXY(80, 80, 72, angle);
    const large = sweep > 180 ? 1 : 0;
    return (
      <path key={s.label}
        d={`M 80 80 L ${from.x} ${from.y} A 72 72 0 ${large} 1 ${to.x} ${to.y} Z`}
        fill={s.color} stroke="white" strokeWidth="2"/>
    );
  });

  return (
    <svg viewBox="0 0 160 160" className="w-36 h-36">
      <circle cx="80" cy="80" r="72" fill="#f1f5f9" className="dark:fill-slate-700"/>
      {paths}
      <circle cx="80" cy="80" r="32" fill="white" className="dark:fill-slate-800"/>
      <text x="80" y="80" textAnchor="middle" dominantBaseline="middle" fontSize="13" fontWeight="900" fill="#4f46e5">{total}</text>
      <text x="80" y="94" textAnchor="middle" dominantBaseline="middle" fontSize="8" fill="#94a3b8">задач</text>
    </svg>
  );
}

function LineChart({ points }: { points: { label: string; total: number; done: number }[] }) {
  const maxY = Math.max(...points.map(p => p.total), 1);
  const W = 340, H = 100, pl = 8, pr = 8, pt = 8, pb = 24;
  const innerW = W - pl - pr;
  const innerH = H - pt - pb;

  const totalPts = points.map((p, i) => ({
    x: pl + (i / Math.max(points.length - 1, 1)) * innerW,
    y: pt + innerH - (p.total / maxY) * innerH,
  }));
  const donePts = points.map((p, i) => ({
    x: pl + (i / Math.max(points.length - 1, 1)) * innerW,
    y: pt + innerH - (p.done / maxY) * innerH,
  }));

  const line = (pts: {x:number;y:number}[]) => pts.map((p, i) => `${i===0?'M':'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const area = (pts: {x:number;y:number}[]) =>
    `${line(pts)} L ${pts[pts.length-1].x} ${pt+innerH} L ${pts[0].x} ${pt+innerH} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {[0, 0.5, 1].map(t => (
        <line key={t} x1={pl} y1={pt + innerH*(1-t)} x2={W-pr} y2={pt + innerH*(1-t)}
          stroke="#e2e8f0" strokeWidth="1" className="dark:stroke-slate-700"/>
      ))}
      <path d={area(totalPts)} fill="#6366f1" fillOpacity="0.08"/>
      <path d={line(totalPts)} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d={area(donePts)} fill="#10b981" fillOpacity="0.12"/>
      <path d={line(donePts)} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 2"/>
      {totalPts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="white" stroke="#6366f1" strokeWidth="2"/>
      ))}
      {points.map((p, i) => (
        <text key={i} x={totalPts[i].x} y={H - 6} textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="700">
          {p.label}
        </text>
      ))}
    </svg>
  );
}

export function Statistics() {
  const { tasks, getWeekStats } = useTaskStore();
  const stats = getWeekStats();

  const ws = useMemo(() => startOfWeek(TODAY, { weekStartsOn: 1 }), []);

  const weekPoints = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const day = addDays(ws, i);
      const dayTasks = tasks.filter(t => {
        const d = new Date(t.date);
        return !t.someday && d.toDateString() === day.toDateString();
      });
      return {
        label: format(day, 'EEE', { locale: uk }),
        total: dayTasks.length,
        done: dayTasks.filter(t => t.status === 'done').length,
      };
    }), [tasks, ws]);

  const projectSlices = useMemo(() => {
    const map: Record<string, { count: number; color: string }> = {};
    const nonSomeday = tasks.filter(t => !t.someday);
    nonSomeday.forEach(t => {
      if (!map[t.project]) map[t.project] = { count: 0, color: DOT[t.tagColor] || '#94a3b8' };
      map[t.project].count++;
    });
    return Object.entries(map)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 7)
      .map(([label, { count, color }]) => ({ label, value: count, color }));
  }, [tasks]);

  const weekDone = tasks.filter(t => {
    const d = new Date(t.date);
    const we = addDays(ws, 6);
    return !t.someday && d >= ws && d <= we && t.status === 'done';
  });

  const allSubtasks = tasks.flatMap(t => t.subtasks || []);
  const subDone = allSubtasks.filter(s => s.done).length;
  const subPct = allSubtasks.length > 0 ? Math.round((subDone / allSubtasks.length) * 100) : 0;

  const highPriority = tasks.filter(t => t.priority === 'high' && !t.someday).length;
  const deepWorkScore = Math.min(100, Math.round(stats.percentage * 0.6 + (highPriority > 0 ? Math.min(40, (tasks.filter(t => t.priority === 'high' && t.status === 'done').length / highPriority) * 40) : 20)));

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto pb-8 space-y-4">

        {/* Header + Export buttons */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-500"/>Статистика
            </h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Аналітика за поточний тиждень</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => exportToExcel(tasks.filter(t => !t.someday))}
              className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg transition-all">
              <Download className="w-3 h-3"/> Excel
            </button>
            <button onClick={() => exportToPDF(tasks.filter(t => !t.someday), stats)}
              className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-rose-500 hover:bg-rose-600 text-white px-3 py-2 rounded-lg transition-all">
              <FileText className="w-3 h-3"/> PDF
            </button>
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Всього задач', value: stats.total, color: 'text-indigo-600' },
            { label: 'Виконано', value: stats.done, color: 'text-emerald-600' },
            { label: 'Сьогодні', value: stats.dueToday, color: 'text-amber-600' },
            { label: 'Продуктивність', value: `${stats.percentage}%`, color: 'text-indigo-600' },
          ].map(k => (
            <div key={k.label} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 text-center shadow-sm">
              <p className={`text-2xl font-black ${k.color}`}>{k.value}</p>
              <p className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">{k.label}</p>
            </div>
          ))}
        </div>

        {/* Line chart */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-black text-slate-700 dark:text-white uppercase tracking-widest">Weekly Task Completion Trend</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Всього задач vs виконано по днях тижня</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
              <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-indigo-500 inline-block"/>Всього</span>
              <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-emerald-500 inline-block" style={{borderTop:'2px dashed'}}/>Виконано</span>
            </div>
          </div>
          <LineChart points={weekPoints}/>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pie chart */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
            <h3 className="text-xs font-black text-slate-700 dark:text-white uppercase tracking-widest mb-4">Tasks by Category</h3>
            <div className="flex items-center gap-4">
              <PieChart slices={projectSlices}/>
              <div className="flex-1 space-y-1.5">
                {projectSlices.map((s) => {
                  const total = projectSlices.reduce((a, b) => a + b.value, 0);
                  const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
                  return (
                    <div key={s.label} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }}/>
                      <span className="text-xs text-slate-600 dark:text-slate-300 truncate flex-1">{s.label}</span>
                      <span className="text-[10px] font-bold text-slate-400">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Productivity score */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
            <h3 className="text-xs font-black text-slate-700 dark:text-white uppercase tracking-widest mb-4">Productivity Score</h3>
            <div className="flex flex-col items-center justify-center h-32">
              <div className="text-5xl font-black text-indigo-600 mb-2">{deepWorkScore}%</div>
              <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-700"
                  style={{ width: `${deepWorkScore}%` }}/>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                {deepWorkScore >= 80 ? '🔥 Відмінно!' : deepWorkScore >= 60 ? '💪 Добре' : '📈 Можна краще'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-2.5 text-center">
                <p className="text-base font-black text-slate-800 dark:text-white">{subDone}/{allSubtasks.length}</p>
                <p className="text-[9px] text-slate-400 uppercase font-bold">Підзадачі</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-2.5 text-center">
                <p className="text-base font-black text-slate-800 dark:text-white">{subPct}%</p>
                <p className="text-[9px] text-slate-400 uppercase font-bold">Чекліст</p>
              </div>
            </div>
          </div>
        </div>

        {/* Top accomplishments */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <h3 className="text-xs font-black text-slate-700 dark:text-white uppercase tracking-widest mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500"/> Top Accomplishments цього тижня
          </h3>
          {weekDone.length === 0
            ? <p className="text-sm text-slate-400 text-center py-4">Ще немає виконаних задач цього тижня</p>
            : <div className="space-y-2">
              {weekDone.slice(0, 8).map(t => (
                <div key={t.id} className="flex items-center gap-3 py-1.5 border-b border-slate-50 dark:border-slate-700 last:border-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0"/>
                  <span className="flex-1 text-sm text-slate-700 dark:text-slate-200 font-medium truncate line-through decoration-slate-300">{t.title}</span>
                  <span className="text-[10px] text-slate-400 font-bold shrink-0">{t.project}</span>
                </div>
              ))}
            </div>
          }
        </div>

        {/* Checklist completion per project */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <h3 className="text-xs font-black text-slate-700 dark:text-white uppercase tracking-widest mb-3">Checklist Completion Rates</h3>
          <div className="space-y-3">
            {Object.entries(
              tasks.reduce<Record<string, { total: number; done: number; color: string }>>((acc, t) => {
                if (!t.subtasks?.length) return acc;
                if (!acc[t.project]) acc[t.project] = { total: 0, done: 0, color: DOT[t.tagColor] || '#94a3b8' };
                acc[t.project].total += t.subtasks.length;
                acc[t.project].done += t.subtasks.filter(s => s.done).length;
                return acc;
              }, {})
            ).map(([proj, { total, done, color }]) => {
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              return (
                <div key={proj}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{proj}</span>
                    <span className="text-[10px] text-slate-400 font-bold">{done}/{total} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }}/>
                  </div>
                </div>
              );
            })}
            {!tasks.some(t => (t.subtasks?.length ?? 0) > 0) &&
              <p className="text-sm text-slate-400 text-center py-3">Немає задач з підзадачами</p>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
