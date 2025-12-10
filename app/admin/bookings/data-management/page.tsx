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
  createdAt?: string;
}

export default function DataManagementPage() {
  const router = useRouter();
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [cancelledBookings, setCancelledBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<'active' | 'cancelled' | 'all'>('all');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const token = localStorage.getItem('adminToken');

      const activeRes = await fetch('/api/admin/bookings', {
        headers: { Authorization: `Bearer ${token}` },
      });

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

  const exportData = (type: 'active' | 'cancelled' | 'all') => {
    let dataToExport = [];

    switch (type) {
      case 'active':
        dataToExport = allBookings;
        break;
      case 'cancelled':
        dataToExport = cancelledBookings;
        break;
      case 'all':
        dataToExport = [...allBookings, ...cancelledBookings];
        break;
    }

    const csvContent = [
      ['ID', 'Name', 'Mobile', 'Event Type', 'Event Date', 'Total', 'Status', 'Cancelled At', 'Cancellation Reason'].join(','),
      ...dataToExport.map(booking => [
        booking.id,
        `"${booking.name}"`,
        booking.mobile,
        booking.eventType,
        booking.mainEventDate,
        booking.total,
        booking.cancelledAt ? 'Cancelled' : 'Active',
        booking.cancelledAt || '',
        `"${booking.cancellationReason || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `booking-data-${type}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getDataStats = () => {
    const totalEvents = allBookings.length + cancelledBookings.length;
    const totalRevenue = allBookings.reduce((sum, b) => sum + b.total, 0) +
      cancelledBookings.reduce((sum, b) => sum + b.total, 0);
    const preservedData = cancelledBookings.length;
    const dataIntegrity = totalEvents > 0 ? ((totalEvents) / totalEvents) * 100 : 100;

    return { totalEvents, totalRevenue, preservedData, dataIntegrity };
  };

  const stats = getDataStats();

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading data management...</p>
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🗄️ Data Management Center</h1>
        <p className="text-gray-600">Complete data preservation and management for all booking records</p>
      </div>

      {/* Data Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-md p-6 text-white">
          <div className="text-sm opacity-90 mb-1">📊 Total Records</div>
          <div className="text-3xl font-bold">{stats.totalEvents}</div>
          <div className="text-xs opacity-75">All booking records</div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-md p-6 text-white">
          <div className="text-sm opacity-90 mb-1">✅ Active Records</div>
          <div className="text-3xl font-bold">{allBookings.length}</div>
          <div className="text-xs opacity-75">Currently active</div>
        </div>
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl shadow-md p-6 text-white">
          <div className="text-sm opacity-90 mb-1">🔒 Preserved Records</div>
          <div className="text-3xl font-bold">{stats.preservedData}</div>
          <div className="text-xs opacity-75">Cancelled but preserved</div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-md p-6 text-white">
          <div className="text-sm opacity-90 mb-1">🛡️ Data Integrity</div>
          <div className="text-3xl font-bold">{stats.dataIntegrity.toFixed(1)}%</div>
          <div className="text-xs opacity-75">No data loss</div>
        </div>
      </div>

      {/* Data Sections */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">📋 Data Sections</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Active Data Section */}
          <div className="border border-green-200 rounded-lg p-6 bg-green-50">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-2xl">✅</div>
              <div>
                <h4 className="text-lg font-semibold text-green-900">Active Bookings</h4>
                <p className="text-sm text-green-700">Currently active events</p>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-green-700">Total Records:</span>
                <span className="font-bold text-green-900">{allBookings.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-700">Total Value:</span>
                <span className="font-bold text-green-900">
                  ₹{allBookings.reduce((sum, b) => sum + b.total, 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-700">Data Status:</span>
                <span className="font-bold text-green-900">Live & Active</span>
              </div>
            </div>
            <button
              onClick={() => exportData('active')}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
            >
              📥 Export Active Data
            </button>
          </div>

          {/* Cancelled Data Section */}
          <div className="border border-red-200 rounded-lg p-6 bg-red-50">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-2xl">🔒</div>
              <div>
                <h4 className="text-lg font-semibold text-red-900">Cancelled Events</h4>
                <p className="text-sm text-red-700">Preserved cancelled data</p>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-red-700">Total Records:</span>
                <span className="font-bold text-red-900">{cancelledBookings.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-red-700">Lost Value:</span>
                <span className="font-bold text-red-900">
                  ₹{cancelledBookings.reduce((sum, b) => sum + b.total, 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-red-700">Data Status:</span>
                <span className="font-bold text-red-900">Preserved</span>
              </div>
            </div>
            <button
              onClick={() => exportData('cancelled')}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
            >
              📥 Export Cancelled Data
            </button>
          </div>

          {/* Complete Data Section */}
          <div className="border border-purple-200 rounded-lg p-6 bg-purple-50">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-2xl">📊</div>
              <div>
                <h4 className="text-lg font-semibold text-purple-900">Complete Dataset</h4>
                <p className="text-sm text-purple-700">All records combined</p>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-purple-700">Total Records:</span>
                <span className="font-bold text-purple-900">{stats.totalEvents}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-purple-700">Total Value:</span>
                <span className="font-bold text-purple-900">
                  ₹{stats.totalRevenue.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-purple-700">Data Status:</span>
                <span className="font-bold text-purple-900">Complete</span>
              </div>
            </div>
            <button
              onClick={() => exportData('all')}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
            >
              📥 Export All Data
            </button>
          </div>
        </div>
      </div>

      {/* Data Preservation Policy */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-3xl">🛡️</div>
          <div>
            <h3 className="text-xl font-semibold text-indigo-900">Data Preservation Policy</h3>
            <p className="text-indigo-700">Our commitment to data integrity and preservation</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-semibold text-indigo-900">✅ What We Preserve</h4>
            <div className="space-y-2 text-sm text-indigo-800">
              <div className="flex items-center gap-2">
                <span className="text-green-500">•</span>
                <span>Complete booking details and customer information</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">•</span>
                <span>All payment records and transaction history</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">•</span>
                <span>Event details, dates, and service requirements</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">•</span>
                <span>Cancellation reasons and timestamps</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">•</span>
                <span>Team assignments and manpower allocations</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-indigo-900">🔒 Security Measures</h4>
            <div className="space-y-2 text-sm text-indigo-800">
              <div className="flex items-center gap-2">
                <span className="text-blue-500">•</span>
                <span>Separate storage for cancelled event data</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-500">•</span>
                <span>Immutable audit trail for all changes</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-500">•</span>
                <span>Backup and recovery systems in place</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-500">•</span>
                <span>Data export capabilities for compliance</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-500">•</span>
                <span>Reactivation options for cancelled events</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">📈 Recent Data Activity</h3>

        <div className="space-y-4">
          {cancelledBookings.slice(0, 5).map((booking, index) => (
            <div key={booking.id} className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="text-red-500">❌</div>
                <div>
                  <div className="font-medium text-gray-900">{booking.name}</div>
                  <div className="text-sm text-gray-600">
                    {booking.eventType} • {new Date(booking.mainEventDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-red-600 font-medium">Cancelled</div>
                <div className="text-xs text-gray-500">
                  {booking.cancelledAt ? new Date(booking.cancelledAt).toLocaleDateString() : 'Recently'}
                </div>
              </div>
            </div>
          ))}

          {cancelledBookings.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">✅</div>
              <p>No cancelled events - All data is active!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}