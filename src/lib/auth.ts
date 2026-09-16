import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is not set');
  return new TextEncoder().encode(secret);
}

export interface User {
  id: number;
  username: string;
  full_name: string;
  role: 'admin' | 'reception' | 'storekeeper' | 'security';
  status: string;
}

export async function createToken(user: User): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<User | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as User;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireAuth(): Promise<User> {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  return user;
}

export async function requireRole(roles: string[]): Promise<User> {
  const user = await requireAuth();
  if (!roles.includes(user.role)) throw new Error('Insufficient permissions');
  return user;
}

export function isAdmin(user: User): boolean {
  return user.role === 'admin';
}

export async function findUserByUsername(username: string) {
  return prisma.users.findUnique({ where: { username } });
}
