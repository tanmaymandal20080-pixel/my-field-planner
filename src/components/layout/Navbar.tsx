
"use client"

import { Menu, ArrowLeft, Trash2, X, LogOut, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlanner } from '@/app/planner-context';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
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
import { useAuth, useUser } from '@/firebase';

export function Navbar({ 
  selectedCount = 0, 
  onDeleteSelected,
  onClearSelection 
}: { 
  selectedCount?: number; 
  onDeleteSelected?: () => void;
  onClearSelection?: () => void;
}) {
  const { view, setView } = usePlanner();
  const { user } = useUser();
  const auth = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getTitle = () => {
    if (selectedCount > 0) return `${selectedCount} Selected`;
    switch (view) {
      case 'today': return "Today's Tasks";
      case 'all': return "All Task View";
      case 'history': return "History";
      case 'planning': return "Route Planning";
      case 'field-plan': return "Field Route Plan";
      default: return "My Field Planner";
    }
  };

  const handleNavigate = (newView: any) => {
    setView(newView);
    setIsOpen(false);
  };

  const handleSignOut = () => {
    auth.signOut();
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-primary text-primary-foreground shadow-sm px-4 py-3 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-3">
          {selectedCount > 0 ? (
            <Button variant="ghost" size="icon" onClick={onClearSelection} className="text-primary-foreground">
              <X className="h-6 w-6" />
            </Button>
          ) : (
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-primary-foreground">
                  <Menu className="h-8 w-8" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] border-r-0 flex flex-col">
                <SheetHeader className="text-left mb-6">
                  <SheetTitle className="text-2xl font-bold text-primary">My Field Planner</SheetTitle>
                  {user && (
                    <div className="flex items-center gap-2 mt-2">
                      <UserCircle className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground truncate">
                        {user.isAnonymous ? "Guest User" : user.email}
                      </p>
                    </div>
                  )}
                </SheetHeader>
                <nav className="flex flex-col gap-2 flex-1">
                  <Button variant="ghost" className="justify-start text-lg h-12" onClick={() => handleNavigate('today')}>Today's Tasks</Button>
                  <Button variant="ghost" className="justify-start text-lg h-12" onClick={() => handleNavigate('all')}>All Task View</Button>
                  <Button variant="ghost" className="justify-start text-lg h-12" onClick={() => handleNavigate('history')}>History</Button>
                  <Separator className="my-2" />
                  <Button variant="ghost" className="justify-start text-lg h-12" onClick={() => handleNavigate('planning')}>Area Route Planning</Button>
                </nav>
                <div className="pt-4 border-t">
                  <Button variant="ghost" className="w-full justify-start text-lg h-12 text-destructive gap-3" onClick={handleSignOut}>
                    <LogOut className="h-5 w-5" />
                    Sign Out
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          )}
          <h1 className="text-lg font-semibold truncate">{getTitle()}</h1>
        </div>
        <div className="flex items-center gap-2">
          {selectedCount > 0 && onDeleteSelected ? (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowDeleteConfirm(true)} 
              className="text-primary-foreground hover:bg-white/20"
            >
              <Trash2 className="h-6 w-6" />
            </Button>
          ) : view !== 'today' && (
            <Button variant="ghost" size="icon" onClick={() => setView('today')} className="text-primary-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
        </div>
      </header>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected tasks from your cloud storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                onDeleteSelected?.();
                setShowDeleteConfirm(false);
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
