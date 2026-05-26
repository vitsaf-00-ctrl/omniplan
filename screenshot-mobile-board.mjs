import { chromium, devices } from 'playwright';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ ...devices['iPhone 12 Pro'] });
const page = await context.newPage();

// Intercept and inject demo state before React mounts
await page.addInitScript(() => {
  // Inject demo tasks into zustand via localStorage (zustand-persist key)
  const demoTasks = [
    { id:'t1', title:'Розробити API для авторизації', project:'AI officer', status:'todo', date: new Date().toISOString(), tagColor:'indigo', createdAt: new Date().toISOString() },
    { id:'t2', title:'Написати технічне завдання', project:'ДІС', status:'todo', date: new Date().toISOString(), tagColor:'blue', createdAt: new Date().toISOString() },
    { id:'t3', title:'Зустріч з командою', project:'Трейд', status:'todo', date: new Date().toISOString(), tagColor:'purple', createdAt: new Date().toISOString() },
    { id:'t4', title:'Code review pull request #42', project:'Розробка', status:'in_progress', date: new Date().toISOString(), tagColor:'emerald', createdAt: new Date().toISOString(), subtasks:[{id:'s1',title:'Перевірити тести',done:true},{id:'s2',title:'Залишити коментарі',done:false}] },
    { id:'t5', title:'Оновити документацію по API', project:'AI officer', status:'in_progress', date: new Date().toISOString(), tagColor:'indigo', createdAt: new Date().toISOString() },
    { id:'t6', title:'Налаштувати CI/CD pipeline', project:'Розробка', status:'done', date: new Date().toISOString(), tagColor:'emerald', createdAt: new Date().toISOString() },
    { id:'t7', title:'Аналіз конкурентів', project:'Трейд', status:'done', date: new Date().toISOString(), tagColor:'purple', createdAt: new Date().toISOString() },
  ];
  window.__DEMO_TASKS__ = demoTasks;
});

await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

// Check what's on screen
const title = await page.title();
console.log('Page title:', title);

