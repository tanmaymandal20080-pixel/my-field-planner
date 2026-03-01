
"use client"

import { useState, useMemo } from 'react';
import { usePlanner } from '@/app/planner-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, MapPin, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AreaNode } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

export function FieldPlanForm({ onSuccess }: { onSuccess: () => void }) {
  const { areas, setSelectedPlanAreaIds, setView } = usePlanner();
  const [search, setSearch] = useState('');
  const [manualIds, setManualIds] = useState<string[]>([]);

  // Depth helper for DAG (approximate for sorting)
  const getApproxDepth = (id: string, allAreas: AreaNode[]): number => {
    let maxDepth = 0;
    const stack: { id: string; depth: number }[] = [{ id, depth: 0 }];
    const visited = new Set<string>();

    while (stack.length > 0) {
      const { id: currId, depth } = stack.pop()!;
      if (visited.has(currId)) continue;
      visited.add(currId);
      
      maxDepth = Math.max(maxDepth, depth);
      const node = allAreas.find(a => a.id === currId);
      if (node && node.parentIds) {
        node.parentIds.forEach(pid => stack.push({ id: pid, depth: depth + 1 }));
      }
    }
    return maxDepth;
  };

  // Sort areas: Farthest first
  const sortedFilteredAreas = useMemo(() => {
    return areas
      .map(area => ({ ...area, depth: getApproxDepth(area.id, areas) }))
      .filter(area => area.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b.depth - a.depth);
  }, [areas, search]);

  // Recursive path calculation for DAG
  const activeRouteIds = useMemo(() => {
    const routeSet = new Set<string>();
    const stack = [...manualIds];
    const visited = new Set<string>();

    while (stack.length > 0) {
      const id = stack.pop()!;
      if (visited.has(id)) continue;
      visited.add(id);
      routeSet.add(id);

      const node = areas.find(a => a.id === id);
      if (node && node.parentIds) {
        stack.push(...node.parentIds);
      }
    }
    return routeSet;
  }, [manualIds, areas]);

  const toggleSelection = (id: string) => {
    setManualIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleApply = () => {
    setSelectedPlanAreaIds(Array.from(activeRouteIds));
    setView('field-plan');
    onSuccess();
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input 
          className="pl-10 h-12" 
          placeholder="Search villages or areas..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
        />
      </div>

      <div className="flex justify-between items-center px-1">
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Farthest Locations First
        </div>
        <div className="text-[10px] text-primary font-medium">
          {manualIds.length} Destinations • {activeRouteIds.size} Shared Path Nodes
        </div>
      </div>

      <ScrollArea className="h-[40vh] border rounded-xl bg-muted/20">
        <div className="p-2 space-y-1">
          {sortedFilteredAreas.map(area => {
            const isManual = manualIds.includes(area.id);
            const isOnRoute = activeRouteIds.has(area.id);
            
            return (
              <div 
                key={area.id}
                onClick={() => toggleSelection(area.id)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer bg-card select-none",
                  isManual ? "border-primary bg-primary/5 shadow-sm" : "border-transparent",
                  !isManual && isOnRoute && "opacity-60 bg-muted/50"
                )}
              >
                <div className="flex-shrink-0 pointer-events-none">
                  <Checkbox 
                    checked={isOnRoute} 
                    className={cn(
                      !isManual && isOnRoute && "opacity-50 data-[state=checked]:bg-primary/50"
                    )}
                  />
                </div>
                <div className="flex-1 flex flex-col min-w-0 pointer-events-none">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-sm truncate font-medium transition-colors",
                      isManual && "font-bold text-primary",
                      !isManual && isOnRoute && "text-muted-foreground italic"
                    )}>
                      {area.name}
                    </span>
                    {!isManual && isOnRoute && (
                      <Badge variant="outline" className="text-[9px] py-0 h-4 bg-primary/5 text-primary border-primary/20">
                        On Route
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <MapPin className="h-2 w-2" />
                    Path Depth: {area.depth}
                  </div>
                </div>
                {isManual && <CheckCircle2 className="h-4 w-4 text-primary" />}
              </div>
            );
          })}
          {sortedFilteredAreas.length === 0 && (
            <div className="py-10 text-center text-muted-foreground text-sm">
              No matching areas found.
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="pt-2">
        <Button 
          onClick={handleApply} 
          className="w-full h-14 text-lg bg-primary hover:bg-primary/90 rounded-xl"
          disabled={manualIds.length === 0}
        >
          Apply Route Plan
        </Button>
      </div>
    </div>
  );
}
