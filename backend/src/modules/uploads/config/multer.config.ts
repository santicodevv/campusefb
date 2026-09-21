import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { BadRequestException } from '@nestjs/common';

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/jpg',
  'application/pdf',
];

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf'];

// Max file size: 5MB
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Base upload directory
const UPLOAD_BASE_DIR = join(process.cwd(), 'uploads');

// Ensure directories exist
const ensureDir = (dir: string) => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
};

// Profile photos storage
export const profilePhotoStorage = diskStorage({
  destination: (req, file, cb) => {
    const dir = join(UPLOAD_BASE_DIR, 'profile-photos');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const userId = (req as any).user?.id || 'unknown';
    const timestamp = Date.now();
    const ext = extname(file.originalname).toLowerCase();
    cb(null, `user-${userId}-${timestamp}${ext}`);
  },
});

// Documents storage
export const documentsStorage = diskStorage({
  destination: (req, file, cb) => {
    const dir = join(UPLOAD_BASE_DIR, 'documents');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const userId = (req as any).user?.id || 'unknown';
    const timestamp = Date.now();
    const ext = extname(file.originalname).toLowerCase();
    const sanitizedName = file.originalname
      .replace(ext, '')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 50);
    cb(null, `user-${userId}-${sanitizedName}-${timestamp}${ext}`);
  },
});

// File filter for images only (profile photos)
export const imageFileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: any,
) => {
  const ext = extname(file.originalname).toLowerCase();
  const allowedImageExts = ['.jpg', '.jpeg', '.png'];
  const allowedImageMimes = ['image/jpeg', 'image/png', 'image/jpg'];

  if (
    !allowedImageMimes.includes(file.mimetype) ||
    !allowedImageExts.includes(ext)
  ) {
    return cb(
      new BadRequestException('Solo se permiten archivos JPG o PNG'),
      false,
    );
  }
  cb(null, true);
};

// File filter for documents (PDF, JPG, PNG)
export const documentFileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: any,
) => {
  const ext = extname(file.originalname).toLowerCase();

  if (
    !ALLOWED_MIME_TYPES.includes(file.mimetype) ||
    !ALLOWED_EXTENSIONS.includes(ext)
  ) {
    return cb(
      new BadRequestException('Solo se permiten archivos PDF, JPG o PNG'),
      false,
    );
  }
  cb(null, true);
};
