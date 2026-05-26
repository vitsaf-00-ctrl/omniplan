import { chromium, devices } from 'playwright';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ ...devices['iPhone 12 Pro'] });
const page = await context.newPage();

// Today is Monday 26 травня 2026 → gradient: from-blue-600 to-indigo-600

const todayFull = `<!DOCTYPE html>
<html lang="uk">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=390">
<title>Today - Full header</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>
  * { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; box-sizing: border-box; }
  body { margin: 0; background: #f8fafc; }
</style>
</head>
<body>
<div style="width:390px; height:844px; display:flex; flex-direction:column; overflow:hidden; background:#f8fafc; padding:12px 12px 0;">

  <!-- Mobile hero: full state -->
  <div style="background: linear-gradient(135deg, #2563eb, #4f46e5); border-radius:12px; padding:12px 16px; margin-bottom:12px; color:white; flex-shrink:0;">
    <div style="display:flex; align-items:center; justify-content:space-between; gap:16px;">
      <div style="min-width:0;">
        <p style="font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; color:rgba(255,255,255,0.6); margin:0 0 2px; text-transform:capitalize;">понеділок</p>
        <h1 style="font-size:20px; font-weight:900; margin:0 0 2px; line-height:1.2;">Мій день</h1>
        <p style="font-size:12px; color:rgba(255,255,255,0.6); margin:0; text-transform:capitalize;">26 травня 2026 р.</p>
      </div>
      <div style="display:flex; gap:16px; flex-shrink:0;">
        <div style="text-align:center;">
          <p style="font-size:22px; font-weight:900; margin:0; line-height:1;">3<span style="font-size:13px; color:rgba(255,255,255,0.6); font-weight:700;">/8</span></p>
          <p style="font-size:9px; color:rgba(255,255,255,0.6); text-transform:uppercase; font-weight:700; margin:2px 0 0;">Виконано</p>
        </div>
        <div style="text-align:center;">
          <p style="font-size:22px; font-weight:900; margin:0; line-height:1;">38%</p>
          <p style="font-size:9px; color:rgba(255,255,255,0.6); text-transform:uppercase; font-weight:700; margin:2px 0 0;">Дня</p>
        </div>
      </div>
    </div>
  </div>

  <!-- QuickAddBar -->
  <div style="background:white; border-radius:10px; border:1px solid #e2e8f0; padding:8px 12px; margin-bottom:10px; display:flex; align-items:center; gap:8px; flex-shrink:0;">
    <svg width="16" height="16" fill="none" stroke="#94a3b8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
    <span style="font-size:13px; color:#94a3b8; flex:1;">Швидко додати задачу...</span>
  </div>

  <!-- Filter chips -->
  <div style="display:flex; gap:6px; margin-bottom:10px; flex-shrink:0; flex-wrap:wrap;">
    <button style="display:flex; align-items:center; gap:5px; font-size:11px; font-weight:700; padding:4px 10px; border-radius:9999px; background:#eef2ff; color:#4338ca; border:none;">
      <span style="width:6px;height:6px;border-radius:9999px;background:#818cf8;display:inline-block;"></span>AI officer
    </button>
    <button style="display:flex; align-items:center; gap:5px; font-size:11px; font-weight:700; padding:4px 10px; border-radius:9999px; background:#eff6ff; color:#1d4ed8; border:none;">
      <span style="width:6px;height:6px;border-radius:9999px;background:#60a5fa;display:inline-block;"></span>ДІС
    </button>
    <button style="display:flex; align-items:center; gap:5px; font-size:11px; font-weight:700; padding:4px 10px; border-radius:9999px; background:#faf5ff; color:#7c3aed; border:none;">
      <span style="width:6px;height:6px;border-radius:9999px;background:#c084fc;display:inline-block;"></span>Трейд
    </button>
    <div style="width:1px;height:16px;background:#e2e8f0;margin:0 2px;"></div>
    <button style="display:flex;align-items:center;gap:4px;font-size:11px;font-weight:700;padding:4px 8px;border-radius:9999px;background:#fff1f2;color:#e11d48;border:none;">
      <span style="width:6px;height:6px;border-radius:9999px;background:#f43f5e;display:inline-block;"></span>Висок.
    </button>
  </div>

  <!-- Scrollable task area -->
  <div style="flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:14px; padding-bottom:8px;">

    <!-- В процесі group -->
    <div>
      <p style="font-size:10px; font-weight:900; color:#d97706; text-transform:uppercase; letter-spacing:0.08em; margin:0 0 6px; display:flex; align-items:center; gap:5px;">
        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        В процесі (2)
      </p>
      <div style="background:#fffbeb; border:1px solid #fef3c7; border-radius:12px; padding:0 12px;">
        <!-- task row -->
        <div style="display:flex; align-items:center; gap:10px; padding:10px 0; border-bottom:1px solid #f1f5f9;">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" style="flex-shrink:0;"><circle cx="12" cy="12" r="10" stroke="#f59e0b" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="#f59e0b"/></svg>
          <div style="width:8px;height:8px;border-radius:9999px;background:#818cf8;flex-shrink:0;"></div>
          <div style="flex:1; min-width:0;">
            <p style="margin:0; font-size:14px; font-weight:600; color:#78350f; line-height:1.4;">Code review pull request #42</p>
            <p style="margin:2px 0 0; font-size:10px; color:#94a3b8;">✓ 1/2 підзадач</p>
          </div>
          <span style="font-size:10px; font-weight:700; padding:2px 8px; border-radius:9999px; background:#eef2ff; color:#4338ca; flex-shrink:0;">Розробка</span>
        </div>
        <!-- task row 2 -->
        <div style="display:flex; align-items:center; gap:10px; padding:10px 0;">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" style="flex-shrink:0;"><circle cx="12" cy="12" r="10" stroke="#f59e0b" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="#f59e0b"/></svg>
          <div style="width:8px;height:8px;border-radius:9999px;background:#818cf8;flex-shrink:0;"></div>
          <div style="flex:1; min-width:0;">
            <p style="margin:0; font-size:14px; font-weight:600; color:#78350f; line-height:1.4;">Оновити документацію по API v2</p>
          </div>
          <span style="font-size:10px; font-weight:700; padding:2px 8px; border-radius:9999px; background:#eef2ff; color:#4338ca; flex-shrink:0;">AI officer</span>
        </div>
      </div>
    </div>

    <!-- Заплановано group -->
    <div>
      <p style="font-size:10px; font-weight:900; color:#64748b; text-transform:uppercase; letter-spacing:0.08em; margin:0 0 6px;">Заплановано (3)</p>
      <div style="background:white; border:1px solid #f1f5f9; border-radius:12px; padding:0 12px;">
        <div style="display:flex; align-items:center; gap:10px; padding:10px 0; border-bottom:1px solid #f1f5f9;">
          <svg width="20" height="20" fill="none" stroke="#cbd5e1" viewBox="0 0 24 24" style="flex-shrink:0;"><circle cx="12" cy="12" r="10" stroke-width="2"/></svg>
          <div style="width:8px;height:8px;border-radius:9999px;background:#60a5fa;flex-shrink:0;"></div>
          <div style="width:6px;height:6px;border-radius:9999px;background:#f43f5e;flex-shrink:0;"></div>
          <div style="flex:1; min-width:0;">
            <p style="margin:0; font-size:14px; font-weight:600; color:#1e293b; line-height:1.4;">Написати технічне завдання для модуля звітності</p>
          </div>
          <span style="font-size:10px; font-weight:700; padding:2px 8px; border-radius:9999px; background:#eff6ff; color:#1d4ed8; flex-shrink:0;">ДІС</span>
        </div>
        <div style="display:flex; align-items:center; gap:10px; padding:10px 0; border-bottom:1px solid #f1f5f9;">
          <svg width="20" height="20" fill="none" stroke="#cbd5e1" viewBox="0 0 24 24" style="flex-shrink:0;"><circle cx="12" cy="12" r="10" stroke-width="2"/></svg>
          <div style="width:8px;height:8px;border-radius:9999px;background:#c084fc;flex-shrink:0;"></div>
          <p style="flex:1; margin:0; font-size:14px; font-weight:600; color:#1e293b;">Зустріч з командою по Q2</p>
          <span style="font-size:10px; font-weight:700; padding:2px 8px; border-radius:9999px; background:#faf5ff; color:#7c3aed; flex-shrink:0;">Трейд</span>
        </div>
        <div style="display:flex; align-items:center; gap:10px; padding:10px 0;">
          <svg width="20" height="20" fill="none" stroke="#cbd5e1" viewBox="0 0 24 24" style="flex-shrink:0;"><circle cx="12" cy="12" r="10" stroke-width="2"/></svg>
          <div style="width:8px;height:8px;border-radius:9999px;background:#818cf8;flex-shrink:0;"></div>
          <p style="flex:1; margin:0; font-size:14px; font-weight:600; color:#1e293b;">Розробити API для авторизації</p>
          <svg width="12" height="12" fill="none" stroke="#cbd5e1" viewBox="0 0 24 24" style="flex-shrink:0;"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
          <span style="font-size:10px; font-weight:700; padding:2px 8px; border-radius:9999px; background:#eef2ff; color:#4338ca; flex-shrink:0;">AI officer</span>
        </div>
      </div>
    </div>

    <!-- Виконано group -->
    <div>
      <p style="font-size:10px; font-weight:900; color:#059669; text-transform:uppercase; letter-spacing:0.08em; margin:0 0 6px; display:flex; align-items:center; gap:5px;">
        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        Виконано (3)
      </p>
      <div style="background:#f8fafc; border:1px solid #f1f5f9; border-radius:12px; padding:0 12px;">
        <div style="display:flex; align-items:center; gap:10px; padding:10px 0; border-bottom:1px solid #f1f5f9; opacity:0.7;">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" style="flex-shrink:0;"><circle cx="12" cy="12" r="10" fill="#10b981"/><path d="M8 12l3 3 5-5" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>
          <div style="width:8px;height:8px;border-radius:9999px;background:#60a5fa;flex-shrink:0;"></div>
          <p style="flex:1; margin:0; font-size:14px; font-weight:600; color:#94a3b8; text-decoration:line-through;">Налаштувати CI/CD pipeline</p>
          <span style="font-size:10px; font-weight:700; padding:2px 8px; border-radius:9999px; background:#ecfdf5; color:#065f46; flex-shrink:0;">Розробка</span>
        </div>
        <div style="display:flex; align-items:center; gap:10px; padding:10px 0; opacity:0.7;">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" style="flex-shrink:0;"><circle cx="12" cy="12" r="10" fill="#10b981"/><path d="M8 12l3 3 5-5" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>
          <div style="width:8px;height:8px;border-radius:9999px;background:#c084fc;flex-shrink:0;"></div>
          <p style="flex:1; margin:0; font-size:14px; font-weight:600; color:#94a3b8; text-decoration:line-through;">Аналіз конкурентів</p>
          <span style="font-size:10px; font-weight:700; padding:2px 8px; border-radius:9999px; background:#faf5ff; color:#7c3aed; flex-shrink:0;">Трейд</span>
        </div>
      </div>
    </div>

  </div>

  <!-- Bottom tab bar -->
  <div style="background:white; border-top:1px solid #e2e8f0; display:flex; flex-shrink:0; margin:0 -12px;">
    <button style="flex:1; display:flex; flex-direction:column; align-items:center; gap:2px; padding:10px 0; border:none; background:none; color:#4f46e5; position:relative;">
      <svg width="20" height="20" fill="none" stroke="#4f46e5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
      <span style="font-size:9px; font-weight:700;">День</span>
      <div style="position:absolute; bottom:0; width:32px; height:2px; background:#4f46e5; border-radius:2px 2px 0 0;"></div>
    </button>
    <button style="flex:1; display:flex; flex-direction:column; align-items:center; gap:2px; padding:10px 0; border:none; background:none; color:#94a3b8;">
      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      <span style="font-size:9px; font-weight:700;">Календар</span>
    </button>
    <button style="flex:1; display:flex; flex-direction:column; align-items:center; gap:2px; padding:10px 0; border:none; background:none; color:#94a3b8;">
      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
      <span style="font-size:9px; font-weight:700;">Дошка</span>
    </button>
    <button style="flex:1; display:flex; flex-direction:column; align-items:center; gap:2px; padding:10px 0; border:none; background:none; color:#94a3b8;">
      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      <span style="font-size:9px; font-weight:700;">Таймлайн</span>
    </button>
    <button style="flex:1; display:flex; flex-direction:column; align-items:center; gap:2px; padding:10px 0; border:none; background:none; color:#94a3b8;">
      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
      <span style="font-size:9px; font-weight:700;">Ще</span>
    </button>
  </div>
</div>
</body>
</html>`;

