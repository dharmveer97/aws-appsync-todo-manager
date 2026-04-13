export type Status = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED' | 'CANCELLED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type Category = 'WORK' | 'PERSONAL' | 'SHOPPING' | 'HEALTH' | 'FINANCE' | 'EDUCATION' | 'TRAVEL' | 'OTHER';

export interface Todo {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  priority: Priority;
  status: Status;
  category?: Category;
  tags?: string[];
  dueDate?: string;
  orderIndex: number;
  completed: boolean;
  owner: string;
  createdAt: string;
  updatedAt: string;
}

export interface TodoConnection {
  items: Todo[];
  nextToken?: string;
}

export interface CreateTodoInput {
  title: string;
  subtitle?: string;
  description?: string;
  priority: Priority;
  status?: Status;
  category?: Category;
  tags?: string[];
  dueDate?: string;
}

export interface UpdateTodoInput {
  id: string;
  title?: string;
  subtitle?: string;
  description?: string;
  priority?: Priority;
  status?: Status;
  category?: Category;
  tags?: string[];
  dueDate?: string;
  orderIndex?: number;
  completed?: boolean;
}

export interface UpdateOrderInput {
  id: string;
  orderIndex: number;
}

export interface TodoFilterInput {
  status?: Status[];
  priority?: Priority[];
  category?: Category[];
  search?: string;
  overdue?: boolean;
}