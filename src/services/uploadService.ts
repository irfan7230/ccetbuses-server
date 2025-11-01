import cloudinary from '../config/cloudinary';
import { UploadResult } from '../types';
import logger from '../utils/logger';
import { Readable } from 'stream';

class UploadService {
  /**
   * Upload image to Cloudinary
   */
  async uploadImage(
    fileBuffer: Buffer,
    folder: string = 'sundhara-travels'
  ): Promise<UploadResult> {
    try {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'image',
            transformation: [
              { width: 1000, height: 1000, crop: 'limit' },
              { quality: 'auto' },
              { fetch_format: 'auto' },
            ],
          },
          (error, result) => {
            if (error) {
              logger.error('Cloudinary image upload error:', error);
              reject(error);
            } else if (result) {
              resolve({
                url: result.secure_url,
                publicId: result.public_id,
                format: result.format,
                resourceType: result.resource_type,
              });
            }
          }
        );

        const bufferStream = Readable.from(fileBuffer);
        bufferStream.pipe(uploadStream);
      });
    } catch (error) {
      logger.error('Upload image error:', error);
      throw error;
    }
  }

  /**
   * Upload voice message to Cloudinary
   */
  async uploadVoice(
    fileBuffer: Buffer,
    folder: string = 'sundhara-travels/voice'
  ): Promise<UploadResult> {
    try {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'video', // Cloudinary treats audio as video
            format: 'm4a',
          },
          (error, result) => {
            if (error) {
              logger.error('Cloudinary voice upload error:', error);
              reject(error);
            } else if (result) {
              resolve({
                url: result.secure_url,
                publicId: result.public_id,
                format: result.format,
                resourceType: result.resource_type,
              });
            }
          }
        );

        const bufferStream = Readable.from(fileBuffer);
        bufferStream.pipe(uploadStream);
      });
    } catch (error) {
      logger.error('Upload voice error:', error);
      throw error;
    }
  }

  /**
   * Delete resource from Cloudinary
   */
  async deleteResource(publicId: string, resourceType: 'image' | 'video' = 'image'): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      logger.info(`Deleted resource: ${publicId}`);
    } catch (error) {
      logger.error('Delete resource error:', error);
      throw error;
    }
  }

  /**
   * Upload profile image (smaller size, optimized)
   */
  async uploadProfileImage(fileBuffer: Buffer): Promise<UploadResult> {
    try {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'sundhara-travels/profiles',
            resource_type: 'image',
            transformation: [
              { width: 500, height: 500, crop: 'fill', gravity: 'face' },
              { quality: 'auto:good' },
              { fetch_format: 'auto' },
            ],
          },
          (error, result) => {
            if (error) {
              logger.error('Cloudinary profile image upload error:', error);
              reject(error);
            } else if (result) {
              resolve({
                url: result.secure_url,
                publicId: result.public_id,
                format: result.format,
                resourceType: result.resource_type,
              });
            }
          }
        );

        const bufferStream = Readable.from(fileBuffer);
        bufferStream.pipe(uploadStream);
      });
    } catch (error) {
      logger.error('Upload profile image error:', error);
      throw error;
    }
  }
}

export default new UploadService();
