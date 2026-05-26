import { chromium, devices } from 'playwright';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ ...devices['iPhone 12 Pro'] });
const page = await ctx.newPage();

const BOTTOM_BAR = `
  <div style="background:white; border-top:1px solid #e2e8f0; display:flex; flex-shrink:0; margin:0 -12px;">
    <button style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;padding:10px 0;border:none;background:none;color:#94a3b8;">
      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
      <span style="font-size:9px;font-weight:700;">День</span>
    </button>
    <button style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;padding:10px 0;border:none;background:none;color:#4f46e5;position:relative;">
      <svg width="20" height="20" fill="none" stroke="#4f46e5" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      <span style="font-size:9px;font-weight:700;color:#4f46e5;">Календар</span>
      <div style="position:absolute;bottom:0;width:32px;height:2px;background:#4f46e5;border-radius:2px 2px 0 0;"></div>
    </button>
    <button style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;padding:10px 0;border:none;background:none;color:#94a3b8;">
      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
      <span style="font-size:9px;font-weight:700;">Дошка</span>
    </button>
    <button style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;padding:10px 0;border:none;background:none;color:#94a3b8;">
      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      <span style="font-size:9px;font-weight:700;">Таймлайн</span>
    </button>
    <button style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;padding:10px 0;border:none;background:none;color:#94a3b8;">
      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
      <span style="font-size:9px;font-weight:700;">Ще</span>
    </button>
  </div>`;

const CAL_HEADER = (activeMode) => `
  <div style="background:#f8fafc;border-bottom:1px solid #f1f5f9;padding:8px 10px;display:flex;align-items:center;justify-content:space-between;gap:8px;flex-shrink:0;">
    <div style="display:flex;align-items:center;gap:4px;">
      <button style="padding:6px;border:none;background:none;color:#64748b;">‹</button>
      <button style="font-size:14px;font-weight:700;color:#1e293b;border:none;background:none;min-width:100px;text-align:center;">Травень 2026</button>
      <button style="padding:6px;border:none;background:none;color:#64748b;">›</button>
    </div>
    <div style="display:flex;align-items:center;gap:6px;">
      <div style="background:#e2e8f0;border-radius:8px;padding:2px;display:flex;gap:1px;">
        ${['М','Т','⏱','Д'].map((label, i) => {
          const modes = ['month','week','timeline','day'];
          const active = modes[i] === activeMode;
          return `<button style="padding:4px 7px;border-radius:6px;font-size:10px;font-weight:700;border:none;${active ? 'background:white;color:#4f46e5;box-shadow:0 1px 2px rgba(0,0,0,0.1);' : 'background:none;color:#64748b;'}">${label}</button>`;
        }).join('')}
      </div>
      <button style="background:#4f46e5;color:white;border:none;border-radius:8px;padding:6px 8px;font-size:10px;font-weight:900;">+</button>
    </div>
  </div>`;

