import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../db';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
    role: 'admin' | 'customer';
  };
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Session expired or invalid token. Please log in again.' });
  }

  (req as any).user = decoded;
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    const user = (req as any).user;
    if (user && user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    }
  });
}
