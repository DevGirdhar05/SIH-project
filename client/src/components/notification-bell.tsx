import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/use-notifications';
import { formatDistanceToNow } from 'date-fns';

interface NotificationData {
  type: string;
  data?: any;
  message: string;
}

export function NotificationBell() {
  const { notifications, clearNotifications, clearNotification } = useNotifications();
  const unreadCount = notifications.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          data-testid="button-notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notifications
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearNotifications}
              data-testid="button-clear-notifications"
            >
              Clear all
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            No new notifications
          </div>
        ) : (
          <ScrollArea className="h-96">
            {notifications.map((notification, index) => (
              <DropdownMenuItem
                key={index}
                className="flex items-start p-3 cursor-pointer"
                onSelect={(e) => e.preventDefault()}
                data-testid={`notification-item-${index}`}
              >
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">
                    {getNotificationTitle(notification.type)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Just now
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearNotification(index)}
                  className="h-6 w-6 p-0"
                  data-testid={`button-dismiss-notification-${index}`}
                >
                  <X className="h-3 w-3" />
                </Button>
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function getNotificationTitle(type: string): string {
  switch (type) {
    case 'new_issue':
      return 'New Issue Reported';
    case 'issue_updated':
      return 'Issue Updated';
    case 'issue_status_change':
      return 'Status Changed';
    case 'issue_assigned':
      return 'Issue Assigned';
    case 'connected':
      return 'Connected';
    default:
      return 'Notification';
  }
}