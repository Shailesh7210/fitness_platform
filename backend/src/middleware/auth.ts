import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id:    string;
    role:  string;
    email: string;
  };
}

// ── Check if user is logged in ──────────────────────────────────────
export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No token provided. Please log in.' });
    return;
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as any;

    req.user = {
      id:    decoded.id,
      role:  decoded.role,
      email: decoded.email,
    };
    next();
  } catch {
    res.status(401).json({ message: 'Token expired or invalid. Please log in again.' });
  }
}

// ── Check if user is admin ──────────────────────────────────────────
export function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ message: 'Access denied. Admins only.' });
    return;
  }
  next();
}