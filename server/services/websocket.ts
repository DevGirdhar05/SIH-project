import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import { storage } from '../storage';

export interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  userRole?: string;
}

class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients = new Map<string, AuthenticatedWebSocket>();

  init(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws'
    });

    this.wss.on('connection', this.handleConnection.bind(this));
  }

  private async handleConnection(ws: AuthenticatedWebSocket, request: any) {
    try {
      // Extract token from query string
      const url = new URL(request.url!, `http://${request.headers.host}`);
      const token = url.searchParams.get('token');

      if (!token) {
        ws.close(1008, 'Authentication required');
        return;
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
      const user = await storage.getUser(decoded.userId);

      if (!user) {
        ws.close(1008, 'Invalid user');
        return;
      }

      ws.userId = user.id;
      ws.userRole = user.role;
      
      // Store client connection
      this.clients.set(user.id, ws);

      // Send welcome message
      this.sendToUser(user.id, {
        type: 'connected',
        message: 'Connected to real-time notifications'
      });

      // Handle client disconnect
      ws.on('close', () => {
        this.clients.delete(user.id);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(user.id);
      });

    } catch (error) {
      console.error('WebSocket authentication error:', error);
      ws.close(1008, 'Authentication failed');
    }
  }

  // Send notification to specific user
  sendToUser(userId: string, data: any) {
    const client = this.clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  }

  // Send notification to all users with specific role
  sendToRole(role: string, data: any) {
    this.clients.forEach((client, userId) => {
      if (client.userRole === role && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }

  // Send notification to all connected users
  broadcast(data: any) {
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }

  // Notify about new issue
  notifyNewIssue(issue: any) {
    // Notify all officers and supervisors
    this.sendToRole('OFFICER', {
      type: 'new_issue',
      data: issue,
      message: `New issue reported: ${issue.title}`
    });

    this.sendToRole('SUPERVISOR', {
      type: 'new_issue', 
      data: issue,
      message: `New issue reported: ${issue.title}`
    });

    this.sendToRole('ADMIN', {
      type: 'new_issue',
      data: issue,
      message: `New issue reported: ${issue.title}`
    });
  }

  // Notify about issue status update
  notifyIssueUpdate(issue: any, oldStatus: string, newStatus: string) {
    // Notify the reporter
    this.sendToUser(issue.reporterId, {
      type: 'issue_updated',
      data: issue,
      message: `Your issue "${issue.title}" status changed from ${oldStatus} to ${newStatus}`
    });

    // Notify assigned user if any
    if (issue.assigneeId) {
      this.sendToUser(issue.assigneeId, {
        type: 'issue_assigned',
        data: issue,
        message: `Issue "${issue.title}" has been assigned to you`
      });
    }

    // Notify supervisors and admins
    this.sendToRole('SUPERVISOR', {
      type: 'issue_status_change',
      data: issue,
      message: `Issue "${issue.title}" status changed to ${newStatus}`
    });

    this.sendToRole('ADMIN', {
      type: 'issue_status_change',
      data: issue,
      message: `Issue "${issue.title}" status changed to ${newStatus}`
    });
  }

  // Notify about issue assignment
  notifyIssueAssignment(issue: any, assigneeId: string) {
    this.sendToUser(assigneeId, {
      type: 'issue_assigned',
      data: issue,
      message: `New issue "${issue.title}" has been assigned to you`
    });

    this.sendToUser(issue.reporterId, {
      type: 'issue_assigned',
      data: issue,
      message: `Your issue "${issue.title}" has been assigned for resolution`
    });
  }
}

export const webSocketService = new WebSocketService();