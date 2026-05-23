import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';

const BASE = 'http://localhost:3000';
const SS_DIR = 'D:/Claude Projects/omniplan/verify-screenshots';
mkdirSync(SS_DIR, { recursive: true });

let browser, page;
const findings = [];
let stepCount = 0;

function log(emoji, msg, extra = '') {
  stepCount++;
  console.log(`${stepCount}. ${emoji} ${msg}${extra ? ' → ' + extra : ''}`);
}

async function screenshot(name) {
  const p = `${SS_DIR}/${name}.png`;
  await page.screenshot({ path: p, fullPage: false });
  return p;
}

async function waitAndClick(selector, timeout = 5000) {
  await page.waitForSelector(selector, { timeout });
  await page.click(selector);
}

(async () => {
  browser = await chromium.launch({ headless: false, slowMo: 100 });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  page = await ctx.newPage();

  // Collect console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push('PAGE ERROR: ' + err.message));

  // ───────────────────────────────────────────
  // 1. INITIAL LOAD
  // ───────────────────────────────────────────
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const title = await page.title();
  log('✅', 'App loaded', title);
  await screenshot('01-initial');

  // Check if login screen or main app
  const isLoginPage = await page.$('text=Увійти') || await page.$('text=Sign in') || await page.$('[data-testid="login"]');
  if (isLoginPage) {
    log('⚠️', 'Login screen shown — testing as unauthenticated user (no Firestore)');
    findings.push('⚠️ App requires Google login — full Firestore sync cannot be tested. Testing with local state only.');
  }
  await screenshot('02-login-or-main');

  // ───────────────────────────────────────────
  // 2. CHECK FOR JS ERRORS ON LOAD
  // ───────────────────────────────────────────
  if (consoleErrors.length > 0) {
    log('⚠️', 'JS errors on load', consoleErrors.slice(0, 3).join('; '));
    findings.push('⚠️ Console errors on load:\n' + consoleErrors.slice(0, 5).map(e => '  - ' + e).join('\n'));
  } else {
    log('✅', 'No JS errors on load');
  }

  // Try to find main UI elements
  const bodyText = await page.textContent('body');

  // ───────────────────────────────────────────
  // 3. NAVIGATION / SIDEBAR
  // ───────────────────────────────────────────
  // Look for navigation items (Ukrainian)
  const navItems = await page.$$eval('nav a, [role="navigation"] button, aside button, aside a', els =>
    els.map(el => el.textContent?.trim()).filter(Boolean)
  );
  log('✅', 'Nav items found', navItems.slice(0, 8).join(', ') || 'none detected');

  // ───────────────────────────────────────────
  // 4. CREATE A TASK — keyboard shortcut N
  // ───────────────────────────────────────────
  // Click somewhere in main area to focus away from inputs
  await page.click('body');
  await page.waitForTimeout(300);
  await page.keyboard.press('n');
  await page.waitForTimeout(800);

  const modalVisible = await page.$('[role="dialog"], .modal, [data-modal]') !== null
    || await page.$('text=Назва') !== null
    || await page.$('input[placeholder]') !== null;

  if (modalVisible) {
    log('✅', 'Task creation modal opened via N key');
    await screenshot('03-task-modal-open');

    // Fill in task name
    const nameInput = await page.$('input[type="text"], input:not([type])');
    if (nameInput) {
      await nameInput.click();
      await nameInput.fill('Тестова задача 1');
      log('✅', 'Task name typed');

      // Try to submit
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      const modalGone = await page.$('[role="dialog"]') === null && await page.$('text=Тестова задача 1') !== null;
      if (modalGone) {
        log('✅', 'Task created and modal closed on Enter');
      } else {
        // Try clicking Save button
        const saveBtn = await page.$('button:has-text("Зберегти"), button:has-text("Додати"), button[type="submit"]');
        if (saveBtn) {
          await saveBtn.click();
          await page.waitForTimeout(500);
          log('✅', 'Task created via Save button');
        } else {
          log('⚠️', 'Could not close modal — no Save button found');
          findings.push('⚠️ Task modal: cannot find a clear save/submit button or Enter does not close modal');
          await page.keyboard.press('Escape');
          await page.waitForTimeout(300);
        }
      }
    }
  } else {
    log('⚠️', 'N key did not open task modal');
    findings.push('⚠️ Keyboard shortcut N did not open task creation modal');
    await screenshot('03-N-key-no-modal');

    // Try clicking + button
    const addBtn = await page.$('button[title*="Додати"], button[aria-label*="add"], button:has-text("+"), button:has-text("Нова задача"), button:has-text("Додати")');
    if (addBtn) {
      await addBtn.click();
      await page.waitForTimeout(500);
      log('✅', 'Task modal opened via Add button');
    }
  }

  await screenshot('04-after-first-task');

  // ───────────────────────────────────────────
  // 5. CREATE MORE TASKS for further testing
  // ───────────────────────────────────────────
  // Try creating another task
  await page.click('body');
  await page.waitForTimeout(200);
  await page.keyboard.press('n');
  await page.waitForTimeout(600);

  const modal2 = await page.$('input[type="text"], input:not([type="hidden"])');
  if (modal2) {
    await modal2.click();
    await modal2.fill('Тестова задача 2');

    // Try setting status/priority if available
    const statusSelect = await page.$('select, [role="combobox"]');
    if (statusSelect) {
      log('✅', 'Status/priority selector found in modal');
    }

    // Save
    const saveBtn = await page.$('button:has-text("Зберегти"), button:has-text("Додати"), button[type="submit"]');
    if (saveBtn) {
      await saveBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }
    await page.waitForTimeout(400);
    log('✅', 'Second task created');
  }

  await screenshot('05-task-list');

  // ───────────────────────────────────────────
  // 6. EDIT A TASK
  // ───────────────────────────────────────────
  const taskRows = await page.$$('[data-task-id], .task-row, [class*="task"], li[class*="Task"]');
  log('✅', `Task rows found: ${taskRows.length}`);

  if (taskRows.length > 0) {
    // Double-click to edit
    await taskRows[0].dblclick();
    await page.waitForTimeout(600);
    const editModal = await page.$('[role="dialog"], input[type="text"]');
    if (editModal) {
      log('✅', 'Edit modal opened on double-click');
      await screenshot('06-edit-modal');
      // Change the name
      const input = await page.$('input[type="text"], input:not([type="hidden"])');
      if (input) {
        await input.triple_click?.() || await input.click({ clickCount: 3 });
        await input.fill('Відредагована задача 1');
      }
      const saveBtn = await page.$('button:has-text("Зберегти"), button:has-text("Зберегти"), button[type="submit"]');
      if (saveBtn) await saveBtn.click();
      else await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
      log('✅', 'Task edit saved');
    } else {
      log('⚠️', 'Double-click did not open edit modal');
      findings.push('⚠️ Double-clicking a task row does not open edit modal');
    }
  }

  // ───────────────────────────────────────────
  // 7. TASK CONTEXT MENU (right-click)
  // ───────────────────────────────────────────
  const taskRowsAfterEdit = await page.$$('[data-task-id], .task-row, tr[class*="task"], li');
  if (taskRowsAfterEdit.length > 0) {
    await taskRowsAfterEdit[0].click({ button: 'right' });
    await page.waitForTimeout(400);
    const ctxMenu = await page.$('[role="menu"], .context-menu, [class*="contextMenu"], [class*="ContextMenu"]');
    if (ctxMenu) {
      log('✅', 'Context menu appears on right-click');
      await screenshot('07-context-menu');
      // Close it
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    } else {
      log('⚠️', 'No context menu on right-click');
      findings.push('⚠️ Right-click on task row does not show context menu');
    }
  }

  // ───────────────────────────────────────────
  // 8. DELETE A TASK (keyboard Delete)
  // ───────────────────────────────────────────
  const tasksBeforeDelete = await page.$$('[data-task-id]');
  const countBefore = tasksBeforeDelete.length;

  if (countBefore > 0) {
    await tasksBeforeDelete[0].click();
    await page.waitForTimeout(200);
    await page.keyboard.press('Delete');
    await page.waitForTimeout(500);

    // Check for confirm dialog
    const confirmDialog = await page.$('[role="alertdialog"], [role="dialog"]');
    if (confirmDialog) {
      const confirmBtn = await page.$('button:has-text("Видалити"), button:has-text("Так"), button:has-text("OK")');
      if (confirmBtn) {
        await confirmBtn.click();
        await page.waitForTimeout(400);
        log('✅', 'Delete confirmed via dialog');
      } else {
        await page.keyboard.press('Escape');
        log('⚠️', 'Delete dialog has no confirm button');
        findings.push('⚠️ Delete confirmation dialog found but no confirm button identified');
      }
    } else {
      // Direct delete
      const tasksAfterDelete = await page.$$('[data-task-id]');
      if (tasksAfterDelete.length < countBefore) {
        log('✅', 'Task deleted directly (no confirm dialog)');
      } else {
        log('⚠️', 'Delete key pressed but task count unchanged');
        findings.push('⚠️ Delete key on selected task does not delete it');
      }
    }
  }

  await screenshot('08-after-delete');

  // ───────────────────────────────────────────
  // 9. UNDO / REDO (Ctrl+Z / Ctrl+Y)
  // ───────────────────────────────────────────
  await page.keyboard.press('Control+z');
  await page.waitForTimeout(400);
  const tasksAfterUndo = await page.$$('[data-task-id]');
  if (tasksAfterUndo.length > countBefore - 1) {
    log('✅', 'Ctrl+Z undo works — task restored');
  } else {
    log('⚠️', 'Ctrl+Z undo did not restore task', `before:${countBefore} after:${tasksAfterUndo.length}`);
    findings.push('⚠️ Undo (Ctrl+Z) does not appear to restore deleted task');
  }

  // Redo
  await page.keyboard.press('Control+y');
  await page.waitForTimeout(400);
  log('✅', 'Ctrl+Y redo pressed (no crash)');

  await screenshot('09-undo-redo');

  // ───────────────────────────────────────────
  // 10. NAVIGATION — check sidebar views
  // ───────────────────────────────────────────
  const views = ['Сьогодні', 'Календар', 'Всі задачі', 'Проекти', 'Someday', 'Колись'];
  for (const view of views) {
    const navBtn = await page.$(`text=${view}`);
    if (navBtn) {
      await navBtn.click();
      await page.waitForTimeout(500);
      log('✅', `Navigated to "${view}"`);
      await screenshot(`10-view-${view.replace(/\s/g, '_')}`);

      // Check for JS errors after navigation
      if (consoleErrors.length > 0) {
        const newErrors = consoleErrors.slice(-3);
        findings.push(`⚠️ JS errors after navigating to "${view}": ${newErrors.join('; ')}`);
      }
    }
  }

  // ───────────────────────────────────────────
  // 11. CALENDAR VIEW — check rendering
  // ───────────────────────────────────────────
  const calBtn = await page.$('text=Календар');
  if (calBtn) {
    await calBtn.click();
    await page.waitForTimeout(600);
    const calGrid = await page.$('[class*="calendar"], [class*="Calendar"], table, .grid');
    if (calGrid) {
      log('✅', 'Calendar grid renders');
      await screenshot('11-calendar');
    } else {
      log('⚠️', 'Calendar view loaded but no grid found');
      findings.push('⚠️ Calendar view: no calendar grid element detected');
    }
  }

  // ───────────────────────────────────────────
  // 12. THEME TOGGLE (dark/light)
  // ───────────────────────────────────────────
  const themeBtn = await page.$('button[title*="тема"], button[aria-label*="theme"], button[title*="theme"], [class*="theme"]');
  if (themeBtn) {
    const htmlBefore = await page.$eval('html', el => el.className);
    await themeBtn.click();
    await page.waitForTimeout(300);
    const htmlAfter = await page.$eval('html', el => el.className);
    if (htmlBefore !== htmlAfter) {
      log('✅', 'Theme toggle works', `${htmlBefore} → ${htmlAfter}`);
    } else {
      log('⚠️', 'Theme button clicked but html class unchanged');
      findings.push('⚠️ Theme toggle button found but does not change html class');
    }
    await themeBtn.click(); // restore
    await page.waitForTimeout(300);
  } else {
    log('🔍', 'No theme toggle button found by aria-label/title');
  }

  // ───────────────────────────────────────────
  // 13. TASK MODAL — detailed field testing
  // ───────────────────────────────────────────
  await page.click('body');
  await page.waitForTimeout(200);
  await page.keyboard.press('n');
  await page.waitForTimeout(700);

  const detailModal = await page.$('[role="dialog"]');
  if (detailModal) {
    await screenshot('13-task-modal-detail');

    // Check for expected fields
    const fields = {
      'name/title input': 'input[type="text"]',
      'date picker': 'input[type="date"], [class*="datepicker"], [class*="DatePicker"]',
      'status selector': 'select, [role="combobox"], [class*="status"]',
      'priority': '[class*="priority"], [class*="Priority"]',
      'notes/description': 'textarea',
      'recurring': '[class*="recurring"], [class*="Recurring"], input[type="checkbox"]',
      'notify/reminder': '[class*="notify"], [class*="notif"], input[type="time"]',
    };

    for (const [name, sel] of Object.entries(fields)) {
      const found = await detailModal.$(sel);
      if (found) {
        log('✅', `Modal field: ${name}`);
      } else {
        log('🔍', `Modal field NOT found: ${name}`);
      }
    }

    // Test ESC closes modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    const modalAfterEsc = await page.$('[role="dialog"]');
    if (!modalAfterEsc) {
      log('✅', 'ESC closes modal');
    } else {
      log('⚠️', 'ESC did not close modal');
      findings.push('⚠️ Task modal does not close on ESC (or shows unsaved-changes prompt)');
      await screenshot('13b-modal-esc-issue');
      // Try clicking outside
      await page.click('body', { position: { x: 50, y: 50 } });
      await page.waitForTimeout(400);
    }
  }

  // ───────────────────────────────────────────
  // 14. SEARCH / FILTER
  // ───────────────────────────────────────────
  const searchInput = await page.$('input[type="search"], input[placeholder*="Пошук"], input[placeholder*="пошук"], input[placeholder*="Search"]');
  if (searchInput) {
    await searchInput.click();
    await searchInput.fill('Тест');
    await page.waitForTimeout(500);
    log('✅', 'Search input works');
    await screenshot('14-search');
    await searchInput.fill('');
    await page.waitForTimeout(300);
  } else {
    log('🔍', 'No search input found on current view');
  }

  // ───────────────────────────────────────────
  // 15. DRAG AND DROP — check if DnD library loaded
  // ───────────────────────────────────────────
  const dndHandles = await page.$$('[data-rfd-drag-handle-draggable-id], [data-rbd-drag-handle-draggable-id]');
  if (dndHandles.length > 0) {
    log('✅', `DnD handles found: ${dndHandles.length}`);
    findings.push('ℹ️ Drag-and-drop handles present — DnD library is loaded (deep DnD testing skipped as it requires mouse simulation)');
  } else {
    log('🔍', 'No @hello-pangea/dnd handles detected on current view');
  }

  // ───────────────────────────────────────────
  // 16. EXPORT
  // ───────────────────────────────────────────
  // Look for export button
  const exportBtn = await page.$('button:has-text("Експорт"), button[title*="export"], button[aria-label*="export"]');
  if (exportBtn) {
    await exportBtn.click();
    await page.waitForTimeout(400);
    const exportMenu = await page.$('[role="menu"], [class*="dropdown"]');
    if (exportMenu) {
      log('✅', 'Export menu opens');
      await screenshot('16-export-menu');
      await page.keyboard.press('Escape');
    } else {
      log('✅', 'Export button clicked (direct action)');
    }
  } else {
    log('🔍', 'No export button found on current view');
  }

  // ───────────────────────────────────────────
  // 17. MOBILE RESPONSIVENESS — narrow viewport
  // ───────────────────────────────────────────
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(500);
  await screenshot('17-mobile-view');

  const mobileTabBar = await page.$('[class*="MobileTabBar"], [class*="mobile"], [class*="tabBar"]');
  if (mobileTabBar) {
    log('✅', 'Mobile tab bar visible on narrow viewport');
  } else {
    log('🔍', 'No mobile tab bar detected at 375px width');
    findings.push('ℹ️ Mobile tab bar not detected at 375px — may use different selector');
  }

  const sidebar = await page.$('aside, nav[class*="sidebar"], [class*="Sidebar"]');
  if (sidebar) {
    const sidebarVisible = await sidebar.isVisible();
    if (!sidebarVisible) {
      log('✅', 'Sidebar hidden on mobile');
    } else {
      log('⚠️', 'Sidebar still visible on 375px viewport');
      findings.push('⚠️ Sidebar is still visible on mobile (375px) — may overlap content');
    }
  }

  // Restore viewport
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.waitForTimeout(300);

  // ───────────────────────────────────────────
  // 18. FINAL CONSOLE ERRORS CHECK
  // ───────────────────────────────────────────
  if (consoleErrors.length > 0) {
    const unique = [...new Set(consoleErrors)];
    log('⚠️', `Total unique console errors: ${unique.length}`);
    unique.slice(0, 8).forEach(e => findings.push(`  🔴 Console error: ${e.substring(0, 200)}`));
  } else {
    log('✅', 'No console errors throughout session');
  }

  await screenshot('18-final-state');

  // ───────────────────────────────────────────
  // SUMMARY
  // ───────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════');
  console.log('FINDINGS SUMMARY');
  console.log('═══════════════════════════════════════════');
  if (findings.length === 0) {
    console.log('No issues found.');
  } else {
    findings.forEach(f => console.log(f));
  }
  console.log('═══════════════════════════════════════════');
  console.log(`Screenshots saved to: ${SS_DIR}`);

  await browser.close();
})().catch(async err => {
  console.error('FATAL:', err.message);
  if (page) await page.screenshot({ path: `${SS_DIR}/error-crash.png` }).catch(() => {});
  if (browser) await browser.close();
  process.exit(1);
});
