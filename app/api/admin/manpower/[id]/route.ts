import { verifyToken } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { Manpower } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET single manpower
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const manpower = await db
      .collection<Manpower>('manpower')
      .findOne({ id: parseInt(params.id), status: 'active' });

    if (!manpower) {
      return NextResponse.json({ error: 'Manpower not found' }, { status: 404 });
    }

    return NextResponse.json({ manpower });
  } catch (error) {
    console.error('Error fetching manpower:', error);
    return NextResponse.json({ error: 'Failed to fetch manpower' }, { status: 500 });
  }
}

// PUT update manpower
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const db = await getDb();

    const result = await db
      .collection<Manpower>('manpower')
      .updateOne(
        { id: parseInt(params.id), status: 'active' },
        {
          $set: {
            name: body.name,
            whatsapp: body.whatsapp,
            specialty: body.specialty,
            rates: body.rates,
          },
        }
      );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Manpower not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating manpower:', error);
    return NextResponse.json({ error: 'Failed to update manpower' }, { status: 500 });
  }
}

// DELETE manpower
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const result = await db
      .collection<Manpower>('manpower')
      .updateOne(
        { id: parseInt(params.id) },
        { $set: { status: 'deleted' } }
      );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Manpower not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting manpower:', error);
    return NextResponse.json({ error: 'Failed to delete manpower' }, { status: 500 });
  }
}
