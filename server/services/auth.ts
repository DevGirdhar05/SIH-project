import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "civic-connect-jwt-secret";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "civic-connect-refresh-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

export class AuthService {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async generateTokens(user: User): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      wardId: user.wardId
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: "civic-connect",
      audience: "civic-connect-users"
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(
      { id: user.id, tokenType: "refresh" },
      JWT_REFRESH_SECRET,
      {
        expiresIn: JWT_REFRESH_EXPIRES_IN,
        issuer: "civic-connect",
        audience: "civic-connect-users"
      } as jwt.SignOptions
    );

    // Calculate expiration time in seconds
    const expiresIn = this.parseTimeToSeconds(JWT_EXPIRES_IN);

    return { accessToken, refreshToken, expiresIn };
  }

  async verifyAccessToken(token: string): Promise<{
    id: string;
    email: string;
    role: string;
    wardId?: string;
  }> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET, {
        issuer: "civic-connect",
        audience: "civic-connect-users"
      }) as any;

      return {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        wardId: decoded.wardId
      };
    } catch (error) {
      throw new Error("Invalid access token");
    }
  }

  async refreshTokens(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    try {
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET, {
        issuer: "civic-connect",
        audience: "civic-connect-users"
      }) as any;

      if (decoded.tokenType !== "refresh") {
        throw new Error("Invalid token type");
      }

      // In a production app, you'd fetch the user from database
      // and check if the refresh token is still valid
      const { storage } = await import("../storage");
      const user = await storage.getUser(decoded.id);
      
      if (!user || !user.isActive) {
        throw new Error("User not found or inactive");
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new Error("Invalid refresh token");
    }
  }

  private parseTimeToSeconds(timeStr: string): number {
    const unit = timeStr.slice(-1);
    const value = parseInt(timeStr.slice(0, -1));

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 24 * 60 * 60;
      default: return 900; // default 15 minutes
    }
  }
}

export const authService = new AuthService();
