import { useEffect, useState } from 'react';
import { webSocketClient } from '@/lib/websocket';
import { useToast } from '@/hooks/use-toast';

interface NotificationData {
  type: string;
  data?: any;
  message: string;
}

export function useNotifications() {
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Request notification permission on component mount
    requestNotificationPermission();

    // Connect to WebSocket
    webSocketClient.connect();

    // Add listener for WebSocket notifications
    const removeListener = webSocketClient.addListener((data: NotificationData) => {
      setNotifications(prev => [data, ...prev.slice(0, 9)]); // Keep last 10 notifications
      
      // Show toast notification
      toast({
        title: getNotificationTitle(data.type),
        description: data.message,
        duration: 5000,
      });
    });

    // Listen for custom notification events (for in-app notifications)
    const handleCustomNotification = (event: Event) => {
      const customEvent = event as CustomEvent;
      const data = customEvent.detail as NotificationData;
      setNotifications(prev => [data, ...prev.slice(0, 9)]);
    };

    window.addEventListener('civic-notification', handleCustomNotification);

    // Cleanup on unmount
    return () => {
      removeListener();
      window.removeEventListener('civic-notification', handleCustomNotification);
      webSocketClient.disconnect();
    };
  }, [toast]);

  const clearNotifications = () => {
    setNotifications([]);
  };

  const clearNotification = (index: number) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  };

  return {
    isConnected,
    notifications,
    clearNotifications,
    clearNotification,
  };
}

// Request notification permission
async function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return Notification.permission === 'granted';
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