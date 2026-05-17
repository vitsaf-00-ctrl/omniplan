import * as XLSX from 'xlsx';
import { Task } from '../store/useTaskStore';

export function exportToExcel(tasks: Task[]) {
  const data = tasks.map(t => ({
    'Назва': t.title,
    'Проєкт': t.project,
    'Статус': t.status === 'done' ? 'Готово' : t.status === 'in_progress' ? 'В процесі' : 'Заплановано',
    'Дата': new Date(t.date).toLocaleDateString('uk-UA'),
    'Час': t.time || t.reminderTime || '',
    'Пріоритет': t.priority === 'high' ? 'Високий' : t.priority === 'medium' ? 'Середній' : t.priority === 'low' ? 'Низький' : '',
    'Підзадачі': t.subtasks ? `${t.subtasks.filter(s => s.done).length}/${t.subtasks.length}` : '',
    'Нотатки': t.notes || '',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [
    { wch: 35 }, { wch: 15 }, { wch: 15 }, { wch: 12 },
    { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 30 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Задачі');
  XLSX.writeFile(wb, 'omniplan-tasks.xlsx');
}

export function exportToPDF(tasks: Task[], stats: { total: number; done: number; percentage: number; dueToday: number }) {
  const win = window.open('', '_blank');
  if (!win) return;

  const rows = tasks.map(t => `
    <tr>
      <td>${t.title}</td>
      <td>${t.project}</td>
      <td>${t.status === 'done' ? '✓ Готово' : t.status === 'in_progress' ? '◔ В процесі' : '○ Заплановано'}</td>
      <td>${new Date(t.date).toLocaleDateString('uk-UA')}</td>
      <td>${t.priority === 'high' ? '🔴 Вис.' : t.priority === 'medium' ? '🟡 Сер.' : t.priority === 'low' ? '🔵 Низ.' : '—'}</td>
      <td>${t.subtasks ? `${t.subtasks.filter(s => s.done).length}/${t.subtasks.length}` : '—'}</td>
    </tr>`).join('');

  win.document.write(`<!DOCTYPE html><html><head><title>OmniPlan — Звіт</title><style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,sans-serif;padding:32px;color:#1e293b;font-size:13px}
    h1{color:#4f46e5;font-size:22px;margin-bottom:4px}
    .subtitle{color:#94a3b8;font-size:11px;margin-bottom:24px}
    .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}
    .stat{background:#f8fafc;border-radius:10px;padding:14px;text-align:center;border:1px solid #e2e8f0}
    .stat-num{font-size:26px;font-weight:900;color:#4f46e5}
    .stat-label{font-size:10px;color:#94a3b8;text-transform:uppercase;font-weight:700;margin-top:2px}
    table{width:100%;border-collapse:collapse}
    th{background:#f1f5f9;padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase;color:#64748b;font-weight:700}
    td{padding:8px 10px;border-bottom:1px solid #f1f5f9;font-size:12px}
    tr:hover td{background:#fafafa}
    @media print{body{padding:16px}}
  </style></head><body>
    <h1>OmniPlan</h1>
    <div class="subtitle">Звіт по задачах • ${new Date().toLocaleDateString('uk-UA', {weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div>
    <div class="stats">
      <div class="stat"><div class="stat-num">${stats.total}</div><div class="stat-label">Всього задач</div></div>
      <div class="stat"><div class="stat-num">${stats.done}</div><div class="stat-label">Виконано</div></div>
      <div class="stat"><div class="stat-num">${stats.percentage}%</div><div class="stat-label">Виконання</div></div>
      <div class="stat"><div class="stat-num">${stats.dueToday}</div><div class="stat-label">Сьогодні</div></div>
    </div>
    <table>
      <thead><tr><th>Назва</th><th>Проєкт</th><th>Статус</th><th>Дата</th><th>Пріоритет</th><th>Підзадачі</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </body></html>`);
  win.document.close();
  win.print();
}
