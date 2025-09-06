import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authService } from "./services/auth";
import { authMiddleware, requireRole } from "./middleware/auth";
import { fileUploadService } from "./services/file-upload";
import { geolocationService } from "./services/geolocation";
import multer from "multer";
import { z } from "zod";
import { insertIssueSchema, insertCommentSchema, insertUserSchema } from "@shared/schema";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const registerSchema = insertUserSchema.extend({
  password: z.string().min(6)
});

const createIssueSchema = insertIssueSchema.extend({
  location: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional()
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check
  app.get("/api/health", async (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      const hashedPassword = await authService.hashPassword(validatedData.password);
      
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword
      });

      const tokens = await authService.generateTokens(user);
      
      res.json({
        user: { ...user, password: undefined },
        ...tokens
      });
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Registration failed" 
      });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const user = await storage.getUserByEmail(email);
      
      if (!user || !await authService.verifyPassword(password, user.password)) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (!user.isActive) {
        return res.status(403).json({ message: "Account is deactivated" });
      }

      const tokens = await authService.generateTokens(user);
      
      res.json({
        user: { ...user, password: undefined },
        ...tokens
      });
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Login failed" 
      });
    }
  });

  app.post("/api/auth/refresh", async (req, res) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(401).json({ message: "Refresh token required" });
      }

      const tokens = await authService.refreshTokens(refreshToken);
      res.json(tokens);
    } catch (error) {
      res.status(401).json({ message: "Invalid refresh token" });
    }
  });

  app.get("/api/auth/me", authMiddleware, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(500).json({ message: "Failed to get user data" });
    }
  });

  // File upload
  app.post("/api/media/upload", authMiddleware, upload.array('files', 5), async (req, res) => {
    try {
      if (!req.files || !Array.isArray(req.files)) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const uploadPromises = req.files.map(file => fileUploadService.uploadFile(file));
      const uploadedUrls = await Promise.all(uploadPromises);
      
      res.json({ urls: uploadedUrls });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "File upload failed" 
      });
    }
  });

  // Catalog endpoints
  app.get("/api/catalog/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get("/api/catalog/wards", async (req, res) => {
    try {
      const wards = await storage.getWards();
      res.json(wards);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch wards" });
    }
  });

  app.get("/api/catalog/departments", async (req, res) => {
    try {
      const departments = await storage.getDepartments();
      res.json(departments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch departments" });
    }
  });

  // Issue routes - Citizen
  app.post("/api/issues", authMiddleware, async (req, res) => {
    try {
      const validatedData = createIssueSchema.parse(req.body);
      const userId = req.user!.id;

      let latitude = null;
      let longitude = null;
      if (validatedData.location) {
        latitude = validatedData.location.lat.toString();
        longitude = validatedData.location.lng.toString();
        
        // Get address from coordinates
        try {
          const address = await geolocationService.reverseGeocode(
            validatedData.location.lat,
            validatedData.location.lng
          );
          validatedData.address = address;
        } catch (error) {
          console.warn("Geocoding failed:", error);
        }
      }

      // Auto-assign department based on category
      const category = await storage.getCategories();
      const selectedCategory = category.find(c => c.id === validatedData.categoryId);
      
      const issue = await storage.createIssue({
        ...validatedData,
        latitude,
        longitude,
        reporterId: userId,
        departmentId: selectedCategory?.departmentId || undefined,
        status: 'SUBMITTED'
      });

      // Create issue event
      await storage.createIssueEvent({
        issueId: issue.id,
        actorId: userId,
        type: 'STATUS_CHANGE',
        payload: { oldStatus: 'DRAFT', newStatus: 'SUBMITTED' }
      });

      res.status(201).json(issue);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to create issue" 
      });
    }
  });

  app.get("/api/issues/my", authMiddleware, async (req, res) => {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;

      const result = await storage.getIssues({
        reporterId: userId,
        status,
        page,
        limit
      });

      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch issues" });
    }
  });

  app.get("/api/issues/:ticketNo", authMiddleware, async (req, res) => {
    try {
      const { ticketNo } = req.params;
      const issue = await storage.getIssueByTicketNo(ticketNo);
      
      if (!issue) {
        return res.status(404).json({ message: "Issue not found" });
      }

      // Check if user can access this issue
      const userId = req.user!.id;
      const userRole = req.user!.role;
      
      if (userRole === 'CITIZEN' && issue.reporterId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(issue);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch issue" });
    }
  });

  app.post("/api/issues/:id/comments", authMiddleware, async (req, res) => {
    try {
      const { id: issueId } = req.params;
      const userId = req.user!.id;
      const commentData = insertCommentSchema.parse({
        ...req.body,
        issueId,
        authorId: userId
      });

      const comment = await storage.createComment(commentData);
      
      // Create issue event
      await storage.createIssueEvent({
        issueId,
        actorId: userId,
        type: 'COMMENT',
        payload: { commentId: comment.id }
      });

      res.status(201).json(comment);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to create comment" 
      });
    }
  });

  // Admin routes
  app.get("/api/admin/issues", authMiddleware, requireRole(['OFFICER', 'SUPERVISOR', 'ADMIN']), async (req, res) => {
    try {
      const {
        page = '1',
        limit = '10',
        status,
        categoryId,
        wardId,
        departmentId,
        search
      } = req.query;

      const result = await storage.getIssues({
        status: status as string,
        categoryId: categoryId as string,
        wardId: wardId as string,
        departmentId: departmentId as string,
        search: search as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });

      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch issues" });
    }
  });

  app.patch("/api/admin/issues/:id/status", authMiddleware, requireRole(['OFFICER', 'SUPERVISOR', 'ADMIN']), async (req, res) => {
    try {
      const { id } = req.params;
      const { status, rejectedReason } = req.body;
      const userId = req.user!.id;

      const currentIssue = await storage.getIssue(id);
      if (!currentIssue) {
        return res.status(404).json({ message: "Issue not found" });
      }

      const updateData: any = { status };
      if (status === 'RESOLVED') {
        updateData.resolvedAt = new Date();
      }
      if (status === 'REJECTED' && rejectedReason) {
        updateData.rejectedReason = rejectedReason;
      }

      const updatedIssue = await storage.updateIssue(id, updateData);

      // Create issue event
      await storage.createIssueEvent({
        issueId: id,
        actorId: userId,
        type: 'STATUS_CHANGE',
        payload: { oldStatus: currentIssue.status, newStatus: status, rejectedReason }
      });

      res.json(updatedIssue);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to update issue status" 
      });
    }
  });

  app.patch("/api/admin/issues/:id/assign", authMiddleware, requireRole(['SUPERVISOR', 'ADMIN']), async (req, res) => {
    try {
      const { id } = req.params;
      const { assigneeId } = req.body;
      const userId = req.user!.id;

      const updatedIssue = await storage.updateIssue(id, { 
        assigneeId,
        status: 'ASSIGNED'
      });

      // Create issue event
      await storage.createIssueEvent({
        issueId: id,
        actorId: userId,
        type: 'ASSIGN',
        payload: { assigneeId }
      });

      res.json(updatedIssue);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to assign issue" 
      });
    }
  });

  app.get("/api/admin/analytics/overview", authMiddleware, requireRole(['OFFICER', 'SUPERVISOR', 'ADMIN']), async (req, res) => {
    try {
      const stats = await storage.getIssueStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.get("/api/admin/users", authMiddleware, requireRole(['SUPERVISOR', 'ADMIN']), async (req, res) => {
    try {
      const users = await storage.getUsersWithStats();
      res.json(users.map(user => ({ ...user, password: undefined })));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
