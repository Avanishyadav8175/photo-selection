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

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.mobile.includes(searchTerm);

    if (statusFilter === 'all') return matchesSearch;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(booking.mainEventDate);
    const isCompleted = eventDate < today;

    if (statusFilter === 'upcoming') return matchesSearch && !isCompleted;
    if (statusFilter === 'completed') return matchesSearch && isCompleted;

    return matchesSearch;
  });

  const totalPaid = bookings.reduce(
    (sum, b) => sum + (b.payments?.reduce((pSum, p) => pSum + p.amount, 0) || 0),
    0
  );

  const totalBookings = bookings.length;
  const upcomingBookings = bookings.filter(
    (b) => new Date(b.mainEventDate) >= new Date()
  ).length;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Management</h1>
        <p className="text-gray-600">Manage all your event bookings</p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <div className="text-sm text-gray-600 mb-1">Total Bookings</div>
          <div className="text-3xl font-bold text-gray-900">{totalBookings}</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <div className="text-sm text-gray-600 mb-1">Upcoming</div>
          <div className="text-3xl font-bold text-gray-900">{upcomingBookings}</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
          <div className="text-sm text-gray-600 mb-1">Total Paid</div>
          <div className="text-3xl font-bold text-gray-900">
            ₹{totalPaid.toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
          <div className="text-sm text-gray-600 mb-1">Events Covered</div>
          <div className="text-3xl font-bold text-gray-900">
            {bookings.reduce((sum, b) => sum + (b.events?.length || 0), 0)}
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <button
            onClick={() => router.push('/admin/bookings/create')}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
          >
            ➕ Create New Booking
          </button>
          <button
            onClick={() => router.push('/admin/bookings/calendar')}
            className="px-6 py-3 bg-white border-2 border-indigo-600 text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-all"
          >
            📅 Calendar View
          </button>
          <button
            onClick={() => router.push('/admin/bookings/manpower')}
            className="px-6 py-3 bg-white border-2 border-purple-600 text-purple-600 rounded-lg font-medium hover:bg-purple-50 transition-all"
          >
            👥 Manage Manpower
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="search"
            placeholder="Search by name or mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first booking to get started'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <button
                onClick={() => router.push('/admin/bookings/create')}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
              >
                Create First Booking
              </button>
            )}
          </div>
        ) : (
          filteredBookings.map((booking) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const isCompleted = new Date(booking.mainEventDate) < today;
            const totalPaid =
              booking.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

            return (
              <div
                key={booking.id}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-indigo-500"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {booking.name}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${isCompleted
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                          }`}
                      >
                        {isCompleted ? 'Completed' : 'Upcoming'}
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
                      onClick={() => router.push(`/admin/bookings/${booking.id}/assign`)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
                    >
                      Assign Team
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
    </div>
  );
}
