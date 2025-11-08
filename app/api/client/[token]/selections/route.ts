import { getDb } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const db = await getDb();
    const client = await db.collection('clients').findOne({ token: params.token });

    if (!client) {
      return NextResponse.json({ error: 'Invalid client token' }, { status: 401 });
    }

    const selections = await db.collection('selections')
      .find({ clientId: client._id })
      .toArray();

    return NextResponse.json({ selections: selections.map(s => s.imageId.toString()) });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch selections' }, { status: 500 });
  }
}
