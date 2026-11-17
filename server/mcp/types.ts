import type { Task, TagColor } from '../../src/store/useTaskStore';

export type { Task, TagColor };
export type { TaskStatus, Priority, SubTask } from '../../src/store/useTaskStore';

export interface ProjectRecord { id: string; name: string; color: TagColor }

/** Storage for one user's tasks. Firestore in production, in-memory in tests. */
export interface TaskRepo {
  get(id: string): Promise<Task | null>;
  /** Tasks whose date is in [start, end). */
  listBetween(start: Date, end: Date): Promise<Task[]>;
  listByParent(parentId: string): Promise<Task[]>;
  listAll(): Promise<Task[]>;
  put(task: Task): Promise<void>;
  remove(id: string): Promise<void>;
  listProjects(): Promise<ProjectRecord[]>;
}

/** Error whose message is safe to show to the AI client. */
export class ToolError extends Error {}
