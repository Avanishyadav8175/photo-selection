import { verifyToken } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { Booking } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// POST assign team
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { assignments } = body;
    const db = await getDb();

    // Get current booking
    const booking = await db
      .collection<Booking>('bookings')
      .findOne({ id: parseInt(params.id), status: 'active' });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Update team assignments for each event
    const updatedEvents = booking.events.map((event) => ({
      ...event,
      team: assignments[event.name] || [],
    }));

    const result = await db
      .collection<Booking>('bookings')
      .updateOne(
        { id: parseInt(params.id), status: 'active' },
        { $set: { events: updatedEvents } }
      );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error assigning team:', error);
    return NextResponse.json({ error: 'Failed to assign team' }, { status: 500 });
  }
}