// ── 1. MONTH VIEW ──────────────────────────────────────────────
const monthHtml = `<!DOCTYPE html><html lang="uk"><head><meta charset="UTF-8"><style>
* { font-family: -apple-system, BlinkMacSystemFont, sans-serif; box-sizing: border-box; margin:0; }
body { background:#f8fafc; }
.dot { width:10px;height:10px;border-radius:9999px;flex-shrink:0; }
</style></head><body>
<div style="width:390px;height:844px;display:flex;flex-direction:column;overflow:hidden;background:white;padding:12px 12px 0;">
  ${CAL_HEADER('month')}

  <!-- Month grid -->
  <div style="flex:1;overflow-y:auto;">
    <div style="display:grid;grid-template-columns:repeat(5,2fr) 1fr 1fr;width:100%;padding-bottom:64px;">
      <!-- Weekday headers -->
      ${['Пн','Вт','Ср','Чт','Пт','Сб','Нд'].map((d,i) => `
        <div style="text-align:center;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;border-bottom:1px solid #e2e8f0;border-right:1px solid #e2e8f0;${i>=5?'padding:4px;font-size:8px;color:#94a3b8;background:#f8fafc;':'padding:6px;font-size:9px;color:#64748b;background:#f8fafc;'}">${d}</div>
      `).join('')}

      <!-- Week 1: Apr 27 - May 3 (prev month, dimmed) -->
      ${[27,28,29,30].map(d=>`
        <div style="border-bottom:1px solid #e2e8f0;border-right:1px solid #e2e8f0;padding:6px;min-height:72px;opacity:0.35;">
          <span style="font-size:12px;font-weight:700;color:#64748b;width:20px;height:20px;display:flex;align-items:center;justify-content:center;border-radius:9999px;">${d}</span>
        </div>
      `).join('')}
      <div style="border-bottom:1px solid #e2e8f0;border-right:1px solid #e2e8f0;padding:4px;min-height:52px;opacity:0.35;background:#f8fafc;">
        <span style="font-size:10px;font-weight:700;color:#94a3b8;width:16px;height:16px;display:flex;align-items:center;justify-content:center;border-radius:9999px;">1</span>
      </div>
      <div style="border-bottom:1px solid #e2e8f0;border-right:1px solid #e2e8f0;padding:4px;min-height:52px;opacity:0.35;background:#f8fafc;">
        <span style="font-size:10px;font-weight:700;color:#94a3b8;width:16px;height:16px;display:flex;align-items:center;justify-content:center;border-radius:9999px;">2</span>
      </div>

      <!-- Week 2: May 4-10 -->
      ${[
        {d:4, dots:['bg-indigo-500','bg-blue-500']},
        {d:5, dots:['bg-purple-500']},
        {d:6, dots:['bg-emerald-500','bg-emerald-500','bg-amber-400']},
        {d:7, dots:[]},
        {d:8, dots:['bg-indigo-500']},
      ].map(({d,dots})=>`
        <div style="border-bottom:1px solid #e2e8f0;border-right:1px solid #e2e8f0;padding:6px;min-height:72px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <span style="font-size:12px;font-weight:700;color:#64748b;width:20px;height:20px;display:flex;align-items:center;justify-content:center;border-radius:9999px;">${d}</span>
            ${dots.length ? `<span style="font-size:9px;font-weight:900;color:#94a3b8;">${dots.length}</span>` : ''}
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:2px;">${dots.map(c=>`<div class="dot" style="background:${c.replace('bg-','').replace('-500','').replace('-400','')};${c.includes('indigo')?'background:#6366f1':c.includes('blue')?'background:#3b82f6':c.includes('purple')?'background:#a855f7':c.includes('emerald')?'background:#10b981':c.includes('amber')?'background:#fbbf24':'background:#94a3b8'}"></div>`).join('')}</div>
        </div>
      `).join('')}
      <div style="border-bottom:1px solid #e2e8f0;border-right:1px solid #e2e8f0;padding:4px;min-height:52px;background:#f8fafc;">
        <span style="font-size:10px;font-weight:700;color:#94a3b8;width:16px;height:16px;display:flex;align-items:center;justify-content:center;border-radius:9999px;">9</span>
      </div>
      <div style="border-bottom:1px solid #e2e8f0;border-right:1px solid #e2e8f0;padding:4px;min-height:52px;background:#f8fafc;">
        <span style="font-size:10px;font-weight:700;color:#94a3b8;width:16px;height:16px;display:flex;align-items:center;justify-content:center;border-radius:9999px;">10</span>
        <div style="display:flex;flex-wrap:wrap;gap:2px;margin-top:4px;"><div class="dot" style="background:#a855f7;"></div></div>
      </div>

      <!-- Week 3: May 11-17 -->
      ${[
        {d:11,dots:['#6366f1','#3b82f6']},
        {d:12,dots:['#10b981']},
        {d:13,dots:['#6366f1','#6366f1','#a855f7']},
        {d:14,dots:['#3b82f6']},
        {d:15,dots:['#10b981','#fbbf24']},
      ].map(({d,dots})=>`
        <div style="border-bottom:1px solid #e2e8f0;border-right:1px solid #e2e8f0;padding:6px;min-height:72px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <span style="font-size:12px;font-weight:700;color:#64748b;width:20px;height:20px;display:flex;align-items:center;justify-content:center;border-radius:9999px;">${d}</span>
            ${dots.length?`<span style="font-size:9px;font-weight:900;color:#94a3b8;">${dots.length}</span>`:''}
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:2px;">${dots.map(c=>`<div class="dot" style="background:${c};"></div>`).join('')}</div>
        </div>
      `).join('')}
      <div style="border-bottom:1px solid #e2e8f0;border-right:1px solid #e2e8f0;padding:4px;min-height:52px;background:#f8fafc;">
        <span style="font-size:10px;font-weight:700;color:#94a3b8;width:16px;height:16px;display:flex;align-items:center;justify-content:center;border-radius:9999px;">16</span>
      </div>
      <div style="border-bottom:1px solid #e2e8f0;border-right:1px solid #e2e8f0;padding:4px;min-height:52px;background:#f8fafc;">
        <span style="font-size:10px;font-weight:700;color:#94a3b8;width:16px;height:16px;display:flex;align-items:center;justify-content:center;border-radius:9999px;">17</span>
      </div>

      <!-- Week 4: May 18-24 -->
      ${[
        {d:18,dots:['#6366f1']},
        {d:19,dots:['#3b82f6','#10b981']},
        {d:20,dots:[]},
        {d:21,dots:['#a855f7','#6366f1']},
        {d:22,dots:['#f43f5e']},
      ].map(({d,dots})=>`
        <div style="border-bottom:1px solid #e2e8f0;border-right:1px solid #e2e8f0;padding:6px;min-height:72px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <span style="font-size:12px;font-weight:700;color:#64748b;width:20px;height:20px;display:flex;align-items:center;justify-content:center;border-radius:9999px;">${d}</span>
            ${dots.length?`<span style="font-size:9px;font-weight:900;color:#94a3b8;">${dots.length}</span>`:''}
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:2px;">${dots.map(c=>`<div class="dot" style="background:${c};"></div>`).join('')}</div>
        </div>
      `).join('')}
      <div style="border-bottom:1px solid #e2e8f0;border-right:1px solid #e2e8f0;padding:4px;min-height:52px;background:#f8fafc;">
        <span style="font-size:10px;font-weight:700;color:#94a3b8;width:16px;height:16px;display:flex;align-items:center;justify-content:center;border-radius:9999px;">23</span>
      </div>
      <div style="border-bottom:1px solid #e2e8f0;border-right:1px solid #e2e8f0;padding:4px;min-height:52px;background:#f8fafc;">
        <span style="font-size:10px;font-weight:700;color:#94a3b8;width:16px;height:16px;display:flex;align-items:center;justify-content:center;border-radius:9999px;">24</span>
        <div style="display:flex;flex-wrap:wrap;gap:2px;margin-top:4px;"><div class="dot" style="background:#6366f1;"></div></div>
      </div>

      <!-- Week 5: May 25-31 — TODAY is May 26 (Monday) -->
      <div style="border-bottom:1px solid #e2e8f0;border-right:1px solid #e2e8f0;padding:6px;min-height:72px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <span style="font-size:12px;font-weight:700;color:#64748b;width:20px;height:20px;display:flex;align-items:center;justify-content:center;border-radius:9999px;">25</span>
          <span style="font-size:9px;font-weight:900;color:#94a3b8;">2</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:2px;"><div class="dot" style="background:#6366f1;"></div><div class="dot" style="background:#10b981;"></div></div>
      </div>
      <!-- TODAY: May 26 — indigo ring -->
      <div style="border-bottom:1px solid #e2e8f0;border-right:1px solid #e2e8f0;padding:6px;min-height:72px;outline:2px solid #4f46e5;outline-offset:-2px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <span style="font-size:12px;font-weight:700;background:#4f46e5;color:white;width:20px;height:20px;display:flex;align-items:center;justify-content:center;border-radius:9999px;">26</span>
          <span style="font-size:9px;font-weight:900;color:#94a3b8;">5</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:2px;">
          <div class="dot" style="background:#6366f1;"></div>
          <div class="dot" style="background:#6366f1;"></div>
          <div class="dot" style="background:#3b82f6;"></div>
          <div class="dot" style="background:#a855f7;"></div>
          <div class="dot" style="background:#fbbf24;"></div>
        </div>
      </div>
      <div style="border-bottom:1px solid #e2e8f0;border-right:1px solid #e2e8f0;padding:6px;min-height:72px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <span style="font-size:12px;font-weight:700;color:#64748b;width:20px;height:20px;display:flex;align-items:center;justify-content:center;border-radius:9999px;">27</span>
          <span style="font-size:9px;font-weight:900;color:#94a3b8;">3</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:2px;"><div class="dot" style="background:#10b981;"></div><div class="dot" style="background:#6366f1;"></div><div class="dot" style="background:#f43f5e;"></div></div>
      </div>
      <div style="border-bottom:1px solid #e2e8f0;border-right:1px solid #e2e8f0;padding:6px;min-height:72px;">
        <span style="font-size:12px;font-weight:700;color:#64748b;width:20px;height:20px;display:flex;align-items:center;justify-content:center;border-radius:9999px;">28</span>
      </div>
      <div style="border-bottom:1px solid #e2e8f0;border-right:1px solid #e2e8f0;padding:6px;min-height:72px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <span style="font-size:12px;font-weight:700;color:#64748b;width:20px;height:20px;display:flex;align-items:center;justify-content:center;border-radius:9999px;">29</span>
          <span style="font-size:9px;font-weight:900;color:#94a3b8;">1</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:2px;"><div class="dot" style="background:#a855f7;"></div></div>
      </div>
      <div style="border-bottom:1px solid #e2e8f0;border-right:1px solid #e2e8f0;padding:4px;min-height:52px;background:#f8fafc;">
        <span style="font-size:10px;font-weight:700;color:#94a3b8;width:16px;height:16px;display:flex;align-items:center;justify-content:center;border-radius:9999px;">30</span>
      </div>
      <div style="border-bottom:1px solid #e2e8f0;border-right:1px solid #e2e8f0;padding:4px;min-height:52px;background:#f8fafc;">
        <span style="font-size:10px;font-weight:700;color:#94a3b8;width:16px;height:16px;display:flex;align-items:center;justify-content:center;border-radius:9999px;">31</span>
        <div style="display:flex;flex-wrap:wrap;gap:2px;margin-top:4px;"><div class="dot" style="background:#6366f1;"></div><div class="dot" style="background:#10b981;"></div></div>
      </div>
    </div>
  </div>
  ${BOTTOM_BAR}
</div></body></html>`;

