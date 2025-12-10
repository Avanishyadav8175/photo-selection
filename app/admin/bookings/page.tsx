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
  cancelledAt?: string;
  cancellationReason?: string;
}

type ViewMode = 'upcoming' | 'completed' | 'cancelled' | 'all';

export default function BookingsPage() {
  const router = useRouter();
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [cancelledBookings, setCancelledBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('upcoming');

  useEffect(() => {
    loadAllBookings();
  }, []);

  const loadAllBookings = async () => {
    try {
      const token = localStorage.getItem('adminToken');

      // Load active bookings
      const activeRes = await fetch('/api/admin/bookings', {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Load cancelled bookings
      const cancelledRes = await fetch('/api/admin/bookings/cancelled', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (activeRes.ok && cancelledRes.ok) {
        const activeData = await activeRes.json();
        const cancelledData = await cancelledRes.json();

        setAllBookings(activeData.bookings || []);
        setCancelledBookings(cancelledData.bookings || []);
      }
    } catch (error) {
      console.error('Failed to load bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Categorize bookings
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingBookings = allBookings.filter((booking) => {
    const eventDate = new Date(booking.mainEventDate);
    return eventDate >= today;
  });

  const completedBookings = allBookings.filter((booking) => {
    const eventDate = new Date(booking.mainEventDate);
    return eventDate < today;
  });

  // Get current view bookings
  const getCurrentBookings = () => {
    switch (viewMode) {
      case 'upcoming':
        return upcomingBookings;
      case 'completed':
        return completedBookings;
      case 'cancelled':
        return cancelledBookings;
      case 'all':
        return [...allBookings, ...cancelledBookings];
      default:
        return upcomingBookings;
    }
  };

  const currentBookings = getCurrentBookings();
  const filteredBookings = currentBookings.filter((booking) => {
    const matchesSearch =
      booking.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.mobile.includes(searchTerm);
    return matchesSearch;
  });

  // Calculate totals
  const totalPaid = allBookings.reduce(
    (sum, b) => sum + (b.payments?.reduce((pSum, p) => pSum + p.amount, 0) || 0),
    0
  );

  const totalCancelledRevenue = cancelledBookings.reduce((sum, b) => sum + b.total, 0);
  const totalCancelledAdvance = cancelledBookings.reduce(
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
        loadAllBookings();
      } else {
        alert('Failed to reactivate event');
      }
    } catch (error) {
      console.error('Failed to reactivate event:', error);
      alert('Failed to reactivate event');
    }
  };

  const getViewModeConfig = (mode: ViewMode) => {
    switch (mode) {
      case 'upcoming':
        return {
          label: '📅 Upcoming Events',
          color: 'green',
          count: upcomingBookings.length,
          description: 'Events scheduled for future dates'
        };
      case 'completed':
        return {
          label: '✅ Completed Events',
          color: 'blue',
          count: completedBookings.length,
          description: 'Successfully completed events'
        };
      case 'cancelled':
        return {
          label: '❌ Cancelled Events',
          color: 'red',
          count: cancelledBookings.length,
          description: 'Events that were cancelled'
        };
      case 'all':
        return {
          label: '📊 All Events',
          color: 'purple',
          count: allBookings.length + cancelledBookings.length,
          description: 'Complete overview of all events'
        };
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📋 Comprehensive Booking Management</h1>
        <p className="text-gray-600">Complete overview and management of all your event bookings</p>
      </div>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <div className="text-sm text-gray-600 mb-1">📅 Upcoming Events</div>
          <div className="text-3xl font-bold text-gray-900">{upcomingBookings.length}</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <div className="text-sm text-gray-600 mb-1">✅ Completed Events</div>
          <div className="text-3xl font-bold text-gray-900">{completedBookings.length}</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
          <div className="text-sm text-gray-600 mb-1">❌ Cancelled Events</div>
          <div className="text-3xl font-bold text-gray-900">{cancelledBookings.length}</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
          <div className="text-sm text-gray-600 mb-1">💰 Total Revenue</div>
          <div className="text-3xl font-bold text-gray-900">
            ₹{totalPaid.toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
          <div className="text-sm text-gray-600 mb-1">📸 Total Events</div>
          <div className="text-3xl font-bold text-gray-900">
            {allBookings.reduce((sum, b) => sum + (b.events?.length || 0), 0)}
          </div>
        </div>
      </div>

      {/* Revenue Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-md p-6 text-white">
          <div className="text-sm opacity-90 mb-1">💵 Active Revenue</div>
          <div className="text-2xl font-bold">₹{totalPaid.toLocaleString()}</div>
          <div className="text-xs opacity-75">From active bookings</div>
        </div>
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl shadow-md p-6 text-white">
          <div className="text-sm opacity-90 mb-1">💸 Lost Revenue</div>
          <div className="text-2xl font-bold">₹{totalCancelledRevenue.toLocaleString()}</div>
          <div className="text-xs opacity-75">From cancelled events</div>
        </div>
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl shadow-md p-6 text-white">
          <div className="text-sm opacity-90 mb-1">🔄 Refund Pending</div>
          <div className="text-2xl font-bold">₹{totalCancelledAdvance.toLocaleString()}</div>
          <div className="text-xs opacity-75">Advance to refund</div>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {(['upcoming', 'completed', 'cancelled', 'all'] as ViewMode[]).map((mode) => {
            const config = getViewModeConfig(mode);
            const isActive = viewMode === mode;
            return (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${isActive
                  ? `bg-${config.color}-100 text-${config.color}-800 border-2 border-${config.color}-300`
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                {config.label} ({config.count})
              </button>
            );
          })}
        </div>
        <div className="text-sm text-gray-600">
          {getViewModeConfig(viewMode).description}
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
          <button
            onClick={() => router.push('/admin/bookings/analytics')}
            className="px-6 py-3 bg-white border-2 border-green-600 text-green-600 rounded-lg font-medium hover:bg-green-50 transition-all"
          >
            📊 Analytics Dashboard
          </button>
          <button
            onClick={() => router.push('/admin/bookings/data-management')}
            className="px-6 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-all"
          >
            🗄️ Data Management
          </button>
          <button
            onClick={() => window.print()}
            className="px-6 py-3 bg-white border-2 border-gray-600 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-all"
          >
            🖨️ Print Report
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="search"
            placeholder="Search by name or mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <div className={`px-4 py-2 rounded-lg font-medium ${viewMode === 'upcoming' ? 'bg-green-100 text-green-800' :
            viewMode === 'completed' ? 'bg-blue-100 text-blue-800' :
              viewMode === 'cancelled' ? 'bg-red-100 text-red-800' :
                'bg-purple-100 text-purple-800'
            }`}>
            {getViewModeConfig(viewMode).label}
          </div>
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
            <div className="text-6xl mb-4">
              {viewMode === 'upcoming' ? '📅' :
                viewMode === 'completed' ? '✅' :
                  viewMode === 'cancelled' ? '❌' : '📊'}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No {viewMode} events found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm
                ? `No ${viewMode} events match your search`
                : `No ${viewMode} events found`}
            </p>
            {viewMode === 'upcoming' && !searchTerm && (
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
            const totalPaid = booking.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
            const isUpcoming = viewMode === 'upcoming';
            const isCompleted = viewMode === 'completed';
            const isCancelled = viewMode === 'cancelled' || booking.cancelledAt;

            const getBorderColor = () => {
              if (isCancelled) return 'border-red-500';
              if (isCompleted) return 'border-blue-500';
              return 'border-green-500';
            };

            const getStatusBadge = () => {
              if (isCancelled) return { text: '❌ Cancelled', class: 'bg-red-100 text-red-700' };
              if (isCompleted) return { text: '✅ Completed', class: 'bg-blue-100 text-blue-700' };
              return { text: '📅 Upcoming', class: 'bg-green-100 text-green-700' };
            };

            const status = getStatusBadge();

            return (
              <div
                key={booking.id}
                className={`bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 ${getBorderColor()}`}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {booking.name}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.class}`}>
                        {status.text}
                      </span>
                      {isCancelled && booking.cancelledAt && (
                        <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">
                          {Math.floor((new Date().getTime() - new Date(booking.cancelledAt).getTime()) / (1000 * 60 * 60 * 24))} days ago
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>📱 {booking.mobile}</div>
                      <div>
                        🎉 {booking.eventType.charAt(0).toUpperCase() + booking.eventType.slice(1)}{' '}
                        {isCancelled ? 'was' : isCompleted ? 'was' : 'on'}{' '}
                        {new Date(booking.mainEventDate).toLocaleDateString()}
                      </div>
                      <div>
                        💰 Total: ₹{booking.total.toLocaleString()} | Paid: ₹
                        {totalPaid.toLocaleString()} | Due: ₹
                        {booking.due.toLocaleString()}
                      </div>
                      {isCancelled && booking.cancellationReason && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                          <div className="text-xs text-red-800 font-medium">Cancellation Reason:</div>
                          <div className="text-sm text-red-700">{booking.cancellationReason}</div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => router.push(`/admin/bookings/${booking.id}`)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                    >
                      View Details
                    </button>
                    {!isCancelled && (
                      <>
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
                      </>
                    )}
                    {isCancelled && (
                      <button
                        onClick={() => handleReactivate(booking.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                      >
                        🔄 Reactivate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Summary Section for Current View */}
      {filteredBookings.length > 0 && (
        <div className="mt-8 bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">
            {getViewModeConfig(viewMode).label} Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">
                {filteredBookings.length}
              </div>
              <div className="text-sm text-gray-600">Total Events</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                ₹{filteredBookings.reduce((sum, b) => sum + b.total, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Value</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                ₹{filteredBookings.reduce((sum, b) => sum + (b.payments?.reduce((pSum, p) => pSum + p.amount, 0) || 0), 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Amount Received</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                ₹{filteredBookings.reduce((sum, b) => sum + b.due, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">
                {viewMode === 'cancelled' ? 'Refund Due' : 'Amount Due'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Preservation Notice */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="text-2xl">🔒</div>
          <h3 className="text-lg font-semibold text-blue-900">Data Preservation Policy</h3>
        </div>
        <div className="text-sm text-blue-800 space-y-1">
          <div>✅ All cancelled event data is permanently preserved in separate storage</div>
          <div>✅ Cancellation reasons and timestamps are maintained for audit purposes</div>
          <div>✅ Payment history and refund tracking available for cancelled events</div>
          <div>✅ Reactivation option available for cancelled events if needed</div>
        </div>
      </div>
    </div>
  );
}
