import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import * as multer from 'multer';

export const multerConfig: MulterOptions = {
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, callback) => {
    if (!file.mimetype.startsWith('image/')) {
      return callback(new BadRequestException('Unsupported file type'), false);
    }
    callback(null, true);
  },
};

export const multerConfigProvider = (
  fileType: 'img' | 'zip',
  limit: number = 5 * 1024 * 1024,
): MulterOptions => {
  const mimeType = [];

  if (fileType === 'img') {
    mimeType.push(...['image/jpg', 'image/png']);
  }

  return {
    storage: multer.memoryStorage(),
    limits: {
      fileSize: limit,
    },
    fileFilter: (req, file, callback) => {
      if (!mimeType.includes(file.mimetype)) {
        return callback(
          new BadRequestException('Unsupported file type'),
          false,
        );
      }
      callback(null, true);
    },
  };
};