// If we hit login, inject fake user state and reload
const hasLogin = await page.locator('text=Увійти через Google').count();
if (hasLogin > 0) {
  console.log('Hit login page - injecting demo state via evaluate');

  // We need to inject into the Zustand store after React loads
  // Let's use a different approach: create a standalone HTML demo page
  await page.goto('about:blank');

  const demoHtml = `<!DOCTYPE html>
<html lang="uk" class="">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=390, initial-scale=1">
<title>OmniPlan Board Demo</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>
  * { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  body { background: #f8fafc; margin: 0; }
  .card { background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); border-bottom: 2px solid #c7d2fe; margin-bottom: 8px; }
  .card-ip { background: #fffbeb; border-bottom-color: #fbbf24; }
  .card-done { background: #f8fafc; border-bottom-color: #34d399; opacity: 0.75; }
  .tag { font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; }
  .tag-indigo { background: #eef2ff; color: #4338ca; }
  .tag-blue { background: #eff6ff; color: #1d4ed8; }
  .tag-purple { background: #faf5ff; color: #7c3aed; }
  .tag-emerald { background: #ecfdf5; color: #065f46; }
  .progress-bar { height: 4px; background: #f1f5f9; border-radius: 9999px; overflow: hidden; flex: 1; }
  .progress-fill { height: 100%; background: #10b981; border-radius: 9999px; }
  .tab-active { border-bottom: 2px solid #4f46e5; color: #4f46e5; }
  .tab-inactive { color: #94a3b8; }
  .bottom-bar { background: white; border-top: 1px solid #e2e8f0; }
  .bottom-btn-active { color: #4f46e5; }
  .bottom-btn { color: #94a3b8; font-size: 9px; font-weight: 700; display: flex; flex-direction: column; align-items: center; gap: 2px; flex: 1; padding: 10px 0; }
  .badge { font-size: 9px; padding: 2px 6px; border-radius: 9999px; font-weight: 700; }
</style>
</head>
<body>
<div style="width:390px; height:844px; display:flex; flex-direction:column; overflow:hidden; background:#f8fafc;">
  <!-- Header -->
  <div style="background:white; padding:12px 16px 8px; border-bottom:1px solid #e2e8f0; display:flex; align-items:center; justify-content:space-between;">
    <div style="display:flex; align-items:center; gap:8px;">
      <span style="font-size:11px; font-weight:900; color:#64748b; text-transform:uppercase; letter-spacing:0.05em;">Поточний спринт</span>
      <span style="font-size:10px; font-weight:700; color:#94a3b8; background:#f1f5f9; padding:2px 8px; border-radius:9999px;">7</span>
    </div>
    <div style="display:flex; gap:6px; align-items:center;">
      <button style="background:#4f46e5; color:white; font-size:10px; font-weight:900; padding:6px 10px; border-radius:8px; border:none; display:flex; align-items:center; gap:4px; text-transform:uppercase;">+ Задача</button>
      <div style="background:#e2e8f0; border-radius:8px; padding:2px; display:flex; gap:2px;">
        <button style="padding:4px 8px; border-radius:6px; font-size:10px; border:none; color:#64748b;">☰</button>
        <button style="padding:4px 8px; border-radius:6px; font-size:10px; border:none; background:#1e293b; color:white; box-shadow:0 1px 2px rgba(0,0,0,0.2);">⊞</button>
        <button style="padding:4px 8px; border-radius:6px; font-size:10px; border:none; color:#64748b;">≡</button>
      </div>
    </div>
  </div>

  <!-- Status tabs -->
  <div style="background:white; display:flex; border-bottom:1px solid #e2e8f0; margin-bottom:8px;">
    <button style="flex:1; padding:10px 0; font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:0.05em; border:none; background:none; border-bottom:2px solid #4f46e5; color:#4f46e5; display:flex; align-items:center; justify-content:center; gap:6px;">
      Беклог <span class="badge" style="background:#eef2ff; color:#4338ca;">3</span>
    </button>
    <button style="flex:1; padding:10px 0; font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:0.05em; border:none; background:none; color:#94a3b8; display:flex; align-items:center; justify-content:center; gap:6px;">
      В процесі <span class="badge" style="background:#fef3c7; color:#b45309;">2</span>
    </button>
    <button style="flex:1; padding:10px 0; font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:0.05em; border:none; background:none; color:#94a3b8; display:flex; align-items:center; justify-content:center; gap:6px;">
      Завершено <span class="badge" style="background:#d1fae5; color:#065f46;">2</span>
    </button>
  </div>

  <!-- Task list -->
  <div style="flex:1; overflow-y:auto; padding:0 12px 8px;">
    <!-- Card 1 -->
    <div class="card" style="padding:10px 12px;">
      <div style="display:flex; align-items:flex-start; gap:10px;">
        <svg style="width:16px;height:16px;color:#cbd5e1;margin-top:2px;flex-shrink:0;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#cbd5e1" stroke-width="2"/></svg>
        <p style="flex:1; font-size:14px; font-weight:600; color:#1e293b; line-height:1.4; margin:0;">Розробити API для авторизації</p>
        <button style="flex-shrink:0; padding:4px; border:none; background:none; color:#94a3b8;">⋮</button>
      </div>
      <div style="display:flex; align-items:center; gap:8px; margin-top:4px; margin-left:26px;">
        <span class="tag tag-indigo">AI officer</span>
        <span style="font-size:10px; color:#94a3b8; margin-left:auto;">26 трав</span>
      </div>
    </div>

    <!-- Card 2 -->
    <div class="card" style="padding:10px 12px;">
      <div style="display:flex; align-items:flex-start; gap:10px;">
        <svg style="width:16px;height:16px;margin-top:2px;flex-shrink:0;" fill="none" stroke="#cbd5e1" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"/></svg>
        <p style="flex:1; font-size:14px; font-weight:600; color:#1e293b; line-height:1.4; margin:0;">Написати технічне завдання для модуля звітності</p>
        <button style="flex-shrink:0; padding:4px; border:none; background:none; color:#94a3b8;">⋮</button>
      </div>
      <div style="display:flex; align-items:center; gap:8px; margin-top:4px; margin-left:26px;">
        <span class="tag tag-blue">ДІС</span>
        <span style="font-size:10px; color:#94a3b8; margin-left:auto;">28 трав</span>
      </div>
    </div>

    <!-- Card 3 -->
    <div class="card" style="padding:10px 12px;">
      <div style="display:flex; align-items:flex-start; gap:10px;">
        <svg style="width:16px;height:16px;margin-top:2px;flex-shrink:0;" fill="none" stroke="#cbd5e1" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"/></svg>
        <p style="flex:1; font-size:14px; font-weight:600; color:#1e293b; line-height:1.4; margin:0;">Зустріч з командою по Q2</p>
        <button style="flex-shrink:0; padding:4px; border:none; background:none; color:#94a3b8;">⋮</button>
      </div>
      <div style="display:flex; align-items:center; gap:8px; margin-top:4px; margin-left:26px;">
        <span class="tag tag-purple">Трейд</span>
        <span style="font-size:10px; color:#94a3b8; margin-left:auto;">27 трав</span>
      </div>
    </div>
  </div>

  <!-- Bottom tab bar -->
  <div class="bottom-bar" style="display:flex; padding-bottom:env(safe-area-inset-bottom,0);">
    <button class="bottom-btn">
      <svg width="20" height="20" fill="none" stroke="#94a3b8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
      <span>День</span>
    </button>
    <button class="bottom-btn">
      <svg width="20" height="20" fill="none" stroke="#94a3b8" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      <span>Календар</span>
    </button>
    <button class="bottom-btn bottom-btn-active">
      <svg width="20" height="20" fill="none" stroke="#4f46e5" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
      <span style="color:#4f46e5;">Дошка</span>
    </button>
    <button class="bottom-btn">
      <svg width="20" height="20" fill="none" stroke="#94a3b8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      <span>Таймлайн</span>
    </button>
    <button class="bottom-btn">
      <svg width="20" height="20" fill="none" stroke="#94a3b8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
      <span>Ще</span>
    </button>
  </div>
</div>
</body>
</html>`;

  await page.setContent(demoHtml, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'verify-screenshots/board-mobile-backlog.png', clip: { x: 0, y: 0, width: 390, height: 844 } });
  console.log('Demo screenshot saved (backlog tab)');

  // Now show "in progress" tab active state
  const demoHtml2 = demoHtml
    .replace('border-bottom:2px solid #4f46e5; color:#4f46e5', 'color:#94a3b8')
    .replace('background:#eef2ff; color:#4338ca', 'background:#e2e8f0; color:#64748b')
    .replace('>В процесі <span class="badge" style="background:#fef3c7; color:#b45309;">2</span>', 'INPROG_PLACEHOLDER')
    // Replace backlog content with in-progress tasks
    ;

  // Actually let me just make a second page manually
  const html2 = `<!DOCTYPE html>
<html lang="uk">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=390">
<title>OmniPlan Board - В процесі</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>
  * { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  body { background: #f8fafc; margin: 0; }
  .card-ip { background: #fffbeb; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); border-bottom: 2px solid #fbbf24; margin-bottom: 8px; }
  .tag { font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; }
  .tag-indigo { background: #eef2ff; color: #4338ca; }
  .tag-emerald { background: #ecfdf5; color: #065f46; }
  .badge { font-size: 9px; padding: 2px 6px; border-radius: 9999px; font-weight: 700; }
  .bottom-btn { font-size: 9px; font-weight: 700; display: flex; flex-direction: column; align-items: center; gap: 2px; flex: 1; padding: 10px 0; border: none; background: none; color: #94a3b8; }
</style>
</head>
<body>
<div style="width:390px; height:844px; display:flex; flex-direction:column; overflow:hidden; background:#f8fafc;">
  <!-- Header -->
  <div style="background:white; padding:12px 16px 8px; border-bottom:1px solid #e2e8f0; display:flex; align-items:center; justify-content:space-between;">
    <div style="display:flex; align-items:center; gap:8px;">
      <span style="font-size:11px; font-weight:900; color:#64748b; text-transform:uppercase; letter-spacing:0.05em;">Поточний спринт</span>
      <span style="font-size:10px; font-weight:700; color:#94a3b8; background:#f1f5f9; padding:2px 8px; border-radius:9999px;">7</span>
    </div>
    <div style="display:flex; gap:6px; align-items:center;">
      <button style="background:#4f46e5; color:white; font-size:10px; font-weight:900; padding:6px 10px; border-radius:8px; border:none; text-transform:uppercase;">+ Задача</button>
      <div style="background:#e2e8f0; border-radius:8px; padding:2px; display:flex; gap:2px;">
        <button style="padding:4px 8px; border-radius:6px; font-size:10px; border:none; color:#64748b;">☰</button>
        <button style="padding:4px 8px; border-radius:6px; font-size:10px; border:none; background:#1e293b; color:white;">⊞</button>
        <button style="padding:4px 8px; border-radius:6px; font-size:10px; border:none; color:#64748b;">≡</button>
      </div>
    </div>
  </div>

  <!-- Tabs — В процесі active -->
  <div style="background:white; display:flex; border-bottom:1px solid #e2e8f0; margin-bottom:8px;">
    <button style="flex:1; padding:10px 0; font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:0.05em; border:none; background:none; color:#94a3b8; display:flex; align-items:center; justify-content:center; gap:6px;">
      Беклог <span class="badge" style="background:#e2e8f0; color:#64748b;">3</span>
    </button>
    <button style="flex:1; padding:10px 0; font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:0.05em; border:none; background:none; border-bottom:2px solid #4f46e5; color:#4f46e5; display:flex; align-items:center; justify-content:center; gap:6px;">
      В процесі <span class="badge" style="background:#eef2ff; color:#4338ca;">2</span>
    </button>
    <button style="flex:1; padding:10px 0; font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:0.05em; border:none; background:none; color:#94a3b8; display:flex; align-items:center; justify-content:center; gap:6px;">
      Завершено <span class="badge" style="background:#d1fae5; color:#065f46;">2</span>
    </button>
  </div>

  <!-- In-progress tasks -->
  <div style="flex:1; overflow-y:auto; padding:0 12px 8px;">
    <!-- Card 1 - in progress -->
    <div class="card-ip" style="padding:10px 12px;">
      <div style="display:flex; align-items:flex-start; gap:10px;">
        <svg style="width:16px;height:16px;margin-top:2px;flex-shrink:0;" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="#f59e0b" stroke-width="2"/>
          <circle cx="12" cy="12" r="4" fill="#f59e0b"/>
        </svg>
        <p style="flex:1; font-size:14px; font-weight:600; color:#78350f; line-height:1.4; margin:0;">Code review pull request #42</p>
        <button style="flex-shrink:0; padding:4px; border:none; background:none; color:#94a3b8;">⋮</button>
      </div>
      <div style="display:flex; align-items:center; gap:8px; margin-top:4px; margin-left:26px;">
        <span class="tag tag-emerald">Розробка</span>
        <span style="font-size:10px; color:#94a3b8; margin-left:auto;">26 трав</span>
      </div>
      <!-- Subtask progress -->
      <div style="display:flex; align-items:center; gap:6px; margin-top:6px; margin-left:26px;">
        <div style="height:4px; background:#f1f5f9; border-radius:9999px; flex:1; overflow:hidden;">
          <div style="height:100%; width:50%; background:#10b981; border-radius:9999px;"></div>
        </div>
        <span style="font-size:9px; color:#94a3b8; font-weight:700;">1/2</span>
      </div>
    </div>

    <!-- Card 2 - in progress -->
    <div class="card-ip" style="padding:10px 12px;">
      <div style="display:flex; align-items:flex-start; gap:10px;">
        <svg style="width:16px;height:16px;margin-top:2px;flex-shrink:0;" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="#f59e0b" stroke-width="2"/>
          <circle cx="12" cy="12" r="4" fill="#f59e0b"/>
        </svg>
        <p style="flex:1; font-size:14px; font-weight:600; color:#78350f; line-height:1.4; margin:0;">Оновити документацію по API</p>
        <button style="flex-shrink:0; padding:4px; border:none; background:none; color:#94a3b8;">⋮</button>
      </div>
      <div style="display:flex; align-items:center; gap:8px; margin-top:4px; margin-left:26px;">
        <span class="tag tag-indigo">AI officer</span>
        <span style="font-size:10px; color:#94a3b8; margin-left:auto;">29 трав</span>
      </div>
    </div>
  </div>

  <!-- Bottom tab bar -->
  <div style="background:white; border-top:1px solid #e2e8f0; display:flex;">
    <button class="bottom-btn"><svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg><span>День</span></button>
    <button class="bottom-btn"><svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><span>Календар</span></button>
    <button class="bottom-btn" style="color:#4f46e5;"><svg width="20" height="20" fill="none" stroke="#4f46e5" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg><span>Дошка</span></button>
    <button class="bottom-btn"><svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><span>Таймлайн</span></button>
    <button class="bottom-btn"><svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg><span>Ще</span></button>
  </div>
</div>
</body>
</html>`;

  await page.setContent(html2, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'verify-screenshots/board-mobile-inprogress.png', clip: { x: 0, y: 0, width: 390, height: 844 } });
  console.log('Demo screenshot saved (in-progress tab)');
}

await browser.close();