// ── 2. WEEK VIEW ───────────────────────────────────────────────
const weekDays = [
  { name:'Понеділок', d:25, tasks:[{title:'Code review PR #42',color:'#6366f1',done:false},{title:'Оновити документацію',color:'#6366f1',done:true}] },
  { name:'Вівторок',  d:26, tasks:[{title:'Розробити API авторизації',color:'#6366f1',done:false},{title:'Написати ТЗ',color:'#3b82f6',done:false},{title:'Зустріч Q2',color:'#a855f7',done:false},{title:'CI/CD pipeline',color:'#10b981',done:true},{title:'Аналіз конкурентів',color:'#fbbf24',done:true}], today:true },
  { name:'Середа',    d:27, tasks:[{title:'Налаштувати Firestore',color:'#10b981',done:false},{title:'Дизайн-рев\'ю',color:'#6366f1',done:false},{title:'Презентація клієнту',color:'#f43f5e',done:false}] },
  { name:'Четвер',    d:28, tasks:[] },
  { name:'П\'ятниця', d:29, tasks:[{title:'Ретро спринту',color:'#a855f7',done:false}] },
  { name:'Субота',    d:30, tasks:[] },
  { name:'Неділя',    d:31, tasks:[{title:'Планування тижня',color:'#6366f1',done:false},{title:'Особисті цілі',color:'#10b981',done:false}] },
];

