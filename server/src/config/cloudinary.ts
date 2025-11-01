import { v2 as cloudinary } from 'cloudinary';
import config from './index';
import logger from '../utils/logger';

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

logger.info('Cloudinary configured successfully');

export default cloudinary;