// Collapsed header state (after scrolling >50px)
const todayCollapsed = todayFull
  .replace(
    // Replace gradient hero with collapsed one-liner
    `  <!-- Mobile hero: full state -->
  <div style="background: linear-gradient(135deg, #2563eb, #4f46e5); border-radius:12px; padding:12px 16px; margin-bottom:12px; color:white; flex-shrink:0;">
    <div style="display:flex; align-items:center; justify-content:space-between; gap:16px;">
      <div style="min-width:0;">
        <p style="font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; color:rgba(255,255,255,0.6); margin:0 0 2px; text-transform:capitalize;">понеділок</p>
        <h1 style="font-size:20px; font-weight:900; margin:0 0 2px; line-height:1.2;">Мій день</h1>
        <p style="font-size:12px; color:rgba(255,255,255,0.6); margin:0; text-transform:capitalize;">26 травня 2026 р.</p>
      </div>
      <div style="display:flex; gap:16px; flex-shrink:0;">
        <div style="text-align:center;">
          <p style="font-size:22px; font-weight:900; margin:0; line-height:1;">3<span style="font-size:13px; color:rgba(255,255,255,0.6); font-weight:700;">/8</span></p>
          <p style="font-size:9px; color:rgba(255,255,255,0.6); text-transform:uppercase; font-weight:700; margin:2px 0 0;">Виконано</p>
        </div>
        <div style="text-align:center;">
          <p style="font-size:22px; font-weight:900; margin:0; line-height:1;">38%</p>
          <p style="font-size:9px; color:rgba(255,255,255,0.6); text-transform:uppercase; font-weight:700; margin:2px 0 0;">Дня</p>
        </div>
      </div>
    </div>
  </div>`,
    `  <!-- Mobile hero: COLLAPSED state -->
  <div style="background: linear-gradient(135deg, #2563eb, #4f46e5); border-radius:12px; padding:10px 16px; margin-bottom:12px; color:white; flex-shrink:0;">
    <div style="display:flex; align-items:center; justify-content:space-between;">
      <span style="font-size:14px; font-weight:600; text-transform:capitalize;">26 трав · понеділок</span>
      <span style="font-size:14px; font-weight:700;">8 завд. · 38%</span>
    </div>
  </div>`
  );

await page.setContent(todayFull, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(300);
await page.screenshot({ path: 'verify-screenshots/today-mobile-full.png', clip: { x: 0, y: 0, width: 390, height: 844 } });
console.log('Saved: today-mobile-full.png');

await page.setContent(todayCollapsed, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(300);
await page.screenshot({ path: 'verify-screenshots/today-mobile-collapsed.png', clip: { x: 0, y: 0, width: 390, height: 844 } });
console.log('Saved: today-mobile-collapsed.png');

await browser.close();
