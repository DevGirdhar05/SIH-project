import { queryClient } from './queryClient';

interface NotificationData {
  type: string;
  data?: any;
  message: string;
}

class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: ((data: NotificationData) => void)[] = [];

  connect() {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No authentication token found');
      return;
    }

    try {
      // Use the same host and port as the main application
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws?token=${encodeURIComponent(token)}`;
      
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data: NotificationData = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.ws = null;
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }

  private handleMessage(data: NotificationData) {
    console.log('WebSocket message received:', data);
    
    // Notify all listeners
    this.listeners.forEach(listener => listener(data));

    // Handle specific notification types
    switch (data.type) {
      case 'new_issue':
      case 'issue_updated':
      case 'issue_status_change':
        // Invalidate relevant queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/issues'] });
        queryClient.invalidateQueries({ queryKey: ['/api/issues/my'] });
        queryClient.invalidateQueries({ queryKey: ['/api/analytics'] });
        break;
      
      case 'issue_assigned':
        queryClient.invalidateQueries({ queryKey: ['/api/issues'] });
        queryClient.invalidateQueries({ queryKey: ['/api/issues/my'] });
        break;
    }

    // Show toast notification if there's a message
    if (data.message) {
      this.showNotification(data);
    }
  }

  private showNotification(data: NotificationData) {
    // Try to use the browser's Notification API if available and permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('CivicConnect', {
        body: data.message,
        icon: '/favicon.ico',
        tag: data.type
      });
    }
    
    // Also dispatch a custom event for in-app notifications
    window.dispatchEvent(new CustomEvent('civic-notification', { detail: data }));
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max WebSocket reconnect attempts reached');
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    console.log(`Attempting to reconnect WebSocket in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  addListener(listener: (data: NotificationData) => void) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Request notification permission
  static async requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }
}

export const webSocketClient = new WebSocketClient();