'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Booking {
  id: number;
  name: string;
  mobile: string;
  whatsapp?: string;
  customerAddress?: string;
  venueAddress?: string;
  eventType: string;
  mainEventDate: string;
  events: any[];
  total: number;
  due: number;
  note?: string;
  payments: any[];
  expenses: any[];
}

export default function BookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseData, setExpenseData] = useState({ desc: '', amount: '' });

  useEffect(() => {
    loadBooking();
  }, []);

  const loadBooking = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/bookings/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBooking(data.booking);
      }
    } catch (error) {
      console.error('Failed to load booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/bookings/${params.id}/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          desc: expenseData.desc,
          amount: parseFloat(expenseData.amount),
        }),
      });

      if (res.ok) {
        setShowExpenseModal(false);
        setExpenseData({ desc: '', amount: '' });
        loadBooking();
        alert('Expense added successfully!');
      }
    } catch (error) {
      console.error('Failed to add expense:', error);
      alert('Failed to add expense');
    }
  };

  const handleDeleteExpense = async (expenseId: number) => {
    if (!confirm('Delete this expense?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/bookings/${params.id}/expenses/${expenseId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        loadBooking();
        alert('Expense deleted');
      }
    } catch (error) {
      console.error('Failed to delete expense:', error);
    }
  };

  const handleDeleteBooking = async () => {
    if (!confirm('Are you sure you want to delete this booking?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/bookings/${params.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        alert('Booking deleted successfully');
        router.push('/admin/bookings');
      }
    } catch (error) {
      console.error('Failed to delete booking:', error);
      alert('Failed to delete booking');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Booking Not Found</h2>
          <button
            onClick={() => router.push('/admin/bookings')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg"
          >
            Back to Bookings
          </button>
        </div>
      </div>
    );
  }

  const totalPaid = booking.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const totalExpenses = booking.expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
  const netProfit = totalPaid - totalExpenses;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="text-indigo-600 hover:text-indigo-800 mb-4 flex items-center gap-2"
        >
          ← Back to Bookings
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{booking.name}</h1>
            <p className="text-gray-600 mt-1">
              {booking.eventType.charAt(0).toUpperCase() + booking.eventType.slice(1)} •{' '}
              {new Date(booking.mainEventDate).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={handleDeleteBooking}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            🗑️ Delete Booking
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <button
          onClick={() => router.push(`/admin/bookings/${params.id}/assign`)}
          className="p-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all"
        >
          <div className="text-2xl mb-2">👥</div>
          <div className="font-semibold">Assign Team</div>
        </button>
        <button
          onClick={() => router.push(`/admin/bookings/${params.id}/payment`)}
          className="p-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all"
        >
          <div className="text-2xl mb-2">💰</div>
          <div className="font-semibold">Add Payment</div>
        </button>
        <button
          onClick={() => setShowExpenseModal(true)}
          className="p-4 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-all"
        >
          <div className="text-2xl mb-2">📝</div>
          <div className="font-semibold">Add Expense</div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Details */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Customer Details</h2>
          <div className="space-y-3">
            <div>
              <span className="text-gray-600">Name:</span>
              <span className="ml-2 font-medium">{booking.name}</span>
            </div>
            <div>
              <span className="text-gray-600">Mobile:</span>
              <span className="ml-2 font-medium">{booking.mobile}</span>
            </div>
            {booking.whatsapp && (
              <div>
                <span className="text-gray-600">WhatsApp:</span>
                <span className="ml-2 font-medium">{booking.whatsapp}</span>
              </div>
            )}
            {booking.customerAddress && (
              <div>
                <span className="text-gray-600">Address:</span>
                <span className="ml-2 font-medium">{booking.customerAddress}</span>
              </div>
            )}
            {booking.venueAddress && (
              <div>
                <span className="text-gray-600">Venue:</span>
                <span className="ml-2 font-medium">{booking.venueAddress}</span>
              </div>
            )}
            {booking.note && (
              <div>
                <span className="text-gray-600">Note:</span>
                <span className="ml-2 font-medium">{booking.note}</span>
              </div>
            )}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Financial Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Amount:</span>
              <span className="font-semibold">₹{booking.total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Paid:</span>
              <span className="font-semibold text-green-600">₹{totalPaid.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Expenses:</span>
              <span className="font-semibold text-orange-600">₹{totalExpenses.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Due Amount:</span>
              <span className="font-semibold text-red-600">₹{booking.due.toLocaleString()}</span>
            </div>
            <div className="border-t pt-3 flex justify-between">
              <span className="text-gray-900 font-semibold">Net Profit:</span>
              <span className={`font-bold text-xl ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{netProfit.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Event Details */}
        <div className="bg-white rounded-xl shadow-md p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Event Details</h2>
          {booking.events && booking.events.length > 0 ? (
            <div className="space-y-4">
              {booking.events.map((event, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">{event.name}</h3>
                    <span className="text-sm text-gray-600">{event.time}</span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>📅 {new Date(event.date).toLocaleDateString()}</div>
                    <div>📸 Services: {event.services?.join(', ') || 'None'}</div>
                    <div>
                      👥 Team: {event.team && event.team.length > 0 ? event.team.join(', ') : 'Not assigned'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No event details available</p>
          )}
        </div>

        {/* Payment History */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Payment History</h2>
            <button
              onClick={() => router.push(`/admin/bookings/${params.id}/payment`)}
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              + Add Payment
            </button>
          </div>
          {booking.payments && booking.payments.length > 0 ? (
            <div className="space-y-3">
              {booking.payments.map((payment) => (
                <div key={payment.id} className="border-b border-gray-200 pb-3 last:border-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{payment.note}</div>
                      <div className="text-sm text-gray-600">
                        {new Date(payment.date).toLocaleDateString()} • {payment.mode}
                      </div>
                    </div>
                    <div className="font-semibold text-green-600">
                      ₹{payment.amount.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No payments recorded</p>
          )}
        </div>

        {/* Expenses */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Expenses</h2>
            <button
              onClick={() => setShowExpenseModal(true)}
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              + Add Expense
            </button>
          </div>
          {booking.expenses && booking.expenses.length > 0 ? (
            <div className="space-y-3">
              {booking.expenses.map((expense) => (
                <div key={expense.id} className="border-b border-gray-200 pb-3 last:border-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium">{expense.desc}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-orange-600">
                        ₹{expense.amount.toLocaleString()}
                      </div>
                      <button
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No expenses recorded</p>
          )}
        </div>
      </div>

      {/* Add Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6">Add Expense</h2>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={expenseData.desc}
                  onChange={(e) => setExpenseData({ ...expenseData, desc: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., Travel, Food, Equipment"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  value={expenseData.amount}
                  onChange={(e) => setExpenseData({ ...expenseData, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Add Expense
                </button>
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
