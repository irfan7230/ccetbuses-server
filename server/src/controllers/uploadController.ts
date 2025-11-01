import { Response } from 'express';
import { AuthRequest } from '../types';
import uploadService from '../services/uploadService';
import logger from '../utils/logger';
import multer from 'multer';

// Configure multer for memory storage
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (_req, file, cb) => {
    // Accept images and audio
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and audio files are allowed.'));
    }
  },
});

class UploadController {
  /**
   * Upload profile image
   */
  async uploadProfileImage(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No file provided',
        });
        return;
      }

      const result = await uploadService.uploadProfileImage(req.file.buffer);

      res.json({
        success: true,
        message: 'Profile image uploaded successfully',
        data: result,
      });
    } catch (error) {
      logger.error('Error uploading profile image:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload profile image',
      });
    }
  }

  /**
   * Upload chat image
   */
  async uploadChatImage(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No file provided',
        });
        return;
      }

      const result = await uploadService.uploadImage(
        req.file.buffer,
        'sundhara-travels/chat'
      );

      res.json({
        success: true,
        message: 'Chat image uploaded successfully',
        data: result,
      });
    } catch (error) {
      logger.error('Error uploading chat image:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload chat image',
      });
    }
  }

  /**
   * Upload voice message
   */
  async uploadVoiceMessage(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No file provided',
        });
        return;
      }

      const result = await uploadService.uploadVoice(req.file.buffer);

      res.json({
        success: true,
        message: 'Voice message uploaded successfully',
        data: result,
      });
    } catch (error) {
      logger.error('Error uploading voice message:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload voice message',
      });
    }
  }
}

export default new UploadController();
