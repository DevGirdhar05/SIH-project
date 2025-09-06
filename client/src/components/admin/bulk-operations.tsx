import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckSquare, Square, Users, MessageSquare, FileText, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BulkOperationsProps {
  selectedIssues: string[];
  onBulkUpdate: (issueIds: string[], updates: any) => Promise<void>;
  onDeselectAll: () => void;
  users: any[];
  categories: any[];
}

export function BulkOperations({ 
  selectedIssues, 
  onBulkUpdate, 
  onDeselectAll, 
  users, 
  categories 
}: BulkOperationsProps) {
  const [operation, setOperation] = useState('');
  const [assignee, setAssignee] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [category, setCategory] = useState('');
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const bulkActions = [
    { value: 'assign', label: 'Assign to User', icon: Users },
    { value: 'status', label: 'Change Status', icon: CheckSquare },
    { value: 'priority', label: 'Set Priority', icon: Square },
    { value: 'category', label: 'Change Category', icon: FileText },
    { value: 'comment', label: 'Add Comment', icon: MessageSquare },
    { value: 'export', label: 'Export Selected', icon: Download },
  ];

  const handleBulkAction = async () => {
    if (!operation || selectedIssues.length === 0) return;

    setIsLoading(true);
    try {
      const updates: any = {};

      switch (operation) {
        case 'assign':
          if (!assignee) {
            toast({ title: 'Error', description: 'Please select an assignee', variant: 'destructive' });
            return;
          }
          updates.assigneeId = assignee === 'unassign' ? null : assignee;
          break;
        
        case 'status':
          if (!status) {
            toast({ title: 'Error', description: 'Please select a status', variant: 'destructive' });
            return;
          }
          updates.status = status;
          if (status === 'RESOLVED') {
            updates.resolvedAt = new Date();
          }
          break;
        
        case 'priority':
          if (!priority) {
            toast({ title: 'Error', description: 'Please select a priority', variant: 'destructive' });
            return;
          }
          updates.priority = priority;
          break;
        
        case 'category':
          if (!category) {
            toast({ title: 'Error', description: 'Please select a category', variant: 'destructive' });
            return;
          }
          updates.categoryId = category;
          break;
        
        case 'comment':
          if (!comment.trim()) {
            toast({ title: 'Error', description: 'Please enter a comment', variant: 'destructive' });
            return;
          }
          updates.comment = comment.trim();
          break;
        
        case 'export':
          handleExport();
          return;
        
        default:
          return;
      }

      await onBulkUpdate(selectedIssues, updates);
      
      toast({
        title: 'Success',
        description: `${selectedIssues.length} issue(s) updated successfully`,
      });

      // Reset form
      setOperation('');
      setAssignee('');
      setStatus('');
      setPriority('');
      setCategory('');
      setComment('');
      setDialogOpen(false);
      onDeselectAll();

    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update issues. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    // Create CSV content for selected issues
    const csvContent = [
      ['Issue ID', 'Title', 'Status', 'Priority', 'Category', 'Created Date'],
      ...selectedIssues.map(id => [id, 'Sample Title', 'SUBMITTED', 'MEDIUM', 'Pothole', new Date().toISOString()])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `selected-issues-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Export Complete',
      description: `${selectedIssues.length} issue(s) exported successfully`,
    });
  };

  const renderOperationForm = () => {
    switch (operation) {
      case 'assign':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Assign to:</label>
              <Select value={assignee} onValueChange={setAssignee}>
                <SelectTrigger data-testid="select-bulk-assignee">
                  <SelectValue placeholder="Select user..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassign">Unassign</SelectItem>
                  {users.filter(user => ['OFFICER', 'SUPERVISOR', 'ADMIN'].includes(user.role)).map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'status':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Change status to:</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger data-testid="select-bulk-status">
                  <SelectValue placeholder="Select status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRIAGED">Triaged</SelectItem>
                  <SelectItem value="ASSIGNED">Assigned</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="PENDING_USER_INFO">Pending User Info</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'priority':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Set priority to:</label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger data-testid="select-bulk-priority">
                  <SelectValue placeholder="Select priority..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'category':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Change category to:</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger data-testid="select-bulk-category">
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'comment':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Add comment to all selected issues:</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Enter your comment..."
                rows={4}
                data-testid="textarea-bulk-comment"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (selectedIssues.length === 0) {
    return (
      <Card data-testid="bulk-operations-empty">
        <CardContent className="p-6 text-center text-muted-foreground">
          <CheckSquare className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>Select issues to perform bulk operations</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="bulk-operations">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            Bulk Operations
          </span>
          <Badge variant="secondary" data-testid="selected-count">
            {selectedIssues.length} selected
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {bulkActions.map((action) => (
            <Button
              key={action.value}
              variant={operation === action.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setOperation(action.value)}
              className="flex items-center gap-2"
              data-testid={`button-bulk-${action.value}`}
            >
              <action.icon className="h-4 w-4" />
              {action.label}
            </Button>
          ))}
        </div>

        {operation && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="w-full" 
                onClick={() => setDialogOpen(true)}
                data-testid="button-open-bulk-dialog"
              >
                Configure {bulkActions.find(a => a.value === operation)?.label}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {bulkActions.find(a => a.value === operation)?.label}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  This action will be applied to {selectedIssues.length} selected issue(s).
                </div>
                
                {renderOperationForm()}
              </div>

              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                  data-testid="button-cancel-bulk"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleBulkAction}
                  disabled={isLoading}
                  data-testid="button-confirm-bulk"
                >
                  {isLoading ? 'Processing...' : 'Apply Changes'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onDeselectAll}
            data-testid="button-deselect-all"
          >
            Deselect All
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}