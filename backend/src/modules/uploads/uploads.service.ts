import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { UserDocument, DocumentType } from './entities/user-document.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor(
    @InjectRepository(UserDocument)
    private readonly documentRepository: Repository<UserDocument>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Update user profile photo
   */
  async updateProfilePhoto(
    userId: number,
    file: Express.Multer.File,
  ): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Delete old profile photo if exists
    if (user.profilePhotoUrl) {
      const oldPath = join(process.cwd(), user.profilePhotoUrl);
      if (existsSync(oldPath)) {
        try {
          unlinkSync(oldPath);
        } catch (e) {
          this.logger.warn(`Failed to delete old profile photo: ${oldPath}`);
        }
      }
    }

    // Save new profile photo URL (relative path)
    user.profilePhotoUrl = `uploads/profile-photos/${file.filename}`;
    return this.userRepository.save(user);
  }

  /**
   * Upload a document for a user
   */
  async uploadDocument(
    userId: number,
    documentType: DocumentType,
    file: Express.Multer.File,
  ): Promise<UserDocument> {
    // Check if document of this type already exists
    const existing = await this.documentRepository.findOne({
      where: { userId, documentType },
    });

    if (existing) {
      // Delete the old file
      const oldPath = join(process.cwd(), existing.filePath);
      if (existsSync(oldPath)) {
        try {
          unlinkSync(oldPath);
        } catch (e) {
          this.logger.warn(`Failed to delete old document: ${oldPath}`);
        }
      }

      // Update existing record
      existing.originalFilename = file.originalname;
      existing.filePath = `uploads/documents/${file.filename}`;
      existing.mimeType = file.mimetype;
      existing.fileSize = file.size;
      return this.documentRepository.save(existing);
    }

    // Create new document record
    const document = this.documentRepository.create({
      userId,
      documentType,
      originalFilename: file.originalname,
      filePath: `uploads/documents/${file.filename}`,
      mimeType: file.mimetype,
      fileSize: file.size,
    });

    return this.documentRepository.save(document);
  }

  /**
   * Get all documents for a user
   */
  async getUserDocuments(userId: number): Promise<UserDocument[]> {
    return this.documentRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get a single document by ID
   */
  async getDocumentById(documentId: number): Promise<UserDocument> {
    const document = await this.documentRepository.findOne({
      where: { id: documentId },
    });
    if (!document) {
      throw new NotFoundException('Documento no encontrado');
    }
    return document;
  }

  /**
   * Delete a document
   */
  async deleteDocument(documentId: number, userId: number): Promise<void> {
    const document = await this.documentRepository.findOne({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Documento no encontrado');
    }

    if (document.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para eliminar este documento');
    }

    // Delete the file
    const filePath = join(process.cwd(), document.filePath);
    if (existsSync(filePath)) {
      try {
        unlinkSync(filePath);
      } catch (e) {
        this.logger.warn(`Failed to delete document file: ${filePath}`);
      }
    }

    await this.documentRepository.remove(document);
  }

  /**
   * Admin: Get documents for any user
   */
  async getDocumentsByUserId(userId: number): Promise<UserDocument[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return this.documentRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Delete profile photo
   */
  async deleteProfilePhoto(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (user.profilePhotoUrl) {
      const photoPath = join(process.cwd(), user.profilePhotoUrl);
      if (existsSync(photoPath)) {
        try {
          unlinkSync(photoPath);
        } catch (e) {
          this.logger.warn(`Failed to delete profile photo: ${photoPath}`);
        }
      }
      user.profilePhotoUrl = '';
      return this.userRepository.save(user);
    }

    return user;
  }
}
