import { verifyToken } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { Booking } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// POST add payment
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
    const db = await getDb();

    // Get current booking
    const booking = await db
      .collection<Booking>('bookings')
      .findOne({ id: parseInt(params.id), status: 'active' });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const payment = {
      id: Date.now(),
      amount: body.amount,
      date: body.date,
      mode: body.mode,
      note: body.note,
    };

    // Calculate new due amount
    const totalPaid = (booking.payments || []).reduce((sum, p) => sum + p.amount, 0) + body.amount;
    const newDue = booking.total - totalPaid;

    const result = await db
      .collection<Booking>('bookings')
      .updateOne(
        { id: parseInt(params.id), status: 'active' },
        {
          $push: { payments: payment },
          $set: { due: newDue },
        }
      );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, payment });
  } catch (error) {
    console.error('Error adding payment:', error);
    return NextResponse.json({ error: 'Failed to add payment' }, { status: 500 });
  }
}
