import type { ProjectRecord, Task, TaskRepo } from './types.js';

/** In-memory TaskRepo for tests and local runs. */
export class MemoryRepo implements TaskRepo {
  tasks = new Map<string, Task>();
  constructor(public projects: ProjectRecord[] = [], tasks: Task[] = []) {
    for (const t of tasks) this.tasks.set(t.id, structuredClone(t));
  }
  async get(id: string) { const t = this.tasks.get(id); return t ? structuredClone(t) : null; }
  async listBetween(start: Date, end: Date) {
    return [...this.tasks.values()]
      .filter(t => new Date(t.date) >= start && new Date(t.date) < end)
      .map(t => structuredClone(t));
  }
  async listByParent(parentId: string) {
    return [...this.tasks.values()].filter(t => t.recurringParentId === parentId).map(t => structuredClone(t));
  }
  async listAll() { return [...this.tasks.values()].map(t => structuredClone(t)); }
  async put(task: Task) { this.tasks.set(task.id, structuredClone(task)); }
  async remove(id: string) { this.tasks.delete(id); }
  async listProjects() { return this.projects.map(p => ({ ...p })); }
}
