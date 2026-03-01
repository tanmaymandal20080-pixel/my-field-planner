"use client"

import { usePlanner } from './planner-context';
import { Navbar } from '@/components/layout/Navbar';
import { FAB } from '@/components/planner/FAB';
import { TaskItem } from '@/components/tasks/TaskItem';
import { AreaTree } from '@/components/route/AreaTree';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, History as HistoryIcon, Map, Plus, LogIn, UserCircle, Mail, Lock } from 'lucide-react';
import { useState } from 'react';
import { isToday, isBefore, startOfToday, format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
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
import { useUser, useAuth } from '@/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInAnonymously 
} from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
  const { 
    view, 
    tasks, 
    areas, 
    selectedPlanAreaIds, 
    deleteHistory,
    deleteMultipleTasks,
    isLoading: plannerLoading
  } = usePlanner();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [showClearHistoryConfirm, setShowClearHistoryConfirm] = useState(false);

  // Login Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authInProgress, setAuthInProgress] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setAuthInProgress(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        toast({ title: "Account created successfully" });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: "Signed in successfully" });
      }
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Authentication failed", 
        description: error.message 
      });
    } finally {
      setAuthInProgress(false);
    }
  };

  const handleGuestLogin = async () => {
    setAuthInProgress(true);
    try {
      await signInAnonymously(auth);
      toast({ title: "Continuing as Guest" });
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Guest login failed", 
        description: error.message 
      });
    } finally {
      setAuthInProgress(false);
    }
  };

  if (isUserLoading || (user && plannerLoading)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Syncing your field route...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-primary">My Field Planner</h1>
          <p className="text-muted-foreground">Lifetime Cloud Sync for Field Agents</p>
        </div>
        
        <div className="w-full max-w-sm p-8 bg-card rounded-3xl shadow-xl border border-border space-y-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Map className="h-8 w-8 text-primary" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-bold">{isSignUp ? "Create Account" : "Welcome Back"}</h2>
            <p className="text-sm text-muted-foreground">
              {isSignUp ? "Sign up to start planning your routes." : "Sign in to recover your routes and tasks."}
            </p>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4 text-left">
            <div className="space-y-1">
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="email" 
                  placeholder="Email" 
                  className="pl-10 h-11"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="password" 
                  placeholder="Password" 
                  className="pl-10 h-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-11 gap-2" disabled={authInProgress}>
              <LogIn className="h-4 w-4" />
              {isSignUp ? "Sign Up" : "Sign In"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button 
            onClick={handleGuestLogin} 
            variant="outline" 
            className="w-full h-11 gap-2" 
            disabled={authInProgress}
          >
            <UserCircle className="h-4 w-4" />
            Continue as Guest
          </Button>

          <div className="text-center">
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-primary hover:underline font-medium"
            >
              {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
            </button>
          </div>

          <p className="text-[10px] text-muted-foreground">By signing in, you agree to our terms of service.</p>
        </div>
      </div>
    );
  }

  const toggleSelectTask = (id: string) => {
    setSelectedTaskIds(prev => 
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    );
  };

  const handleLongPressHistory = (id: string) => {
    if (selectedTaskIds.length === 0) {
      setSelectedTaskIds([id]);
    }
  };

  const handleDeleteSelected = () => {
    deleteMultipleTasks(selectedTaskIds);
    setSelectedTaskIds([]);
  };

  const renderTodayView = () => {
    const todayTasks = tasks.filter(t => {
      if (!t.date) return false;
      const date = new Date(t.date);
      return isToday(date) || isBefore(date, startOfToday());
    });
    
    return (
      <div className="space-y-0">
        {todayTasks.length > 0 ? (
          todayTasks.map(task => (
            <TaskItem 
              key={task.id} 
              task={task} 
              area={areas.find(a => a.id === task.areaId)} 
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-4">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
              <Plus className="h-10 w-10 text-primary opacity-50" />
            </div>
            <h3 className="text-xl font-semibold">No tasks for today!</h3>
            <p className="text-muted-foreground">Relax or use the + button to plan ahead.</p>
          </div>
        )}
      </div>
    );
  };

  const renderAllView = () => {
    const filteredTasks = tasks.filter(t => 
      !t.isCompleted && 
      (t.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
       t.reason.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
      <div className="space-y-4 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            className="pl-10 h-12" 
            placeholder="Search tasks..." 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
          />
        </div>
        <div className="space-y-0">
          {filteredTasks.map(task => (
            <TaskItem key={task.id} task={task} area={areas.find(a => a.id === task.areaId)} />
          ))}
        </div>
      </div>
    );
  };

  const renderFieldPlan = () => {
    if (selectedPlanAreaIds.length === 0) return null;
    
    const relevantTasks = tasks.filter(t => !t.isCompleted && selectedPlanAreaIds.includes(t.areaId));
    
    const todayRoute = relevantTasks.filter(t => t.date && (isToday(new Date(t.date)) || isBefore(new Date(t.date), startOfToday())));
    const upcomingRoute = relevantTasks.filter(t => !t.date || (!isToday(new Date(t.date)) && !isBefore(new Date(t.date), startOfToday())));

    return (
      <div className="pb-24">
        <div className="p-4 bg-primary/5 border-b">
          <p className="text-sm font-medium text-primary flex items-center gap-2">
            <Map className="h-4 w-4" />
            Combined Field Route Plan: <span className="font-bold">{selectedPlanAreaIds.length} Areas</span>
          </p>
        </div>

        <section>
          <div className="p-4 bg-muted/40 font-bold text-xs uppercase tracking-wider text-muted-foreground">
            Current/Overdue Route Tasks ({todayRoute.length})
          </div>
          {todayRoute.map(task => (
            <TaskItem key={task.id} task={task} area={areas.find(a => a.id === task.areaId)} />
          ))}
        </section>

        <Separator className="my-2 h-2 bg-muted/50" />

        <section>
          <div className="p-4 bg-muted/40 font-bold text-xs uppercase tracking-wider text-muted-foreground">
            Upcoming/Undated Route Tasks ({upcomingRoute.length})
          </div>
          {upcomingRoute.map(task => (
            <TaskItem key={task.id} task={task} area={areas.find(a => a.id === task.areaId)} />
          ))}
        </section>
      </div>
    );
  };

  const renderHistory = () => {
    const historyTasks = tasks.filter(t => t.isCompleted).filter(t => {
      const area = areas.find(a => a.id === t.areaId)?.name || '';
      const dateStr = t.date ? format(new Date(t.date), 'MMM dd, yyyy') : 'No Date';
      const search = historySearch.toLowerCase();
      return t.clientName.toLowerCase().includes(search) ||
             t.reason.toLowerCase().includes(search) ||
             area.toLowerCase().includes(search) ||
             dateStr.toLowerCase().includes(search);
    });

    return (
      <div className="space-y-4">
        <div className="p-4 bg-background border-b sticky top-0 z-10 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              className="pl-10 h-12" 
              placeholder="Search history by name, area, reason..." 
              value={historySearch} 
              onChange={e => setHistorySearch(e.target.value)} 
            />
          </div>
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <HistoryIcon className="h-4 w-4" />
              Completed History ({historyTasks.length})
            </h2>
            {selectedTaskIds.length === 0 && (
              <Button variant="ghost" size="sm" className="text-destructive font-bold h-8" onClick={() => setShowClearHistoryConfirm(true)}>
                Clear All
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-0">
          {historyTasks.map(task => (
            <TaskItem 
              key={task.id} 
              task={task} 
              area={areas.find(a => a.id === task.areaId)}
              isSelectable={selectedTaskIds.length > 0}
              isSelected={selectedTaskIds.includes(task.id)}
              onSelect={toggleSelectTask}
              onLongPress={handleLongPressHistory}
            />
          ))}
        </div>

        <AlertDialog open={showClearHistoryConfirm} onOpenChange={setShowClearHistoryConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Strict Confirmation Required</AlertDialogTitle>
              <AlertDialogDescription>
                You are about to clear your entire history. This will delete all completed tasks forever from the cloud.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => {
                  deleteHistory();
                  setShowClearHistoryConfirm(false);
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Confirm Clear All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  };

  const renderView = () => {
    switch (view) {
      case 'today': return renderTodayView();
      case 'all': return renderAllView();
      case 'field-plan': return renderFieldPlan();
      case 'planning': return <AreaTree />;
      case 'history': return renderHistory();
      default: return renderTodayView();
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-background relative overflow-hidden shadow-2xl">
      <Navbar 
        selectedCount={selectedTaskIds.length} 
        onDeleteSelected={handleDeleteSelected}
        onClearSelection={() => setSelectedTaskIds([])}
      />
      <main className={cn("flex-1 overflow-y-auto relative", view === 'planning' ? "overflow-hidden" : "pb-24")}>
        {renderView()}
      </main>
      <FAB />
    </div>
  );
}
