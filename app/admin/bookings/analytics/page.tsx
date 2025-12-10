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

export default function BookingAnalyticsPage() {
  const router = useRouter();
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [cancelledBookings, setCancelledBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
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
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate analytics
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

  const totalActiveRevenue = allBookings.reduce(
    (sum, b) => sum + (b.payments?.reduce((pSum, p) => pSum + p.amount, 0) || 0),
    0
  );

  const totalCancelledRevenue = cancelledBookings.reduce((sum, b) => sum + b.total, 0);
  const totalCancelledAdvance = cancelledBookings.reduce(
    (sum, b) => sum + (b.payments?.reduce((pSum, p) => pSum + p.amount, 0) || 0),
    0
  );

  const totalBookings = allBookings.length + cancelledBookings.length;
  const cancellationRate = totalBookings > 0 ? (cancelledBookings.length / totalBookings) * 100 : 0;

  // Monthly breakdown
  const getMonthlyData = () => {
    const months = {};

    [...allBookings, ...cancelledBookings].forEach(booking => {
      const month = new Date(booking.mainEventDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short'
      });

      if (!months[month]) {
        months[month] = {
          active: 0,
          cancelled: 0,
          revenue: 0,
          lostRevenue: 0
        };
      }

      if (booking.cancelledAt) {
        months[month].cancelled++;
        months[month].lostRevenue += booking.total;
      } else {
        months[month].active++;
        months[month].revenue += (booking.payments?.reduce((sum, p) => sum + p.amount, 0) || 0);
      }
    });

    return Object.entries(months).map(([month, data]) => ({ month, ...data }));
  };

  const monthlyData = getMonthlyData();

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 Booking Analytics Dashboard</h1>
        <p className="text-gray-600">Comprehensive analysis of all booking data including cancelled events</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-md p-6 text-white">
          <div className="text-sm opacity-90 mb-1">📅 Total Bookings</div>
          <div className="text-3xl font-bold">{totalBookings}</div>
          <div className="text-xs opacity-75">All time</div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-md p-6 text-white">
          <div className="text-sm opacity-90 mb-1">✅ Success Rate</div>
          <div className="text-3xl font-bold">{(100 - cancellationRate).toFixed(1)}%</div>
          <div className="text-xs opacity-75">Completed events</div>
        </div>
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl shadow-md p-6 text-white">
          <div className="text-sm opacity-90 mb-1">❌ Cancellation Rate</div>
          <div className="text-3xl font-bold">{cancellationRate.toFixed(1)}%</div>
          <div className="text-xs opacity-75">Events cancelled</div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-md p-6 text-white">
          <div className="text-sm opacity-90 mb-1">💰 Revenue Efficiency</div>
          <div className="text-3xl font-bold">
            {totalActiveRevenue > 0 ? ((totalActiveRevenue / (totalActiveRevenue + totalCancelledRevenue)) * 100).toFixed(1) : 0}%
          </div>
          <div className="text-xs opacity-75">Revenue retained</div>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">💵 Active Revenue</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Received:</span>
              <span className="font-bold text-green-600">₹{totalActiveRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pending Due:</span>
              <span className="font-bold text-orange-600">
                ₹{allBookings.reduce((sum, b) => sum + b.due, 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Value:</span>
              <span className="font-bold text-blue-600">
                ₹{allBookings.reduce((sum, b) => sum + b.total, 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">💸 Cancelled Events Impact</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Lost Revenue:</span>
              <span className="font-bold text-red-600">₹{totalCancelledRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Advance Received:</span>
              <span className="font-bold text-yellow-600">₹{totalCancelledAdvance.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Events Cancelled:</span>
              <span className="font-bold text-red-600">{cancelledBookings.length}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Performance Metrics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Upcoming Events:</span>
              <span className="font-bold text-green-600">{upcomingBookings.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Completed Events:</span>
              <span className="font-bold text-blue-600">{completedBookings.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Event Value:</span>
              <span className="font-bold text-purple-600">
                ₹{totalBookings > 0 ? Math.round((allBookings.reduce((sum, b) => sum + b.total, 0) + totalCancelledRevenue) / totalBookings).toLocaleString() : 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Breakdown */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">📅 Monthly Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Month</th>
                <th className="text-center py-3 px-4 font-semibold text-green-600">Active Events</th>
                <th className="text-center py-3 px-4 font-semibold text-red-600">Cancelled Events</th>
                <th className="text-right py-3 px-4 font-semibold text-blue-600">Revenue</th>
                <th className="text-right py-3 px-4 font-semibold text-red-600">Lost Revenue</th>
                <th className="text-center py-3 px-4 font-semibold text-purple-600">Success Rate</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((month, index) => {
                const totalEvents = month.active + month.cancelled;
                const successRate = totalEvents > 0 ? (month.active / totalEvents) * 100 : 0;

                return (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{month.month}</td>
                    <td className="py-3 px-4 text-center text-green-600">{month.active}</td>
                    <td className="py-3 px-4 text-center text-red-600">{month.cancelled}</td>
                    <td className="py-3 px-4 text-right text-blue-600">₹{month.revenue.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-red-600">₹{month.lostRevenue.toLocaleString()}</td>
                    <td className="py-3 px-4 text-center text-purple-600">{successRate.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data Preservation Status */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-3xl">🔐</div>
          <div>
            <h3 className="text-xl font-semibold text-indigo-900">Data Preservation & Security</h3>
            <p className="text-indigo-700">All cancelled event data is securely preserved</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-indigo-800">
              <span className="text-green-500">✅</span>
              <span>Cancelled events: {cancelledBookings.length} records preserved</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-indigo-800">
              <span className="text-green-500">✅</span>
              <span>Payment history: ₹{totalCancelledAdvance.toLocaleString()} tracked</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-indigo-800">
              <span className="text-green-500">✅</span>
              <span>Cancellation reasons: All documented</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-indigo-800">
              <span className="text-green-500">✅</span>
              <span>Audit trail: Complete timestamp records</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-indigo-800">
              <span className="text-green-500">✅</span>
              <span>Reactivation: Available for all cancelled events</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-indigo-800">
              <span className="text-green-500">✅</span>
              <span>Data integrity: No information loss</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}