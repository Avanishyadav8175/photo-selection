import { generateToken, verifyPassword } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { Admin } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const db = await getDb();
    const admin = await db.collection<Admin>('admins').findOne({ email });

    if (!admin || !(await verifyPassword(password, admin.passwordHash))) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = generateToken(admin._id!);

    return NextResponse.json({ token, admin: { id: admin._id, name: admin.name, email: admin.email } });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
