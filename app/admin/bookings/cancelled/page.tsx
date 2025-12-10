'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Booking {
  id: number;
  name: string;
  mobile: string;
  eventType: string;
  mainEventDate: string;
  total: number;
  due: number;
  events: any[];
  payments: any[];
  cancelledAt: string;
  cancellationReason: string;
}

export default function CancelledBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadCancelledBookings();
  }, []);

  const loadCancelledBookings = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/bookings/cancelled', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings);
      }
    } catch (error) {
      console.error('Failed to load cancelled bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.mobile.includes(searchTerm);

    return matchesSearch;
  });

  const totalCancelledRevenue = bookings.reduce((sum, b) => sum + b.total, 0);
  const totalRefunded = bookings.reduce(
    (sum, b) => sum + (b.payments?.reduce((pSum, p) => pSum + p.amount, 0) || 0),
    0
  );

  const handleReactivate = async (bookingId: number) => {
    if (!confirm('Are you sure you want to reactivate this cancelled event?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/bookings/${bookingId}/reactivate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        alert('Event reactivated successfully');
        loadCancelledBookings();
      } else {
        alert('Failed to reactivate event');
      }
    } catch (error) {
      console.error('Failed to reactivate event:', error);
      alert('Failed to reactivate event');
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="text-indigo-600 hover:text-indigo-800 mb-4 flex items-center gap-2"
        >
          ← Back to Booking Management
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Cancelled Events</h1>
        <p className="text-gray-600">View and manage all cancelled events</p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
          <div className="text-sm text-gray-600 mb-1">Cancelled Events</div>
          <div className="text-3xl font-bold text-gray-900">{bookings.length}</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
          <div className="text-sm text-gray-600 mb-1">Lost Revenue</div>
          <div className="text-3xl font-bold text-gray-900">
            ₹{totalCancelledRevenue.toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
          <div className="text-sm text-gray-600 mb-1">Advance Received</div>
          <div className="text-3xl font-bold text-gray-900">
            ₹{totalRefunded.toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
          <div className="text-sm text-gray-600 mb-1">Refund Pending</div>
          <div className="text-3xl font-bold text-gray-900">
            ₹{(totalRefunded).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="search"
            placeholder="Search cancelled events by name or mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <div className="px-4 py-2 bg-red-100 text-red-800 rounded-lg font-medium">
            ❌ Showing Cancelled Events Only
          </div>
        </div>
      </div>

      {/* Cancelled Bookings List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading cancelled events...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No cancelled events</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm
                ? 'No cancelled events match your search'
                : 'Great! No events have been cancelled'}
            </p>
          </div>
        ) : (
          filteredBookings.map((booking) => {
            const totalPaid =
              booking.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
            const daysSinceCancellation = Math.floor(
              (new Date().getTime() - new Date(booking.cancelledAt).getTime()) / (1000 * 60 * 60 * 24)
            );

            return (
              <div
                key={booking.id}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-red-500"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {booking.name}
                      </h3>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        ❌ Cancelled
                      </span>
                      <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">
                        {daysSinceCancellation} days ago
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>📱 {booking.mobile}</div>
                      <div>
                        🎉 {booking.eventType.charAt(0).toUpperCase() + booking.eventType.slice(1)} was on{' '}
                        {new Date(booking.mainEventDate).toLocaleDateString()}
                      </div>
                      <div>
                        💰 Total: ₹{booking.total.toLocaleString()} | Advance Paid: ₹
                        {totalPaid.toLocaleString()}
                      </div>
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                        <div className="text-xs text-red-800 font-medium">Cancellation Reason:</div>
                        <div className="text-sm text-red-700">{booking.cancellationReason}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => router.push(`/admin/bookings/${booking.id}`)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleReactivate(booking.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                    >
                      🔄 Reactivate
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Summary Section */}
      {bookings.length > 0 && (
        <div className="mt-8 bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Cancellation Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                ₹{totalCancelledRevenue.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Lost Revenue</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                ₹{totalRefunded.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Advance to Refund</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">
                {bookings.length > 0 ? Math.round((bookings.length / (bookings.length + 10)) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-600">Cancellation Rate</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}