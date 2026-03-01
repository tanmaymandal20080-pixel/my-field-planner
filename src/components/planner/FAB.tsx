
"use client"

import { useState } from 'react';
import { Plus, MapPin, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
} from '@/components/ui/sheet';
import { TaskForm } from '@/components/forms/TaskForm';
import { FieldPlanForm } from './FieldPlanForm';

export function FAB() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<'none' | 'task' | 'plan'>('none');

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    // Force reset to the main menu every time the modal is closed
    if (!open) {
      setActiveAction('none');
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 items-end z-50">
        <Button 
          size="lg" 
          className="rounded-full w-14 h-14 shadow-2xl bg-accent hover:bg-accent/90"
          onClick={() => setIsOpen(true)}
        >
          <Plus className="h-8 w-8" />
        </Button>
      </div>

      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <SheetContent side="bottom" className="rounded-t-3xl min-h-[40vh] p-6 pt-2">
          <div className="w-12 h-1.5 bg-muted rounded-full mx-auto my-4" />
          
          {activeAction === 'none' && (
            <div className="space-y-4 pt-4">
              <SheetTitle className="text-center text-xl font-bold mb-6">Quick Actions</SheetTitle>
              <Button 
                variant="outline" 
                className="w-full h-16 justify-start text-lg gap-4 rounded-xl border-2"
                onClick={() => setActiveAction('task')}
              >
                <ClipboardList className="h-6 w-6 text-primary" />
                Add New Task
              </Button>
              <Button 
                variant="outline" 
                className="w-full h-16 justify-start text-lg gap-4 rounded-xl border-2"
                onClick={() => setActiveAction('plan')}
              >
                <MapPin className="h-6 w-6 text-accent" />
                Field Plan
              </Button>
            </div>
          )}

          {activeAction === 'task' && (
            <div className="pb-10">
              <SheetHeader className="mb-4">
                <SheetTitle className="text-center">Add New Task</SheetTitle>
              </SheetHeader>
              <TaskForm onSuccess={() => setIsOpen(false)} />
            </div>
          )}

          {activeAction === 'plan' && (
            <div className="pb-10">
              <SheetHeader className="mb-4">
                <SheetTitle className="text-center">Generate Field Plan</SheetTitle>
              </SheetHeader>
              <FieldPlanForm onSuccess={() => setIsOpen(false)} />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
