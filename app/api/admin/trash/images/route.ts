import { verifyToken } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const images = await db.collection('images')
      .find({ status: 'deleted' })
      .sort({ deletedAt: -1 })
      .toArray();

    return NextResponse.json({ images });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch trash' }, { status: 500 });
  }
}
