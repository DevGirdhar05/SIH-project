import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { IssueStatus } from "../../types";

interface StatusBadgeProps {
  status: IssueStatus;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusConfig = (status: IssueStatus) => {
    switch (status) {
      case 'DRAFT':
        return {
          label: 'Draft',
          className: 'status-draft bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
        };
      case 'SUBMITTED':
        return {
          label: 'Submitted',
          className: 'status-submitted',
        };
      case 'TRIAGED':
        return {
          label: 'Triaged',
          className: 'status-triaged',
        };
      case 'ASSIGNED':
        return {
          label: 'Assigned',
          className: 'status-assigned',
        };
      case 'IN_PROGRESS':
        return {
          label: 'In Progress',
          className: 'status-in-progress',
        };
      case 'PENDING_USER_INFO':
        return {
          label: 'Pending Info',
          className: 'status-pending-user-info',
        };
      case 'RESOLVED':
        return {
          label: 'Resolved',
          className: 'status-resolved',
        };
      case 'REJECTED':
        return {
          label: 'Rejected',
          className: 'status-rejected',
        };
      default:
        return {
          label: status,
          className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge 
      className={cn("px-2 py-1 text-xs font-medium", config.className, className)}
      data-testid={`badge-status-${status.toLowerCase()}`}
    >
      {config.label}
    </Badge>
  );
}
