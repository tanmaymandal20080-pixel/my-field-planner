
"use client"

import { useState } from 'react';
import { usePlanner } from '@/app/planner-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Priority } from '@/lib/types';

export function TaskForm({ onSuccess }: { onSuccess: () => void }) {
  const { areas, addTask } = usePlanner();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    clientName: '',
    reason: '',
    date: '',
    areaId: '',
    priority: 'Medium' as Priority,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName || !formData.reason || !formData.areaId) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    addTask({
      ...formData,
      date: formData.date ? new Date(formData.date).toISOString() : null,
    });

    toast({ title: "Task Added Successfully" });
    onSuccess();
    
    // Execute Hard Redirect to refresh all component states
    window.location.href = '/';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 p-2">
      <div className="space-y-2">
        <Label htmlFor="clientName">Client Name *</Label>
        <Input 
          id="clientName" 
          value={formData.clientName} 
          onChange={e => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
          placeholder="Enter client name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">Reason *</Label>
        <Textarea 
          id="reason" 
          value={formData.reason} 
          onChange={e => setFormData(prev => ({ ...prev, reason: e.target.value }))}
          placeholder="Task details..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input 
            id="date" 
            type="date"
            value={formData.date} 
            onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select 
            value={formData.priority} 
            onValueChange={(val: Priority) => setFormData(prev => ({ ...prev, priority: val }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="area">Area/Village *</Label>
        <Select 
          value={formData.areaId} 
          onValueChange={val => setFormData(prev => ({ ...prev, areaId: val }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select location" />
          </SelectTrigger>
          <SelectContent>
            {areas.map(area => (
              <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full h-12 text-lg">Add Task</Button>
    </form>
  );
}
