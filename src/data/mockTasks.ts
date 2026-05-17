export interface Task {
  id: string;
  title: string;
  project: string;
  status: 'todo' | 'in_progress' | 'done';
  date: Date;
  tagColor: string;
  assignee?: string;
  checkTotal?: number;
  checkDone?: number;
}

export const MOCK_TASKS: Task[] = [
  // Monday, May 11
  { id: 'm1', title: 'Прибрати ціни', project: 'ДІС', status: 'done', date: new Date(2026, 4, 11), tagColor: 'blue' },
  { id: 'm2', title: 'Прибрати ціни', project: 'Трейд', status: 'done', date: new Date(2026, 4, 11), tagColor: 'purple' },
  { id: 'm3', title: 'SMM stories', project: 'ДІС', status: 'done', date: new Date(2026, 4, 11), tagColor: 'blue' },
  { id: 'm4', title: 'SMM post', project: 'ДІС', status: 'done', date: new Date(2026, 4, 11), tagColor: 'blue' },
  { id: 'm5', title: 'Міроненко закупки: підготовити', project: 'AI officer', status: 'done', date: new Date(2026, 4, 11), tagColor: 'indigo' },
  { id: 'm6', title: 'Залишки Аутлет: додавати', project: 'ДІС', status: 'done', date: new Date(2026, 4, 11), tagColor: 'blue' },
  
  // Tuesday, May 12
  { id: 't1', title: 'SMM stories', project: 'ДІС', status: 'done', date: new Date(2026, 4, 12), tagColor: 'blue' },
  { id: 't2', title: 'Товари дня', project: 'ДІС', status: 'done', date: new Date(2026, 4, 12), tagColor: 'blue' },
  { id: 't3', title: 'Міроненко закупки: підготовити', project: 'AI officer', status: 'done', date: new Date(2026, 4, 12), tagColor: 'indigo' },
  { id: 't4', title: 'ЛавЮ додати товари: тестити', project: 'ДІС', status: 'done', date: new Date(2026, 4, 12), tagColor: 'blue' },
  { id: 't5', title: 'Поповнити рахунок', project: 'Орлі', status: 'done', date: new Date(2026, 4, 12), tagColor: 'amber' },
  { id: 't6', title: 'Навчання RD', project: 'Навчання', status: 'done', date: new Date(2026, 4, 12), tagColor: 'purple' },

  // Wednesday, May 13
  { id: 'w1', title: 'SMM stories', project: 'ДІС', status: 'done', date: new Date(2026, 4, 13), tagColor: 'blue' },
  { id: 'w2', title: 'SMM post', project: 'ДІС', status: 'done', date: new Date(2026, 4, 13), tagColor: 'blue' },
  { id: 'w3', title: 'Товари дня', project: 'ДІС', status: 'done', date: new Date(2026, 4, 13), tagColor: 'blue' },
  { id: 'w4', title: 'Коментарі на сайт', project: 'ДІС', status: 'done', date: new Date(2026, 4, 13), tagColor: 'blue' },
  { id: 'w5', title: 'Відео створити', project: 'Моє', status: 'done', date: new Date(2026, 4, 13), tagColor: 'emerald' },

  // Thursday, May 14
  { id: 'th1', title: 'SMM stories', project: 'ДІС', status: 'done', date: new Date(2026, 4, 14), tagColor: 'blue' },
  { id: 'th2', title: 'Коментарі на сайт', project: 'ДІС', status: 'done', date: new Date(2026, 4, 14), tagColor: 'blue' },
  { id: 'th3', title: 'Товари дня', project: 'ДІС', status: 'done', date: new Date(2026, 4, 14), tagColor: 'blue' },
  { id: 'th4', title: 'ЛавЮ додати товари', project: 'ДІС', status: 'done', date: new Date(2026, 4, 14), tagColor: 'blue' },
  { id: 'th5', title: 'Обновить n8n', project: 'Розробка', status: 'todo', date: new Date(2026, 4, 14), tagColor: 'indigo' },
  { id: 'th6', title: 'Антигравіті вчити', project: 'Навчання', status: 'todo', date: new Date(2026, 4, 14), tagColor: 'purple' },
  { id: 'th7', title: 'Створити дашборд Digital', project: 'ДІС', status: 'todo', date: new Date(2026, 4, 14), tagColor: 'blue' },
  { id: 'th8', title: 'Відібрати наступні пілоти', project: 'AI officer', status: 'todo', date: new Date(2026, 4, 14), tagColor: 'indigo' },
  { id: 'th9', title: 'Тестити Claude', project: 'AI officer', status: 'todo', date: new Date(2026, 4, 14), tagColor: 'indigo' },
  { id: 'th10', title: 'Навчання RD', project: 'Навчання', status: 'todo', date: new Date(2026, 4, 14), tagColor: 'purple' },
  
  // Later dates
  { id: '15_1', title: 'Розробка ТЗ нагадувань', project: 'Хайфом', status: 'todo', date: new Date(2026, 4, 15), tagColor: 'blue' },
  
  // Monday, May 18 - Several tasks for month view demo
  { id: 'm18_1', title: 'Vocabulary поповнити чи закрити', project: 'AI officer', status: 'todo', date: new Date(2026, 4, 18), tagColor: 'indigo' },
  { id: 'm18_2', title: 'SMM stories: планування на тиждень', project: 'ДІС', status: 'todo', date: new Date(2026, 4, 18), tagColor: 'blue' },
  { id: 'm18_3', title: 'Аналіз продажів за вихідні', project: 'Трейд', status: 'todo', date: new Date(2026, 4, 18), tagColor: 'purple' },
  { id: 'm18_4', title: 'Оновлення цін на сайті', project: 'ДІС', status: 'done', date: new Date(2026, 4, 18), tagColor: 'blue' },
  { id: 'm18_5', title: 'Колл по проєкту Хайфом', project: 'Хайфом', status: 'todo', date: new Date(2026, 4, 18), tagColor: 'blue' },
  { id: 'm18_6', title: 'Підготовка звіту для інвесторів', project: 'ACAT', status: 'todo', date: new Date(2026, 4, 18), tagColor: 'emerald' },

  { id: '20_1', title: 'Оптимізація Firestore', project: 'ACAT', status: 'in_progress', date: new Date(2026, 4, 20), tagColor: 'blue' },
  { id: '22_1', title: 'Демо для клієнта', project: 'Трейд', status: 'todo', date: new Date(2026, 4, 22), tagColor: 'purple' },
  { id: '25_1', title: 'Vocabulary перевірка', project: 'AI officer', status: 'todo', date: new Date(2026, 4, 25), tagColor: 'indigo' },
];
