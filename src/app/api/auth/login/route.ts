import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';
import { createToken, User } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const result = await pool.query(
      'SELECT id, username, password, full_name, role, status FROM users WHERE username = $1',
      [username]
    );
    const rows = result.rows;

    const users = rows as User[];
    if (users.length === 0) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const user = users[0];

    if (user.status !== 'active') {
      return NextResponse.json({ error: 'Your account is inactive. Contact administrator.' }, { status: 403 });
    }

    const passwordMatch = await bcrypt.compare(password, (user as unknown as { password: string }).password);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const token = await createToken({
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      status: user.status,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
      },
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error?.message || error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