const weekHtml = `<!DOCTYPE html><html lang="uk"><head><meta charset="UTF-8"><style>
* { font-family:-apple-system,BlinkMacSystemFont,sans-serif;box-sizing:border-box;margin:0; }
body { background:#f8fafc; }
</style></head><body>
<div style="width:390px;height:844px;display:flex;flex-direction:column;overflow:hidden;background:white;padding:12px 12px 0;">
  ${CAL_HEADER('week')}
  <div style="flex:1;overflow-y:auto;padding-bottom:64px;">
    ${weekDays.map(day => `
      <div style="border-bottom:1px solid #e2e8f0;${day.today ? 'background:#eef2ff20;' : ''}">
        <div style="padding:10px 12px;display:flex;align-items:center;gap:8px;">
          <span style="font-size:14px;font-weight:900;text-transform:capitalize;${day.today ? 'color:#4f46e5;' : 'color:#1e293b;'}">${day.name}</span>
          <span style="font-size:24px;font-weight:900;${day.today ? 'color:#4f46e5;' : 'color:#cbd5e1;'}">${day.d}</span>
          ${day.tasks.length ? `<span style="font-size:12px;color:#94a3b8;margin-left:auto;">${day.tasks.length} завд.</span>` : ''}
        </div>
        <div style="padding:0 8px 8px;">
          ${day.tasks.map(t => `
            <div style="display:flex;align-items:center;gap:8px;padding:6px 4px;border-bottom:1px solid #f1f5f9;">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" style="flex-shrink:0;">
                ${t.done
                  ? `<circle cx="12" cy="12" r="10" fill="#10b981"/><path d="M8 12l3 3 5-5" stroke="white" stroke-width="2" stroke-linecap="round"/>`
                  : `<circle cx="12" cy="12" r="10" stroke="#cbd5e1" stroke-width="2"/>`}
              </svg>
              <div style="width:8px;height:8px;border-radius:9999px;background:${t.color};flex-shrink:0;"></div>
              <p style="font-size:13px;font-weight:500;flex:1;${t.done ? 'text-decoration:line-through;color:#94a3b8;' : 'color:#334155;'};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${t.title}</p>
            </div>
          `).join('')}
          ${day.tasks.length === 0 ? `<p style="font-size:12px;color:#cbd5e1;padding:4px 4px 4px 8px;">Немає задач</p>` : ''}
        </div>
      </div>
    `).join('')}
  </div>
  ${BOTTOM_BAR}
</div></body></html>`;

