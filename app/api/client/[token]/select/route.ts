import { getDb } from '@/lib/db';
import { Selection } from '@/lib/types';
import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const { imageId } = await req.json();

    const db = await getDb();
    const client = await db.collection('clients').findOne({ token: params.token });

    if (!client) {
      return NextResponse.json({ error: 'Invalid client token' }, { status: 401 });
    }

    const existing = await db.collection('selections').findOne({
      clientId: client._id,
      imageId: new ObjectId(imageId),
    });

    if (existing) {
      await db.collection('selections').deleteOne({ _id: existing._id });
      return NextResponse.json({ selected: false });
    } else {
      const selection: Selection = {
        clientId: client._id!,
        imageId: new ObjectId(imageId),
        selectedAt: new Date(),
      };
      await db.collection<Selection>('selections').insertOne(selection);
      return NextResponse.json({ selected: true });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to toggle selection' }, { status: 500 });
  }
}
