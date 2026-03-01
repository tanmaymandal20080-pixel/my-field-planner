
"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AreaNode, Task, ViewType } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { 
  useUser, 
  useFirestore, 
  useCollection, 
  useMemoFirebase,
  setDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking
} from '@/firebase';
import { collection, doc } from 'firebase/firestore';

interface PlannerContextType {
  areas: AreaNode[];
  tasks: Task[];
  view: ViewType;
  setView: (view: ViewType) => void;
  selectedPlanAreaIds: string[];
  setSelectedPlanAreaIds: (ids: string[]) => void;
  addTask: (task: Omit<Task, 'id' | 'isCompleted' | 'userId'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  completeTask: (id: string) => void;
  deleteTask: (id: string) => void;
  deleteMultipleTasks: (ids: string[]) => void;
  addArea: (name: string, initialParentId: string | null) => void;
  linkArea: (nodeId: string, parentId: string) => void;
  deleteArea: (id: string) => boolean;
  deleteHistory: () => void;
  getRoutePath: (destIds: string[]) => string[];
  isLoading: boolean;
}

const PlannerContext = createContext<PlannerContextType | undefined>(undefined);

export function PlannerProvider({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [view, setView] = useState<ViewType>('today');
  const [selectedPlanAreaIds, setSelectedPlanAreaIds] = useState<string[]>([]);

  const areasRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, 'users', user.uid, 'areaNodes');
  }, [db, user]);

  const tasksRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, 'users', user.uid, 'tasks');
  }, [db, user]);

  const { data: areasData, isLoading: areasLoading } = useCollection<AreaNode>(areasRef);
  const { data: tasksData, isLoading: tasksLoading } = useCollection<Task>(tasksRef);

  const areas = areasData || [];
  const tasks = tasksData || [];
  const isLoading = isUserLoading || areasLoading || tasksLoading;

  // Initialize Root Node if it doesn't exist
  useEffect(() => {
    if (!isLoading && user && db && areas.length === 0) {
      const rootId = 'root';
      const rootRef = doc(db, 'users', user.uid, 'areaNodes', rootId);
      // We use a small timeout to ensure the collection check is stable
      const timer = setTimeout(() => {
        setDocumentNonBlocking(rootRef, {
          id: rootId,
          userId: user.uid,
          name: 'Home',
          parentIds: []
        }, { merge: true });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, user, areas.length, db]);

  const addTask = (taskInput: Omit<Task, 'id' | 'isCompleted' | 'userId'>) => {
    if (!user) return;
    const taskId = uuidv4();
    const taskDocRef = doc(db, 'users', user.uid, 'tasks', taskId);
    setDocumentNonBlocking(taskDocRef, {
      ...taskInput,
      id: taskId,
      userId: user.uid,
      isCompleted: false,
    }, { merge: true });
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    if (!user) return;
    const taskRef = doc(db, 'users', user.uid, 'tasks', id);
    updateDocumentNonBlocking(taskRef, updates);
  };

  const completeTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      updateTask(id, { isCompleted: !task.isCompleted });
    }
  };

  const deleteTask = (id: string) => {
    if (!user) return;
    const taskRef = doc(db, 'users', user.uid, 'tasks', id);
    deleteDocumentNonBlocking(taskRef);
  };

  const deleteMultipleTasks = (ids: string[]) => {
    if (!user) return;
    ids.forEach(id => {
      const taskRef = doc(db, 'users', user.uid, 'tasks', id);
      deleteDocumentNonBlocking(taskRef);
    });
  };

  const addArea = (name: string, initialParentId: string | null) => {
    if (!user) return;
    const areaId = uuidv4();
    const areaDocRef = doc(db, 'users', user.uid, 'areaNodes', areaId);
    setDocumentNonBlocking(areaDocRef, {
      id: areaId,
      userId: user.uid,
      name,
      parentIds: initialParentId ? [initialParentId] : [],
    }, { merge: true });
  };

  const linkArea = (nodeId: string, parentId: string) => {
    if (!user) return;
    const node = areas.find(a => a.id === nodeId);
    if (!node) return;
    if (node.parentIds.includes(parentId)) return;

    const areaRef = doc(db, 'users', user.uid, 'areaNodes', nodeId);
    updateDocumentNonBlocking(areaRef, {
      parentIds: [...node.parentIds, parentId]
    });
  };

  const deleteArea = (id: string): boolean => {
    if (!user || id === 'root') return false;
    const hasChildren = areas.some(a => a.parentIds.includes(id));
    const hasTasks = tasks.some(t => t.areaId === id && !t.isCompleted);
    
    if (hasChildren || hasTasks) return false;
    
    const areaRef = doc(db, 'users', user.uid, 'areaNodes', id);
    deleteDocumentNonBlocking(areaRef);
    return true;
  };

  const deleteHistory = () => {
    if (!user) return;
    const completedTasks = tasks.filter(t => t.isCompleted);
    completedTasks.forEach(t => {
      const taskRef = doc(db, 'users', user.uid, 'tasks', t.id);
      deleteDocumentNonBlocking(taskRef);
    });
  };

  const getRoutePath = (destIds: string[]): string[] => {
    const result = new Set<string>();
    const stack = [...destIds];
    const visited = new Set<string>();

    while (stack.length > 0) {
      const id = stack.pop()!;
      if (visited.has(id)) continue;
      visited.add(id);
      result.add(id);

      const node = areas.find(a => a.id === id);
      if (node && node.parentIds) {
        stack.push(...node.parentIds);
      }
    }
    
    return Array.from(result);
  };

  return (
    <PlannerContext.Provider value={{ 
      areas, tasks, view, setView, 
      selectedPlanAreaIds, setSelectedPlanAreaIds,
      addTask, updateTask, completeTask, deleteTask, deleteMultipleTasks, addArea, linkArea, deleteArea, deleteHistory, getRoutePath,
      isLoading
    }}>
      {children}
    </PlannerContext.Provider>
  );
}

export function usePlanner() {
  const context = useContext(PlannerContext);
  if (!context) throw new Error('usePlanner must be used within PlannerProvider');
  return context;
}
