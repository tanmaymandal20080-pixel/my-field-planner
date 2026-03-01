
"use client"

import { useState, useRef, useEffect } from 'react';
import { Task, AreaNode } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { usePlanner } from '@/app/planner-context';
import { format, isBefore, isToday, startOfToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Trash2, Edit, X, CheckSquare, Square } from 'lucide-react';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';

interface TaskItemProps {
  task: Task;
  area: AreaNode | undefined;
  isSelectable?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onLongPress?: (id: string) => void;
}

export function TaskItem({ 
  task, 
  area, 
  isSelectable = false, 
  isSelected = false, 
  onSelect, 
  onLongPress 
}: TaskItemProps) {
  const { completeTask, deleteTask } = usePlanner();
  const [showActions, setShowActions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handlePointerDown = () => {
    longPressTimer.current = setTimeout(() => {
      if (onLongPress) {
        onLongPress(task.id);
      } else {
        setShowActions(true);
      }
    }, 600);
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleTaskClick = () => {
    if (isSelectable && onSelect) {
      onSelect(task.id);
    }
  };

  const isOverdue = task.date ? isBefore(new Date(task.date), startOfToday()) && !isToday(new Date(task.date)) : false;

  const priorityColor = {
    High: 'bg-destructive text-destructive-foreground',
    Medium: 'bg-amber-500 text-white',
    Low: 'bg-emerald-500 text-white',
  }[task.priority];

  return (
    <>
      <div 
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onClick={handleTaskClick}
        className={cn(
          "p-4 border-b bg-card flex items-start gap-4 transition-all active:bg-muted/50 select-none",
          task.isCompleted && "opacity-50 grayscale",
          isSelected && "bg-primary/10 border-l-4 border-l-primary"
        )}
      >
        <div className="pt-1" onClick={(e) => e.stopPropagation()}>
          {isSelectable ? (
            <div className="text-primary">
              {isSelected ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5 opacity-30" />}
            </div>
          ) : (
            <Checkbox 
              checked={task.isCompleted} 
              onCheckedChange={() => completeTask(task.id)}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <h3 className={cn(
              "font-semibold text-base truncate",
              task.isCompleted && "line-through"
            )}>{task.clientName}</h3>
            <Badge className={cn("text-[10px] px-1.5 py-0", priorityColor)}>{task.priority}</Badge>
          </div>
          <p className={cn(
            "text-sm text-muted-foreground line-clamp-2 mb-2",
            task.isCompleted && "line-through"
          )}>{task.reason}</p>
          <div className="flex items-center gap-3 text-xs">
            <span className={cn(
              "flex items-center gap-1",
              isOverdue && !task.isCompleted && "text-destructive font-bold"
            )}>
              {task.date ? format(new Date(task.date), 'MMM dd, yyyy') : 'No Date'}
            </span>
            <span className="text-primary font-medium">{area?.name || 'Unknown Area'}</span>
          </div>
        </div>
      </div>

      <Sheet open={showActions} onOpenChange={setShowActions}>
        <SheetContent side="bottom" className="rounded-t-3xl p-6 pt-2">
          <div className="w-12 h-1.5 bg-muted rounded-full mx-auto my-4" />
          <SheetHeader className="mb-6">
            <SheetTitle className="text-center">Task Options</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-1 gap-3 pb-8">
            <Button variant="outline" className="h-14 text-lg justify-start gap-4" onClick={() => setShowActions(false)}>
              <Edit className="h-5 w-5 text-blue-500" /> Edit Task
            </Button>
            <Button variant="outline" className="h-14 text-lg justify-start gap-4 text-destructive" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 className="h-5 w-5" /> Delete Task
            </Button>
            <Separator className="my-2" />
            <Button variant="secondary" className="h-16 text-xl font-bold w-full rounded-2xl flex gap-3" onClick={() => setShowActions(false)}>
              <X className="h-6 w-6" /> CLOSE
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This task will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                deleteTask(task.id);
                setShowDeleteConfirm(false);
                setShowActions(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Separator({ className }: { className?: string }) {
  return <div className={cn("h-px bg-border w-full", className)} />;
}
