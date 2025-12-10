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

    const db = await getDb();
    const bookingId = parseInt(params.id);

    // Check if booking exists and is cancelled
    const existingBooking = await db
      .collection<Booking>('bookings')
      .findOne({ id: bookingId, status: 'cancelled' });

    if (!existingBooking) {
      return NextResponse.json({ error: 'Cancelled booking not found' }, { status: 404 });
    }

    if (!existingBooking.cancelledAt) {
      return NextResponse.json({ error: 'Booking is not cancelled' }, { status: 400 });
    }

    // Reactivate the booking by removing cancellation data
    const result = await db
      .collection<Booking>('bookings')
      .updateOne(
        { id: bookingId },
        {
          $set: {
            status: 'active',
          },
          $unset: {
            cancelledAt: '',
            cancellationReason: '',
          }
        }
      );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Failed to reactivate booking' }, { status: 500 });
    }

    // Get the updated booking
    const reactivatedBooking = await db
      .collection<Booking>('bookings')
      .findOne({ id: bookingId });

    return NextResponse.json({
      message: 'Booking reactivated successfully',
      booking: reactivatedBooking,
    });

  } catch (error) {
    console.error('Error reactivating booking:', error);
    return NextResponse.json(
      { error: 'Failed to reactivate booking' },
      { status: 500 }
    );
  }
}