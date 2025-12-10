import { verifyToken } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { Booking } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reason } = await request.json();

    if (!reason || reason.trim() === '') {
      return NextResponse.json({ error: 'Cancellation reason is required' }, { status: 400 });
    }

    const db = await getDb();
    const bookingId = parseInt(params.id);

    // Check if booking exists and is active
    const existingBooking = await db
      .collection<Booking>('bookings')
      .findOne({ id: bookingId, status: 'active' });

    if (!existingBooking) {
      return NextResponse.json({ error: 'Active booking not found' }, { status: 404 });
    }

    // Cancel the booking by updating status and adding cancellation data
    const result = await db
      .collection<Booking>('bookings')
      .updateOne(
        { id: bookingId },
        {
          $set: {
            status: 'cancelled',
            cancelledAt: new Date(),
            cancellationReason: reason.trim(),
          }
        }
      );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 });
    }

    // Get the updated booking
    const cancelledBooking = await db
      .collection<Booking>('bookings')
      .findOne({ id: bookingId });

    return NextResponse.json({
      message: 'Booking cancelled successfully',
      booking: cancelledBooking,
    });

  } catch (error) {
    console.error('Error cancelling booking:', error);
    return NextResponse.json(
      { error: 'Failed to cancel booking' },
      { status: 500 }
    );
  }
}