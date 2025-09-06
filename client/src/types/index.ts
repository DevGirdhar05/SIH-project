export type UserRole = 'CITIZEN' | 'OFFICER' | 'SUPERVISOR' | 'ADMIN';

export type IssueStatus = 
  | 'DRAFT' 
  | 'SUBMITTED' 
  | 'TRIAGED' 
  | 'ASSIGNED' 
  | 'IN_PROGRESS' 
  | 'PENDING_USER_INFO' 
  | 'RESOLVED' 
  | 'REJECTED';

export type IssuePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  wardId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  code: string;
  icon?: string;
  slaHours: number;
  priorityWeight: number;
  departmentId: string;
}

export interface Ward {
  id: string;
  name: string;
  code: string;
  geojson?: any;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  email?: string;
  phone?: string;
}

export interface Issue {
  id: string;
  ticketNo: string;
  title: string;
  description: string;
  categoryId: string;
  wardId?: string;
  departmentId?: string;
  reporterId: string;
  assigneeId?: string;
  status: IssueStatus;
  priority?: IssuePriority;
  priorityScore?: number;
  location?: {
    lat: number;
    lng: number;
  };
  address?: string;
  imageUrls: string[];
  videoUrls: string[];
  duplicateOfIssueId?: string;
  rejectedReason?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  ward?: Ward;
  department?: Department;
  reporter?: User;
  assignee?: User;
  comments?: Comment[];
}

export interface Comment {
  id: string;
  issueId: string;
  authorId: string;
  body: string;
  attachments: string[];
  createdAt: string;
  author?: User;
}

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IssueStats {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byCategory: Record<string, number>;
  byWard: Record<string, number>;
}
