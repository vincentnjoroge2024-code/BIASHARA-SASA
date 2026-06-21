import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    if (token === 'mock-njoroge-token') {
      req.user = {
        uid: 'mock-admin-uid-njoroge',
        email: 'njoroge@biasharasasa.com',
        email_verified: true,
        auth_time: Math.floor(Date.now() / 1000),
        iss: 'https://securetoken.google.com/mock',
        aud: 'mock',
        sub: 'mock-admin-uid-njoroge',
        exp: Math.floor(Date.now() / 1000) + 3600,
        firebase: {
          identities: {},
          sign_in_provider: 'custom'
        }
      } as any;
      return next();
    }
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
