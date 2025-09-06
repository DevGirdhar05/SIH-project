import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Search, Edit, Eye, UserPlus } from "lucide-react";
import StatusBadge from "../issues/status-badge";
import { Issue } from "../../types";
import { format } from "date-fns";
import { useToast } from "../../hooks/use-toast";

export default function IssuesTable() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [filters, setFilters] = useState({
    status: "",
    categoryId: "",
    priority: "",
    search: "",
    page: 1,
    limit: 10,
  });
  
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);

  const { data: issuesData, isLoading } = useQuery({
    queryKey: ['/api/admin/issues', filters],
    queryFn: () => apiClient.getAdminIssues(filters),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/catalog/categories'],
    queryFn: () => apiClient.getCategories(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: () => apiClient.getUsers(),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ issueId, status, rejectedReason }: { 
      issueId: string; 
      status: string; 
      rejectedReason?: string; 
    }) => apiClient.updateIssueStatus(issueId, status, rejectedReason),
    onSuccess: () => {
      toast({
        title: "Status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/issues'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const assignIssueMutation = useMutation({
    mutationFn: ({ issueId, assigneeId }: { issueId: string; assigneeId: string }) =>
      apiClient.assignIssue(issueId, assigneeId),
    onSuccess: () => {
      toast({
        title: "Issue assigned successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/issues'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to assign issue",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSearch = () => {
    setFilters({ ...filters, page: 1 });
  };

  const handleSelectIssue = (issueId: string, checked: boolean) => {
    if (checked) {
      setSelectedIssues([...selectedIssues, issueId]);
    } else {
      setSelectedIssues(selectedIssues.filter(id => id !== issueId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIssues(issues.map((issue: Issue) => issue.id));
    } else {
      setSelectedIssues([]);
    }
  };

  const issues = issuesData?.issues || [];
  const total = issuesData?.total || 0;
  const totalPages = Math.ceil(total / filters.limit);

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'HIGH': return 'border-red-500 text-red-700';
      case 'MEDIUM': return 'border-yellow-500 text-yellow-700';
      case 'LOW': return 'border-green-500 text-green-700';
      case 'CRITICAL': return 'border-red-700 text-red-800';
      default: return 'border-gray-500 text-gray-700';
    }
  };

  return (
    <Card className="border border-border">
      {/* Filters Bar */}
      <CardContent className="p-4 border-b border-border">
        <div className="flex flex-wrap gap-3">
          <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
            <SelectTrigger className="w-48" data-testid="select-status-filter">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              <SelectItem value="SUBMITTED">Submitted</SelectItem>
              <SelectItem value="TRIAGED">Triaged</SelectItem>
              <SelectItem value="ASSIGNED">Assigned</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filters.categoryId} onValueChange={(value) => setFilters({ ...filters, categoryId: value })}>
            <SelectTrigger className="w-48" data-testid="select-category-filter">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {categories.map((category: any) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={filters.priority} onValueChange={(value) => setFilters({ ...filters, priority: value })}>
            <SelectTrigger className="w-48" data-testid="select-priority-filter">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Priorities</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="CRITICAL">Critical</SelectItem>
            </SelectContent>
          </Select>
          
          <Input
            placeholder="Search issues..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-64"
            data-testid="input-search"
          />
          
          <Button onClick={handleSearch} data-testid="button-search">
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
        </div>
      </CardContent>

      {/* Issues Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <Checkbox
                  checked={selectedIssues.length === issues.length && issues.length > 0}
                  onCheckedChange={handleSelectAll}
                  data-testid="checkbox-select-all"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Ticket
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Issue
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Priority
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Assigned To
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Created
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {issues.map((issue: Issue) => (
              <tr key={issue.id} className="hover:bg-accent/50 transition-colors" data-testid={`row-issue-${issue.ticketNo}`}>
                <td className="px-4 py-4">
                  <Checkbox
                    checked={selectedIssues.includes(issue.id)}
                    onCheckedChange={(checked) => handleSelectIssue(issue.id, checked as boolean)}
                    data-testid={`checkbox-issue-${issue.id}`}
                  />
                </td>
                <td className="px-4 py-4 text-sm font-mono" data-testid={`text-ticket-${issue.id}`}>
                  {issue.ticketNo}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center space-x-3">
                    {issue.imageUrls && issue.imageUrls.length > 0 && (
                      <img 
                        src={issue.imageUrls[0]} 
                        alt="Issue thumbnail" 
                        className="w-8 h-8 rounded object-cover"
                      />
                    )}
                    <div>
                      <p className="text-sm font-medium" data-testid={`text-title-${issue.id}`}>
                        {issue.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {issue.address}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm" data-testid={`text-category-${issue.id}`}>
                  {issue.category?.name}
                </td>
                <td className="px-4 py-4">
                  <StatusBadge status={issue.status} />
                </td>
                <td className="px-4 py-4">
                  {issue.priority && (
                    <Badge variant="outline" className={`text-xs ${getPriorityColor(issue.priority)}`}>
                      {issue.priority}
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-4 text-sm" data-testid={`text-assignee-${issue.id}`}>
                  {issue.assignee?.name || 'Unassigned'}
                </td>
                <td className="px-4 py-4 text-sm text-muted-foreground">
                  {format(new Date(issue.createdAt), 'MMM d, yyyy')}
                </td>
                <td className="px-4 py-4">
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" data-testid={`button-edit-${issue.id}`}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" data-testid={`button-view-${issue.id}`}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" data-testid={`button-assign-${issue.id}`}>
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bulk Actions & Pagination */}
      <CardContent className="p-4 border-t border-border flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <span className="text-sm text-muted-foreground" data-testid="text-selected-count">
            {selectedIssues.length} items selected
          </span>
          <Button variant="outline" size="sm" disabled={selectedIssues.length === 0} data-testid="button-bulk-assign">
            Bulk Assign
          </Button>
          <Button variant="outline" size="sm" disabled={selectedIssues.length === 0} data-testid="button-bulk-status">
            Bulk Status
          </Button>
          <Button variant="outline" size="sm" disabled={selectedIssues.length === 0} data-testid="button-export-selected">
            Export Selected
          </Button>
        </div>
        
        {totalPages > 1 && (
          <nav className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setFilters({ ...filters, page: filters.page - 1 })} 
              disabled={filters.page === 1}
              data-testid="button-previous-page"
            >
              Previous
            </Button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  variant={filters.page === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilters({ ...filters, page: pageNum })}
                  data-testid={`button-page-${pageNum}`}
                >
                  {pageNum}
                </Button>
              );
            })}
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setFilters({ ...filters, page: filters.page + 1 })} 
              disabled={filters.page === totalPages}
              data-testid="button-next-page"
            >
              Next
            </Button>
          </nav>
        )}
      </CardContent>
    </Card>
  );
}
