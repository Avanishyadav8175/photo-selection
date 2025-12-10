import { verifyToken } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { Booking } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();

    // Get all cancelled bookings
    const cancelledBookings = await db
      .collection<Booking>('bookings')
      .find({
        status: 'cancelled',
        cancelledAt: { $exists: true }
      })
      .sort({ cancelledAt: -1 })
      .toArray();

    return NextResponse.json({
      bookings: cancelledBookings,
      total: cancelledBookings.length,
    });

  } catch (error) {
    console.error('Error fetching cancelled bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cancelled bookings' },
      { status: 500 }
    );
  }
}