// ── 3. TIMELINE (mobile list) ──────────────────────────────────
const timelineHtml = `<!DOCTYPE html><html lang="uk"><head><meta charset="UTF-8"><style>
* { font-family:-apple-system,BlinkMacSystemFont,sans-serif;box-sizing:border-box;margin:0; }
body { background:#f8fafc; }
</style></head><body>
<div style="width:390px;height:844px;display:flex;flex-direction:column;overflow:hidden;background:white;padding:12px 12px 0;">
  ${CAL_HEADER('timeline')}

  <!-- Day nav inside timeline -->
  <div style="border-bottom:2px solid #e2e8f0;background:white;display:flex;align-items:center;justify-content:space-between;padding:12px 16px;flex-shrink:0;">
    <button style="padding:6px;border:none;background:#f1f5f9;border-radius:8px;color:#64748b;">‹</button>
    <div style="text-align:center;">
      <p style="font-size:14px;font-weight:900;color:#4f46e5;text-transform:capitalize;margin:0;">понеділок</p>
      <p style="font-size:12px;color:#94a3b8;margin:0;">26 травня 2026 р.</p>
    </div>
    <button style="padding:6px;border:none;background:#f1f5f9;border-radius:8px;color:#64748b;">›</button>
  </div>

  <!-- Add task -->
  <div style="flex:1;overflow-y:auto;padding-bottom:64px;">
    <button style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:#94a3b8;padding:10px 16px;border-bottom:1px solid #f1f5f9;width:100%;border-top:none;border-left:none;border-right:none;background:none;">
      + Додати задачу
    </button>

    <!-- Без часу section -->
    <div style="border-bottom:2px solid #94a3b8;background:#f1f5f9;padding:10px 16px;">
      <p style="font-size:9px;font-weight:900;color:#64748b;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;">Без часу</p>
      ${[
        {title:'Розробити API для авторизації', project:'AI officer', color:'#6366f1'},
        {title:'Написати ТЗ для модуля звітності', project:'ДІС', color:'#3b82f6'},
        {title:'Зустріч з командою по Q2', project:'Трейд', color:'#a855f7'},
      ].map(t=>`
        <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #e2e8f0;">
          <div style="width:10px;height:10px;border-radius:9999px;background:${t.color};flex-shrink:0;"></div>
          <div style="flex:1;min-width:0;">
            <p style="font-size:13px;font-weight:600;color:#1e293b;margin:0;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">${t.title}</p>
            <p style="font-size:12px;color:#94a3b8;margin:1px 0 0;">${t.project}</p>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- З часом section -->
    <div style="padding:10px 16px;">
      <p style="font-size:9px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;">З часом</p>
      ${[
        {time:'09:00', title:'Code review pull request #42', project:'Розробка', color:'#6366f1', done:false},
        {time:'11:30', title:'Оновити документацію по API v2', project:'AI officer', color:'#6366f1', done:false},
        {time:'14:00', title:'CI/CD pipeline налаштування', project:'Розробка', color:'#10b981', done:true},
        {time:'16:00', title:'Аналіз конкурентів', project:'Трейд', color:'#a855f7', done:true},
      ].map(t=>`
        <div style="display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid #f1f5f9;${t.done?'opacity:0.5;':''}">
          <span style="font-size:12px;font-weight:700;color:#94a3b8;width:40px;flex-shrink:0;padding-top:2px;font-variant-numeric:tabular-nums;">${t.time}</span>
          <div style="width:10px;height:10px;border-radius:9999px;background:${t.color};flex-shrink:0;margin-top:3px;"></div>
          <div style="flex:1;min-width:0;">
            <p style="font-size:13px;font-weight:600;color:#1e293b;margin:0;${t.done?'text-decoration:line-through;color:#94a3b8;':''}">${t.title}</p>
            <p style="font-size:12px;color:#94a3b8;margin:1px 0 0;">${t.project}</p>
          </div>
        </div>
      `).join('')}
    </div>
  </div>
  ${BOTTOM_BAR}
</div></body></html>`;

// Take all screenshots
const shots = [
  { html: monthHtml,    file: 'calendar-mobile-month.png' },
  { html: weekHtml,     file: 'calendar-mobile-week.png' },
  { html: timelineHtml, file: 'calendar-mobile-timeline.png' },
];

for (const { html, file } of shots) {
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(200);
  await page.screenshot({ path: `verify-screenshots/${file}`, clip: { x:0, y:0, width:390, height:844 } });
  console.log(`Saved: ${file}`);
}

await browser.close();
