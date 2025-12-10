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
}

export default function CompletedBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/bookings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings);
      }
    } catch (error) {
      console.error('Failed to load bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter to show only completed/expired bookings
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const completedBookings = bookings.filter((booking) => {
    const eventDate = new Date(booking.mainEventDate);
    return eventDate < today; // Only completed/expired events
  });

  const filteredBookings = completedBookings.filter((booking) => {
    const matchesSearch =
      booking.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.mobile.includes(searchTerm);

    return matchesSearch;
  });

  const totalPaid = completedBookings.reduce(
    (sum, b) => sum + (b.payments?.reduce((pSum, p) => pSum + p.amount, 0) || 0),
    0
  );

  const totalRevenue = completedBookings.reduce((sum, b) => sum + b.total, 0);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="text-indigo-600 hover:text-indigo-800 mb-4 flex items-center gap-2"
        >
          ← Back to Upcoming Events
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Completed Events</h1>
        <p className="text-gray-600">View all completed and expired events</p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
          <div className="text-sm text-gray-600 mb-1">Completed Events</div>
          <div className="text-3xl font-bold text-gray-900">{completedBookings.length}</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <div className="text-sm text-gray-600 mb-1">Total Revenue</div>
          <div className="text-3xl font-bold text-gray-900">
            ₹{totalRevenue.toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <div className="text-sm text-gray-600 mb-1">Total Collected</div>
          <div className="text-3xl font-bold text-gray-900">
            ₹{totalPaid.toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
          <div className="text-sm text-gray-600 mb-1">Events Covered</div>
          <div className="text-3xl font-bold text-gray-900">
            {completedBookings.reduce((sum, b) => sum + (b.events?.length || 0), 0)}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="search"
            placeholder="Search completed events by name or mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <div className="px-4 py-2 bg-orange-100 text-orange-800 rounded-lg font-medium">
            📋 Showing Completed Events Only
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading completed events...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No completed events found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm
                ? 'No completed events match your search'
                : 'No events have been completed yet'}
            </p>
          </div>
        ) : (
          filteredBookings.map((booking) => {
            const totalPaid =
              booking.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
            const daysSinceCompletion = Math.floor(
              (today.getTime() - new Date(booking.mainEventDate).getTime()) / (1000 * 60 * 60 * 24)
            );

            return (
              <div
                key={booking.id}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-orange-500"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {booking.name}
                      </h3>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                        ✅ Completed
                      </span>
                      <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">
                        {daysSinceCompletion} days ago
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>📱 {booking.mobile}</div>
                      <div>
                        🎉 {booking.eventType.charAt(0).toUpperCase() + booking.eventType.slice(1)} on{' '}
                        {new Date(booking.mainEventDate).toLocaleDateString()}
                      </div>
                      <div>
                        💰 Total: ₹{booking.total.toLocaleString()} | Paid: ₹
                        {totalPaid.toLocaleString()} | Due: ₹
                        {booking.due.toLocaleString()}
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
                      onClick={() => router.push(`/admin/bookings/${booking.id}/payment`)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                    >
                      Add Payment
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Summary Section */}
      {completedBookings.length > 0 && (
        <div className="mt-8 bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Completed Events Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                ₹{totalPaid.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Collected</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                ₹{totalRevenue.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Revenue</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round((totalPaid / totalRevenue) * 100)}%
              </div>
              <div className="text-sm text-gray-600">Collection Rate</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}