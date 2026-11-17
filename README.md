# OmniPlan

Персональний планувальник задач: Мій день, Календар (місяць / тиждень / таймлайн / день),
Дошка, Мої завдання, Статистика, Фокус-режим, повторювані задачі, Quick Add з парсером
української мови.

**Stack:** React 19 · TypeScript · Vite · Tailwind v4 · Zustand · Firebase Auth + Firestore · Vercel

## Запуск локально

```bash
npm install
npm run dev        # http://localhost:3000
```

## Перевірки

```bash
npm run lint         # TypeScript
npm run lint:eslint  # ESLint
npm test             # Vitest
npm run build        # production build
```

Деплой: кожен push у `main` автоматично деплоїться на Vercel.

## ШІ-асистенти (Claude, ChatGPT)

`/api/mcp` — MCP-сервер: асистент може переглядати, створювати, змінювати й закривати задачі.
Токен і інструкції — у застосунку: **Налаштування → Інтеграції**.

Одноразово на Vercel додайте змінну `FIREBASE_SERVICE_ACCOUNT` (вміст JSON-ключа сервісного акаунта
Firebase: Project settings → Service accounts → Generate new private key) і зробіть Redeploy.
