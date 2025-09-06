import { apiRequest } from "./queryClient";

export class ApiClient {
  private baseUrl = "/api";

  // Auth methods
  async login(email: string, password: string) {
    const response = await apiRequest("POST", `${this.baseUrl}/auth/login`, {
      email,
      password,
    });
    return response.json();
  }

  async register(userData: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    role?: string;
  }) {
    const response = await apiRequest("POST", `${this.baseUrl}/auth/register`, userData);
    return response.json();
  }

  async refreshToken(refreshToken: string) {
    const response = await apiRequest("POST", `${this.baseUrl}/auth/refresh`, {
      refreshToken,
    });
    return response.json();
  }

  async getCurrentUser() {
    const response = await apiRequest("GET", `${this.baseUrl}/auth/me`);
    return response.json();
  }

  // Issue methods
  async createIssue(issueData: any) {
    const response = await apiRequest("POST", `${this.baseUrl}/issues`, issueData);
    return response.json();
  }

  async getMyIssues(params: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", params.page.toString());
    if (params.limit) searchParams.set("limit", params.limit.toString());
    if (params.status) searchParams.set("status", params.status);

    const response = await apiRequest("GET", `${this.baseUrl}/issues/my?${searchParams}`);
    return response.json();
  }

  async getIssue(ticketNo: string) {
    const response = await apiRequest("GET", `${this.baseUrl}/issues/${ticketNo}`);
    return response.json();
  }

  async addComment(issueId: string, body: string, attachments: string[] = []) {
    const response = await apiRequest("POST", `${this.baseUrl}/issues/${issueId}/comments`, {
      body,
      attachments,
    });
    return response.json();
  }

  // Admin methods
  async getAdminIssues(params: {
    page?: number;
    limit?: number;
    status?: string;
    categoryId?: string;
    wardId?: string;
    departmentId?: string;
    search?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.set(key, value.toString());
    });

    const response = await apiRequest("GET", `${this.baseUrl}/admin/issues?${searchParams}`);
    return response.json();
  }

  async updateIssueStatus(issueId: string, status: string, rejectedReason?: string) {
    const response = await apiRequest("PATCH", `${this.baseUrl}/admin/issues/${issueId}/status`, {
      status,
      rejectedReason,
    });
    return response.json();
  }

  async assignIssue(issueId: string, assigneeId: string) {
    const response = await apiRequest("PATCH", `${this.baseUrl}/admin/issues/${issueId}/assign`, {
      assigneeId,
    });
    return response.json();
  }

  async getAnalytics() {
    const response = await apiRequest("GET", `${this.baseUrl}/admin/analytics/overview`);
    return response.json();
  }

  async getUsers() {
    const response = await apiRequest("GET", `${this.baseUrl}/admin/users`);
    return response.json();
  }

  // Catalog methods
  async getCategories() {
    const response = await apiRequest("GET", `${this.baseUrl}/catalog/categories`);
    return response.json();
  }

  async getWards() {
    const response = await apiRequest("GET", `${this.baseUrl}/catalog/wards`);
    return response.json();
  }

  async getDepartments() {
    const response = await apiRequest("GET", `${this.baseUrl}/catalog/departments`);
    return response.json();
  }

  // File upload
  async uploadFiles(files: File[]) {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    const response = await fetch(`${this.baseUrl}/media/upload`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
  }
}

export const apiClient = new ApiClient();
