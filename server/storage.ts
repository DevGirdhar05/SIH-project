import { 
  users, departments, wards, categories, issues, issueEvents, 
  comments, notifications, slaBreaches,
  type User, type InsertUser, type Department, type InsertDepartment,
  type Ward, type InsertWard, type Category, type InsertCategory,
  type Issue, type InsertIssue, type IssueEvent, type Comment, 
  type InsertComment, type Notification, type InsertNotification,
  type IssueWithRelations, type UserWithStats
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, count, sql, ilike, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;
  getUsersWithStats(): Promise<UserWithStats[]>;

  // Department operations
  getDepartments(): Promise<Department[]>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  
  // Ward operations
  getWards(): Promise<Ward[]>;
  createWard(ward: InsertWard): Promise<Ward>;
  
  // Category operations
  getCategories(): Promise<Category[]>;
  getCategoriesByDepartment(departmentId: string): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Issue operations
  getIssues(params: {
    status?: string;
    categoryId?: string;
    wardId?: string;
    departmentId?: string;
    reporterId?: string;
    assigneeId?: string;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ issues: IssueWithRelations[], total: number }>;
  getIssue(id: string): Promise<IssueWithRelations | undefined>;
  getIssueByTicketNo(ticketNo: string): Promise<IssueWithRelations | undefined>;
  createIssue(issue: InsertIssue): Promise<Issue>;
  updateIssue(id: string, issue: Partial<InsertIssue>): Promise<Issue>;
  getIssueStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    byCategory: Record<string, number>;
    byWard: Record<string, number>;
  }>;
  
  // Comment operations
  getCommentsByIssue(issueId: string): Promise<(Comment & { author: User })[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  
  // Event operations
  createIssueEvent(event: Omit<IssueEvent, 'id' | 'createdAt'>): Promise<IssueEvent>;
  
  // Notification operations
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getUsersWithStats(): Promise<UserWithStats[]> {
    const usersWithStats = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        phone: users.phone,
        role: users.role,
        wardId: users.wardId,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        fcmToken: users.fcmToken,
        locale: users.locale,
        password: users.password,
        issueCount: sql<number>`count(${issues.id})`.mapWith(Number),
        resolvedCount: sql<number>`count(case when ${issues.status} = 'RESOLVED' then 1 end)`.mapWith(Number)
      })
      .from(users)
      .leftJoin(issues, eq(issues.assigneeId, users.id))
      .where(inArray(users.role, ['OFFICER', 'SUPERVISOR']))
      .groupBy(users.id)
      .orderBy(asc(users.name));
    
    return usersWithStats;
  }

  async getDepartments(): Promise<Department[]> {
    return await db.select().from(departments).orderBy(asc(departments.name));
  }

  async createDepartment(department: InsertDepartment): Promise<Department> {
    const [newDept] = await db.insert(departments).values(department).returning();
    return newDept;
  }

  async getWards(): Promise<Ward[]> {
    return await db.select().from(wards).orderBy(asc(wards.name));
  }

  async createWard(ward: InsertWard): Promise<Ward> {
    const [newWard] = await db.insert(wards).values(ward).returning();
    return newWard;
  }

  async getCategories(): Promise<Category[]> {
    return await db
      .select()
      .from(categories)
      .orderBy(asc(categories.name));
  }

  async getCategoriesByDepartment(departmentId: string): Promise<Category[]> {
    return await db
      .select()
      .from(categories)
      .where(eq(categories.departmentId, departmentId))
      .orderBy(asc(categories.name));
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async getIssues(params: {
    status?: string;
    categoryId?: string;
    wardId?: string;
    departmentId?: string;
    reporterId?: string;
    assigneeId?: string;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ issues: IssueWithRelations[], total: number }> {
    const { page = 1, limit = 10, search, ...filters } = params;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    
    if (filters.status) {
      whereConditions.push(eq(issues.status, filters.status as any));
    }
    if (filters.categoryId) {
      whereConditions.push(eq(issues.categoryId, filters.categoryId));
    }
    if (filters.wardId) {
      whereConditions.push(eq(issues.wardId, filters.wardId));
    }
    if (filters.departmentId) {
      whereConditions.push(eq(issues.departmentId, filters.departmentId));
    }
    if (filters.reporterId) {
      whereConditions.push(eq(issues.reporterId, filters.reporterId));
    }
    if (filters.assigneeId) {
      whereConditions.push(eq(issues.assigneeId, filters.assigneeId));
    }
    if (search) {
      whereConditions.push(ilike(issues.title, `%${search}%`));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const [issuesResult, totalResult] = await Promise.all([
      db
        .select({
          id: issues.id,
          ticketNo: issues.ticketNo,
          title: issues.title,
          description: issues.description,
          status: issues.status,
          priority: issues.priority,
          priorityScore: issues.priorityScore,
          address: issues.address,
          imageUrls: issues.imageUrls,
          videoUrls: issues.videoUrls,
          createdAt: issues.createdAt,
          updatedAt: issues.updatedAt,
          resolvedAt: issues.resolvedAt,
          rejectedReason: issues.rejectedReason,
          categoryId: issues.categoryId,
          wardId: issues.wardId,
          departmentId: issues.departmentId,
          reporterId: issues.reporterId,
          assigneeId: issues.assigneeId,
          duplicateOfIssueId: issues.duplicateOfIssueId,
          latitude: issues.latitude,
          longitude: issues.longitude,
          category: {
            id: categories.id,
            name: categories.name,
            code: categories.code,
            icon: categories.icon,
            slaHours: categories.slaHours,
            priorityWeight: categories.priorityWeight,
            departmentId: categories.departmentId,
            createdAt: categories.createdAt
          },
          ward: {
            id: wards.id,
            name: wards.name,
            code: wards.code,
            geojson: wards.geojson,
            createdAt: wards.createdAt
          },
          department: {
            id: departments.id,
            name: departments.name,
            code: departments.code,
            email: departments.email,
            phone: departments.phone,
            createdAt: departments.createdAt
          },
          reporter: {
            id: users.id,
            name: users.name,
            email: users.email,
            phone: users.phone,
            role: users.role,
            wardId: users.wardId,
            fcmToken: users.fcmToken,
            locale: users.locale,
            isActive: users.isActive,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
            password: users.password
          }
        })
        .from(issues)
        .leftJoin(categories, eq(issues.categoryId, categories.id))
        .leftJoin(wards, eq(issues.wardId, wards.id))
        .leftJoin(departments, eq(issues.departmentId, departments.id))
        .leftJoin(users, eq(issues.reporterId, users.id))
        .where(whereClause)
        .orderBy(desc(issues.createdAt))
        .limit(limit)
        .offset(offset),
      
      db
        .select({ count: count() })
        .from(issues)
        .where(whereClause)
    ]);

    const transformedIssues: IssueWithRelations[] = issuesResult.map(row => ({
      id: row.id,
      ticketNo: row.ticketNo,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      priorityScore: row.priorityScore,
      address: row.address,
      imageUrls: row.imageUrls,
      videoUrls: row.videoUrls,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      resolvedAt: row.resolvedAt,
      rejectedReason: row.rejectedReason,
      categoryId: row.categoryId,
      wardId: row.wardId,
      departmentId: row.departmentId,
      reporterId: row.reporterId,
      assigneeId: row.assigneeId,
      duplicateOfIssueId: row.duplicateOfIssueId,
      latitude: row.latitude,
      longitude: row.longitude,
      category: row.category?.id ? row.category : undefined,
      ward: row.ward?.id ? row.ward : undefined,
      department: row.department?.id ? row.department : undefined,
      reporter: row.reporter?.id ? row.reporter : undefined
    }));

    return {
      issues: transformedIssues,
      total: totalResult[0].count
    };
  }

  async getIssue(id: string): Promise<IssueWithRelations | undefined> {
    const result = await this.getIssues({ page: 1, limit: 1 });
    const [issue] = await db
      .select()
      .from(issues)
      .where(eq(issues.id, id));
      
    if (!issue) return undefined;

    const [category, ward, department, reporter, assignee] = await Promise.all([
      issue.categoryId ? db.select().from(categories).where(eq(categories.id, issue.categoryId)).then(r => r[0]) : null,
      issue.wardId ? db.select().from(wards).where(eq(wards.id, issue.wardId)).then(r => r[0]) : null,
      issue.departmentId ? db.select().from(departments).where(eq(departments.id, issue.departmentId)).then(r => r[0]) : null,
      db.select().from(users).where(eq(users.id, issue.reporterId)).then(r => r[0]),
      issue.assigneeId ? db.select().from(users).where(eq(users.id, issue.assigneeId)).then(r => r[0]) : null,
    ]);

    const commentsWithAuthors = await this.getCommentsByIssue(id);
    
    return {
      ...issue,
      category: category || undefined,
      ward: ward || undefined,
      department: department || undefined,
      reporter: reporter || undefined,
      assignee: assignee || undefined,
      comments: commentsWithAuthors
    };
  }

  async getIssueByTicketNo(ticketNo: string): Promise<IssueWithRelations | undefined> {
    const [issue] = await db
      .select()
      .from(issues)
      .where(eq(issues.ticketNo, ticketNo));
      
    if (!issue) return undefined;
    return this.getIssue(issue.id);
  }

  async createIssue(issue: InsertIssue): Promise<Issue> {
    // Generate ticket number
    const ticketNo = `CR-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    
    const [newIssue] = await db
      .insert(issues)
      .values({ ...issue, ticketNo })
      .returning();
    
    return newIssue;
  }

  async updateIssue(id: string, updateData: Partial<InsertIssue>): Promise<Issue> {
    const [updatedIssue] = await db
      .update(issues)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(issues.id, id))
      .returning();
    
    return updatedIssue;
  }

  async getIssueStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    byCategory: Record<string, number>;
    byWard: Record<string, number>;
  }> {
    const [totalCount, statusStats, priorityStats, categoryStats, wardStats] = await Promise.all([
      db.select({ count: count() }).from(issues),
      db
        .select({ status: issues.status, count: count() })
        .from(issues)
        .groupBy(issues.status),
      db
        .select({ priority: issues.priority, count: count() })
        .from(issues)
        .groupBy(issues.priority),
      db
        .select({ name: categories.name, count: count() })
        .from(issues)
        .leftJoin(categories, eq(issues.categoryId, categories.id))
        .groupBy(categories.name),
      db
        .select({ name: wards.name, count: count() })
        .from(issues)
        .leftJoin(wards, eq(issues.wardId, wards.id))
        .groupBy(wards.name)
    ]);

    return {
      total: totalCount[0].count,
      byStatus: Object.fromEntries(statusStats.map(s => [s.status, s.count])),
      byPriority: Object.fromEntries(priorityStats.map(p => [p.priority || 'UNKNOWN', p.count])),
      byCategory: Object.fromEntries(categoryStats.map(c => [c.name || 'UNKNOWN', c.count])),
      byWard: Object.fromEntries(wardStats.map(w => [w.name || 'UNKNOWN', w.count]))
    };
  }

  async getCommentsByIssue(issueId: string): Promise<(Comment & { author: User })[]> {
    const commentsWithAuthors = await db
      .select({
        id: comments.id,
        issueId: comments.issueId,
        authorId: comments.authorId,
        body: comments.body,
        attachments: comments.attachments,
        createdAt: comments.createdAt,
        author: {
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
          role: users.role,
          wardId: users.wardId,
          fcmToken: users.fcmToken,
          locale: users.locale,
          isActive: users.isActive,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
          password: users.password
        }
      })
      .from(comments)
      .innerJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.issueId, issueId))
      .orderBy(asc(comments.createdAt));

    return commentsWithAuthors.map(row => ({
      id: row.id,
      issueId: row.issueId,
      authorId: row.authorId,
      body: row.body,
      attachments: row.attachments,
      createdAt: row.createdAt,
      author: row.author
    }));
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();
    return newComment;
  }

  async createIssueEvent(event: Omit<IssueEvent, 'id' | 'createdAt'>): Promise<IssueEvent> {
    const [newEvent] = await db.insert(issueEvents).values({
      ...event,
      createdAt: new Date()
    }).returning();
    return newEvent;
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.recipientId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }
}

export const storage = new DatabaseStorage();
