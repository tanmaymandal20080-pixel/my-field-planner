
export type Priority = 'High' | 'Medium' | 'Low';

export interface AreaNode {
  id: string;
  userId: string;
  name: string;
  parentIds: string[]; // Support for DAG (Multiple Parents)
}

export interface Task {
  id: string;
  userId: string;
  clientName: string;
  reason: string;
  date: string | null; // ISO string
  areaId: string;
  priority: Priority;
  isCompleted: boolean;
}

export type ViewType = 'today' | 'all' | 'history' | 'planning' | 'field-plan';
