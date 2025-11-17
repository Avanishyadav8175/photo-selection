import { verifyToken } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const db = await getDb();
    const folders = await db.collection('folders')
      .find({
        createdBy: new ObjectId(payload.adminId),
        status: 'deleted'
      })
      .sort({ deletedAt: -1 })
      .toArray();

    return NextResponse.json({ folders });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch trash' }, { status: 500 });
  }
}
