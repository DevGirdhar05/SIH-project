import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export class FileUploadService {
  private uploadDir = process.env.UPLOAD_DIR || "uploads";

  constructor() {
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    if (!existsSync(this.uploadDir)) {
      await mkdir(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const fileExtension = file.originalname.split('.').pop() || 'bin';
    const fileName = `${randomUUID()}.${fileExtension}`;
    const filePath = join(this.uploadDir, fileName);

    await writeFile(filePath, file.buffer);

    // Return the URL path for accessing the file
    // In production, this would be a CDN URL or S3 URL
    return `/uploads/${fileName}`;
  }

  async uploadMultiple(files: Express.Multer.File[]): Promise<string[]> {
    const uploadPromises = files.map(file => this.uploadFile(file));
    return Promise.all(uploadPromises);
  }

  validateFile(file: Express.Multer.File): boolean {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error(`File type ${file.mimetype} is not allowed`);
    }

    if (file.size > maxSize) {
      throw new Error('File size exceeds 10MB limit');
    }

    return true;
  }
}

export const fileUploadService = new FileUploadService();
