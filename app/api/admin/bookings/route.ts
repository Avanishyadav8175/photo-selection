import { verifyToken } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { Booking } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET all bookings
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const bookings = await db
      .collection<Booking>('bookings')
      .find({ status: 'active' })
      .sort({ mainEventDate: -1 })
      .toArray();

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

// POST create new booking
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const db = await getDb();

    const booking: Booking = {
      id: Date.now(),
      name: body.name,
      mobile: body.mobile,
      whatsapp: body.whatsapp,
      customerAddress: body.customerAddress,
      venueAddress: body.venueAddress,
      eventType: body.eventType,
      mainEventDate: body.mainEventDate,
      events: body.events || [],
      total: body.total,
      due: body.due,
      note: body.note,
      payments: body.payments || [],
      expenses: body.expenses || [],
      createdAt: new Date(),
      status: 'active',
    };

    const result = await db.collection<Booking>('bookings').insertOne(booking);

    return NextResponse.json({
      success: true,
      bookingId: result.insertedId,
      booking,
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}
