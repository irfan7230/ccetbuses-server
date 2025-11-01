import { Response, NextFunction } from 'express';
import { auth, db } from '../config/firebase';
import { AuthRequest } from '../types';
import logger from '../utils/logger';

/**
 * Middleware to verify Firebase ID token
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized: No token provided',
      });
      return;
    }

    const idToken = authHeader.split('Bearer ')[1];

    // Verify the Firebase ID token
    const decodedToken = await auth.verifyIdToken(idToken);
    
    // Get user role from Firestore
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      role: userData?.role || 'student',
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid token',
    });
  }
};

/**
 * Alias for authenticate (for compatibility)
 */
export const authenticateToken = authenticate;

/**
 * Middleware to check if user is a driver
 */
export const requireDriver = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
    return;
  }

  if (req.user.role !== 'driver') {
    res.status(403).json({
      success: false,
      message: 'Forbidden: Driver access required',
    });
    return;
  }

  next();
};

/**
 * Middleware to check if user is a student
 */
export const requireStudent = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
    return;
  }

  if (req.user.role !== 'student') {
    res.status(403).json({
      success: false,
      message: 'Forbidden: Student access required',
    });
    return;
  }

  next();
};

/**
 * Middleware to check if user has one of the required roles
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Required role(s): ${allowedRoles.join(', ')}`,
      });
      return;
    }

    next();
  };
};
