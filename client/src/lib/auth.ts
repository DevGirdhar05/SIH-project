import { apiClient } from "./api";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class AuthManager {
  private static instance: AuthManager;
  private tokens: AuthTokens | null = null;
  private refreshPromise: Promise<AuthTokens> | null = null;

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  constructor() {
    this.loadTokensFromStorage();
  }

  private loadTokensFromStorage() {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      const expiresIn = localStorage.getItem('expiresIn');

      if (accessToken && refreshToken && expiresIn) {
        this.tokens = {
          accessToken,
          refreshToken,
          expiresIn: parseInt(expiresIn, 10),
        };
      }
    } catch (error) {
      console.warn('Failed to load tokens from storage:', error);
    }
  }

  private saveTokensToStorage(tokens: AuthTokens) {
    try {
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      localStorage.setItem('expiresIn', tokens.expiresIn.toString());
      this.tokens = tokens;
    } catch (error) {
      console.error('Failed to save tokens to storage:', error);
    }
  }

  private clearTokensFromStorage() {
    try {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('expiresIn');
      this.tokens = null;
    } catch (error) {
      console.warn('Failed to clear tokens from storage:', error);
    }
  }

  async login(email: string, password: string): Promise<any> {
    try {
      const response = await apiClient.login(email, password);
      
      if (response.accessToken && response.refreshToken) {
        this.saveTokensToStorage({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          expiresIn: response.expiresIn,
        });
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  async register(userData: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    role?: string;
  }): Promise<any> {
    try {
      const response = await apiClient.register(userData);
      
      if (response.accessToken && response.refreshToken) {
        this.saveTokensToStorage({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          expiresIn: response.expiresIn,
        });
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  logout() {
    this.clearTokensFromStorage();
    window.location.href = '/';
  }

  getAccessToken(): string | null {
    return this.tokens?.accessToken || null;
  }

  async getValidAccessToken(): Promise<string | null> {
    if (!this.tokens) {
      return null;
    }

    // Check if token needs refresh (refresh 5 minutes before expiry)
    const now = Date.now() / 1000;
    const tokenIssuedAt = this.extractTokenIssuedAt(this.tokens.accessToken);
    const expiresAt = tokenIssuedAt + this.tokens.expiresIn;
    
    if (now + 300 >= expiresAt) { // 5 minutes buffer
      try {
        await this.refreshTokens();
      } catch (error) {
        console.error('Token refresh failed:', error);
        this.logout();
        return null;
      }
    }

    return this.tokens?.accessToken || null;
  }

  private extractTokenIssuedAt(token: string): number {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.iat || 0;
    } catch {
      return 0;
    }
  }

  private async refreshTokens(): Promise<AuthTokens> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    if (!this.tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    this.refreshPromise = apiClient.refreshToken(this.tokens.refreshToken)
      .then((response) => {
        const newTokens = {
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          expiresIn: response.expiresIn,
        };
        this.saveTokensToStorage(newTokens);
        return newTokens;
      })
      .finally(() => {
        this.refreshPromise = null;
      });

    return this.refreshPromise;
  }

  isAuthenticated(): boolean {
    return !!this.tokens?.accessToken;
  }
}

export const authManager = AuthManager.getInstance();
