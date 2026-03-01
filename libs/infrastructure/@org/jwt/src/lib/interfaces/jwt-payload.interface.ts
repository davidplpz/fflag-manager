export interface JwtPayload {
  sub: string; // user ID
  email: string;
  role: 'admin' | 'viewer';
  iat: number; // issued at
  exp: number; // expiration
}
