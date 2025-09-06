import { sql, relations } from "drizzle-orm";
import { 
  pgTable, 
  varchar, 
  text, 
  timestamp, 
  boolean, 
  integer, 
  decimal,
  jsonb,
  pgEnum,
  geometry
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum('user_role', ['CITIZEN', 'OFFICER', 'SUPERVISOR', 'ADMIN']);
export const issueStatusEnum = pgEnum('issue_status', [
  'DRAFT', 'SUBMITTED', 'TRIAGED', 'ASSIGNED', 'IN_PROGRESS', 'PENDING_USER_INFO', 'RESOLVED', 'REJECTED'
]);
export const issuePriorityEnum = pgEnum('issue_priority', ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export const eventTypeEnum = pgEnum('event_type', [
  'STATUS_CHANGE', 'COMMENT', 'ASSIGN', 'ESCALATE', 'MERGE_DUPLICATE'
]);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  name: text("name").notNull(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default('CITIZEN'),
  wardId: varchar("ward_id"),
  fcmToken: text("fcm_token"),
  locale: varchar("locale", { length: 10 }).default('en'),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Departments table
export const departments = pgTable("departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: varchar("code", { length: 10 }).notNull().unique(),
  email: text("email"),
  phone: varchar("phone", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow()
});

// Wards table
export const wards = pgTable("wards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: varchar("code", { length: 10 }).notNull().unique(),
  geojson: jsonb("geojson"),
  createdAt: timestamp("created_at").defaultNow()
});

// Categories table
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  icon: text("icon"),
  slaHours: integer("sla_hours").notNull().default(72),
  priorityWeight: integer("priority_weight").default(1),
  departmentId: varchar("department_id").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

// Issues table
export const issues = pgTable("issues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketNo: varchar("ticket_no", { length: 20 }).notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  categoryId: varchar("category_id").notNull(),
  wardId: varchar("ward_id"),
  departmentId: varchar("department_id"),
  reporterId: varchar("reporter_id").notNull(),
  assigneeId: varchar("assignee_id"),
  status: issueStatusEnum("status").notNull().default('DRAFT'),
  priority: issuePriorityEnum("priority").default('MEDIUM'),
  priorityScore: integer("priority_score").default(0),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  address: text("address"),
  imageUrls: text("image_urls").array().default([]),
  videoUrls: text("video_urls").array().default([]),
  duplicateOfIssueId: varchar("duplicate_of_issue_id"),
  rejectedReason: text("rejected_reason"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Issue events table
export const issueEvents = pgTable("issue_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  issueId: varchar("issue_id").notNull(),
  actorId: varchar("actor_id").notNull(),
  type: eventTypeEnum("type").notNull(),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at").defaultNow()
});

// Comments table
export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  issueId: varchar("issue_id").notNull(),
  authorId: varchar("author_id").notNull(),
  body: text("body").notNull(),
  attachments: text("attachments").array().default([]),
  createdAt: timestamp("created_at").defaultNow()
});

// SLA Breaches table
export const slaBreaches = pgTable("sla_breaches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  issueId: varchar("issue_id").notNull(),
  breachedAt: timestamp("breached_at").notNull(),
  resolvedAt: timestamp("resolved_at"),
  escalatedToUserId: varchar("escalated_to_user_id"),
  createdAt: timestamp("created_at").defaultNow()
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  recipientId: varchar("recipient_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  payload: jsonb("payload"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  ward: one(wards, {
    fields: [users.wardId],
    references: [wards.id],
  }),
  reportedIssues: many(issues, { relationName: "reporter" }),
  assignedIssues: many(issues, { relationName: "assignee" }),
  comments: many(comments),
  events: many(issueEvents),
  notifications: many(notifications)
}));

export const departmentsRelations = relations(departments, ({ many }) => ({
  categories: many(categories),
  issues: many(issues)
}));

export const wardsRelations = relations(wards, ({ many }) => ({
  users: many(users),
  issues: many(issues)
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  department: one(departments, {
    fields: [categories.departmentId],
    references: [departments.id],
  }),
  issues: many(issues)
}));

export const issuesRelations = relations(issues, ({ one, many }) => ({
  category: one(categories, {
    fields: [issues.categoryId],
    references: [categories.id],
  }),
  ward: one(wards, {
    fields: [issues.wardId],
    references: [wards.id],
  }),
  department: one(departments, {
    fields: [issues.departmentId],
    references: [departments.id],
  }),
  reporter: one(users, {
    fields: [issues.reporterId],
    references: [users.id],
    relationName: "reporter"
  }),
  assignee: one(users, {
    fields: [issues.assigneeId],
    references: [users.id],
    relationName: "assignee"
  }),
  events: many(issueEvents),
  comments: many(comments),
  slaBreaches: many(slaBreaches)
}));

export const issueEventsRelations = relations(issueEvents, ({ one }) => ({
  issue: one(issues, {
    fields: [issueEvents.issueId],
    references: [issues.id],
  }),
  actor: one(users, {
    fields: [issueEvents.actorId],
    references: [users.id],
  })
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  issue: one(issues, {
    fields: [comments.issueId],
    references: [issues.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  })
}));

export const slaBreachesRelations = relations(slaBreaches, ({ one }) => ({
  issue: one(issues, {
    fields: [slaBreaches.issueId],
    references: [issues.id],
  }),
  escalatedToUser: one(users, {
    fields: [slaBreaches.escalatedToUserId],
    references: [users.id],
  })
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  recipient: one(users, {
    fields: [notifications.recipientId],
    references: [users.id],
  })
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
  createdAt: true
});

export const insertWardSchema = createInsertSchema(wards).omit({
  id: true,
  createdAt: true
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true
});

export const insertIssueSchema = createInsertSchema(issues).omit({
  id: true,
  ticketNo: true,
  createdAt: true,
  updatedAt: true
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;

export type Ward = typeof wards.$inferSelect;
export type InsertWard = z.infer<typeof insertWardSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Issue = typeof issues.$inferSelect;
export type InsertIssue = z.infer<typeof insertIssueSchema>;

export type IssueEvent = typeof issueEvents.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type SLABreach = typeof slaBreaches.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Extended types for API responses
export type IssueWithRelations = Issue & {
  category?: Category;
  ward?: Ward;
  department?: Department;
  reporter?: User;
  assignee?: User;
  events?: IssueEvent[];
  comments?: (Comment & { author?: User })[];
};

export type UserWithStats = User & {
  issueCount?: number;
  resolvedCount?: number;
};
