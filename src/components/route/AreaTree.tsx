
"use client"

import { useState } from 'react';
import { usePlanner } from '@/app/planner-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Home, Link as LinkIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AreaNode } from '@/lib/types';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export function AreaTree() {
  const { areas, addArea, linkArea, deleteArea, isLoading } = usePlanner();
  const { toast } = useToast();
  const [newNodeName, setNewNodeName] = useState('');
  const [activeParentId, setActiveParentId] = useState<string | null>(null);
  const [linkTargetId, setLinkTargetId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleAdd = (parentId: string | null) => {
    if (!newNodeName.trim()) return;
    addArea(newNodeName.trim(), parentId);
    setNewNodeName('');
    setActiveParentId(null);
  };

  const handleLink = (nodeId: string, parentId: string) => {
    linkArea(nodeId, parentId);
    setLinkTargetId(null);
    toast({ title: "Path Linked Successfully" });
  };

  const handleDelete = () => {
    if (!deleteId) return;
    const success = deleteArea(deleteId);
    if (!success) {
      toast({ 
        title: "Delete Failed", 
        description: "Cannot delete area with active branches or tasks.",
        variant: "destructive"
      });
    }
    setDeleteId(null);
  };

  const renderVisualNode = (node: AreaNode) => {
    const children = areas.filter(a => a.parentIds?.includes(node.id)) || [];
    const isAdding = activeParentId === node.id;
    const isLinking = linkTargetId === node.id;
    const isRoot = node.id === 'root';

    return (
      <div 
        key={node.id} 
        id={isRoot ? "home-node" : `node-${node.id}`}
        className="relative flex flex-col items-center"
      >
        <div className="z-10 bg-white border-2 border-primary/20 rounded-2xl shadow-xl p-4 min-w-[180px] text-center mb-12 transition-all hover:border-primary hover:shadow-2xl">
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              {isRoot ? <Home className="h-5 w-5 text-primary" /> : null}
              <span className="font-bold text-lg text-primary">{node.name}</span>
            </div>
            
            <div className="flex gap-2 mt-2 w-full justify-center">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9 px-2 gap-1 rounded-lg border-primary/20 hover:bg-primary/5" 
                onClick={() => {
                  setActiveParentId(node.id === activeParentId ? null : node.id);
                  setLinkTargetId(null);
                }}
              >
                <Plus className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase">Add</span>
              </Button>
              
              {!isRoot && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-9 px-2 gap-1 rounded-lg border-accent/20 text-accent hover:bg-accent/5" 
                    onClick={() => {
                      setLinkTargetId(node.id === linkTargetId ? null : node.id);
                      setActiveParentId(null);
                    }}
                  >
                    <LinkIcon className="h-4 w-4" />
                    <span className="text-[10px] font-bold uppercase">Link</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 rounded-lg text-destructive hover:bg-destructive/5" 
                    onClick={() => setDeleteId(node.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>

            {node.parentIds?.length > 1 && (
              <div className="text-[9px] text-accent font-black uppercase tracking-widest bg-accent/5 px-2 py-0.5 rounded-full">
                Multi-Path ({node.parentIds.length})
              </div>
            )}
          </div>
        </div>

        {children.length > 0 && (
          <div className="absolute top-[105px] w-0.5 h-12 bg-primary/20" />
        )}

        <div className="flex gap-16 relative mt-0">
          {children.length > 1 && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/20 mx-[90px]" />
          )}
          {children.map((child) => (
            <div key={child.id} className="relative flex flex-col items-center">
              <div className="w-0.5 h-8 bg-primary/20" />
              {renderVisualNode(child)}
            </div>
          ))}
        </div>

        {isAdding && (
          <div className="absolute top-full mt-2 z-30 p-3 bg-white shadow-2xl rounded-xl border-2 border-primary flex gap-2 animate-in fade-in zoom-in-95 slide-in-from-top-4">
            <Input 
              autoFocus 
              className="h-10 text-sm w-40"
              placeholder="Village name..." 
              value={newNodeName} 
              onChange={e => setNewNodeName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd(node.id)}
            />
            <Button className="h-10" onClick={() => handleAdd(node.id)}>Add</Button>
          </div>
        )}

        {isLinking && (
          <div className="absolute top-full mt-2 z-30 p-3 bg-white shadow-2xl rounded-xl border-2 border-accent flex flex-col gap-2 animate-in fade-in zoom-in-95 slide-in-from-top-4">
            <p className="text-[10px] font-black text-accent uppercase text-center tracking-tighter">Connect to another parent:</p>
            <Select onValueChange={(val) => handleLink(node.id, val)}>
              <SelectTrigger className="h-10 text-sm w-48">
                <SelectValue placeholder="Select Parent" />
              </SelectTrigger>
              <SelectContent>
                {areas
                  .filter(a => a.id !== node.id && !node.parentIds?.includes(a.id))
                  .map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    );
  };

  const rootNode = areas.find(a => a.id === 'root');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-muted/5 relative">
      <div className="p-4 border-b bg-background z-10 flex justify-between items-center shadow-md shrink-0">
        <div>
          <h2 className="text-xl font-black text-primary uppercase tracking-tighter">Route Network Map</h2>
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Static View • Builds Top-Down</p>
        </div>
      </div>

      <div className="flex-1 relative bg-slate-50 overflow-auto">
        <div className="p-10 flex justify-center min-w-max">
          {rootNode ? (
            renderVisualNode(rootNode)
          ) : (
            <div className="flex flex-col items-center gap-6 p-20 border-4 border-dashed border-primary/20 rounded-3xl bg-white/50">
              <Home className="h-20 w-20 text-primary/20" />
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold text-primary">Map Not Initialized</h3>
                <p className="text-muted-foreground">Click below to start your route network.</p>
              </div>
              <Button size="lg" className="h-16 text-xl px-8 rounded-2xl" onClick={() => addArea('Home', null)}>
                Initialize Home Node
              </Button>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-3xl border-2">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black uppercase text-destructive">Strict Confirmation</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Delete this village node? Nodes with active branch dependencies or incomplete tasks cannot be deleted to maintain route integrity.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="rounded-xl h-12">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground rounded-xl h-12 hover:bg-destructive/90">Confirm Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
