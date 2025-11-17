import { verifyToken } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { Manpower } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET all manpower
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const manpower = await db
      .collection<Manpower>('manpower')
      .find({ status: 'active' })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ manpower });
  } catch (error) {
    console.error('Error fetching manpower:', error);
    return NextResponse.json({ error: 'Failed to fetch manpower' }, { status: 500 });
  }
}

// POST create new manpower
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const db = await getDb();

    const manpower: Manpower = {
      id: Date.now(),
      name: body.name,
      whatsapp: body.whatsapp,
      specialty: body.specialty,
      rates: body.rates,
      createdAt: new Date(),
      status: 'active',
    };

    const result = await db.collection<Manpower>('manpower').insertOne(manpower);

    return NextResponse.json({
      success: true,
      manpowerId: result.insertedId,
      manpower,
    });
  } catch (error) {
    console.error('Error creating manpower:', error);
    return NextResponse.json({ error: 'Failed to create manpower' }, { status: 500 });
  }
}
