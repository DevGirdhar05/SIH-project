import { Issue } from "../../types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Eye, Star, MapPin, Calendar } from "lucide-react";
import StatusBadge from "./status-badge";
import { format } from "date-fns";

interface IssueCardProps {
  issue: Issue;
  showActions?: boolean;
  onViewDetails?: (issue: Issue) => void;
  onAddComment?: (issue: Issue) => void;
  onRate?: (issue: Issue) => void;
}

export default function IssueCard({ 
  issue, 
  showActions = false, 
  onViewDetails, 
  onAddComment, 
  onRate 
}: IssueCardProps) {
  const getPriorityClass = (priority?: string) => {
    switch (priority) {
      case 'HIGH': return 'priority-high';
      case 'MEDIUM': return 'priority-medium';
      case 'LOW': return 'priority-low';
      case 'CRITICAL': return 'priority-critical';
      default: return '';
    }
  };

  const getStatusSteps = () => {
    const steps = [
      { key: 'SUBMITTED', label: 'Submitted', completed: false },
      { key: 'TRIAGED', label: 'Triaged', completed: false },
      { key: 'ASSIGNED', label: 'Assigned', completed: false },
      { key: 'IN_PROGRESS', label: 'In Progress', completed: false },
      { key: 'RESOLVED', label: 'Resolved', completed: false },
    ];

    const statusOrder = ['SUBMITTED', 'TRIAGED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'];
    const currentIndex = statusOrder.indexOf(issue.status);

    steps.forEach((step, index) => {
      if (index <= currentIndex) {
        step.completed = true;
      }
      if (index === currentIndex) {
        step.label = step.label; // Current step
      }
    });

    return steps;
  };

  const statusSteps = getStatusSteps();

  return (
    <Card className={`border border-border ${getPriorityClass(issue.priority)}`} data-testid={`card-issue-${issue.ticketNo}`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="font-semibold text-lg" data-testid={`text-issue-title-${issue.id}`}>
                {issue.title}
              </h3>
              <StatusBadge status={issue.status} />
              {issue.priority && (
                <Badge variant="outline" className={`text-xs ${
                  issue.priority === 'HIGH' ? 'border-red-500 text-red-700' :
                  issue.priority === 'MEDIUM' ? 'border-yellow-500 text-yellow-700' :
                  issue.priority === 'LOW' ? 'border-green-500 text-green-700' :
                  'border-red-700 text-red-800'
                }`}>
                  {issue.priority}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-2" data-testid={`text-issue-ticket-${issue.id}`}>
              Ticket #{issue.ticketNo} • {issue.category?.name}
            </p>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <MapPin className="h-3 w-3" />
                <span>{issue.address || 'Location not specified'}</span>
              </div>
              {issue.ward && (
                <span>Ward: {issue.ward.name}</span>
              )}
            </div>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <div className="flex items-center space-x-1 mb-1">
              <Calendar className="h-3 w-3" />
              <span>Reported: {format(new Date(issue.createdAt), 'MMM d, yyyy')}</span>
            </div>
            <p>Updated: {format(new Date(issue.updatedAt), 'MMM d, yyyy')}</p>
          </div>
        </div>

        {/* Progress Timeline */}
        <div className="mb-4">
          <div className="flex items-center space-x-4 text-sm">
            {statusSteps.map((step, index) => (
              <div key={step.key} className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  step.completed ? 'bg-success' : 
                  step.key === issue.status ? 'bg-warning animate-pulse' : 
                  'bg-muted'
                }`}></div>
                <span className={
                  step.completed ? 'text-success' : 
                  step.key === issue.status ? 'text-warning font-medium' : 
                  'text-muted-foreground'
                }>
                  {step.label}
                </span>
                {index < statusSteps.length - 1 && (
                  <div className="w-4 h-px bg-border"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Latest Update */}
        {issue.status === 'IN_PROGRESS' && (
          <div className="bg-accent p-3 rounded-lg mb-4">
            <p className="text-sm font-medium">Latest Update:</p>
            <p className="text-sm text-muted-foreground">
              Work is currently in progress. We'll keep you updated on the status.
            </p>
          </div>
        )}

        {issue.status === 'RESOLVED' && issue.resolvedAt && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 rounded-lg mb-4">
            <p className="text-sm font-medium text-green-800 dark:text-green-400">Issue Resolved</p>
            <p className="text-sm text-green-700 dark:text-green-300">
              Resolved on {format(new Date(issue.resolvedAt), 'MMM d, yyyy')}. Thank you for reporting this issue!
            </p>
          </div>
        )}

        {issue.status === 'REJECTED' && issue.rejectedReason && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-lg mb-4">
            <p className="text-sm font-medium text-red-800 dark:text-red-400">Issue Rejected</p>
            <p className="text-sm text-red-700 dark:text-red-300">{issue.rejectedReason}</p>
          </div>
        )}

        {/* Action Buttons */}
        {showActions && (
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              {issue.imageUrls && issue.imageUrls.length > 0 && (
                <div className="flex items-center space-x-2">
                  <img 
                    src={issue.imageUrls[0]} 
                    alt="Issue thumbnail" 
                    className="w-8 h-8 rounded object-cover"
                    data-testid={`img-thumbnail-${issue.id}`}
                  />
                  {issue.imageUrls.length > 1 && (
                    <span className="text-xs text-muted-foreground">
                      +{issue.imageUrls.length - 1} more
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onAddComment?.(issue)}
                data-testid={`button-comment-${issue.id}`}
              >
                <MessageSquare className="mr-1 h-3 w-3" />
                Comment
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onViewDetails?.(issue)}
                data-testid={`button-view-details-${issue.id}`}
              >
                <Eye className="mr-1 h-3 w-3" />
                View Details
              </Button>
              {issue.status === 'RESOLVED' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onRate?.(issue)}
                  data-testid={`button-rate-${issue.id}`}
                >
                  <Star className="mr-1 h-3 w-3" />
                  Rate
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
