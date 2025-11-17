'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Booking {
  id: number;
  name: string;
  total: number;
  due: number;
  payments: any[];
}

export default function AddPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    mode: 'Cash',
    note: '',
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(paymentData.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (booking && amount > booking.due) {
      alert(`Payment cannot exceed due amount (₹${booking.due.toLocaleString()})`);
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/bookings/${params.id}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount,
          date: paymentData.date,
          mode: paymentData.mode,
          note: paymentData.note || paymentData.mode,
        }),
      });

      if (res.ok) {
        alert('Payment added successfully!');
        router.push(`/admin/bookings/${params.id}`);
      } else {
        alert('Failed to add payment');
      }
    } catch (error) {
      console.error('Failed to add payment:', error);
      alert('Failed to add payment');
    } finally {
      setSubmitting(false);
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

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="text-indigo-600 hover:text-indigo-800 mb-4 flex items-center gap-2"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Add Payment</h1>
        <p className="text-gray-600 mt-1">{booking.name}</p>
      </div>

      {/* Payment Summary */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Payment Summary</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Amount:</span>
            <span className="font-semibold">₹{booking.total.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total Paid:</span>
            <span className="font-semibold text-green-600">₹{totalPaid.toLocaleString()}</span>
          </div>
          <div className="flex justify-between border-t pt-3">
            <span className="text-gray-900 font-semibold">Due Amount:</span>
            <span className="font-bold text-xl text-red-600">
              ₹{booking.due.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount Received *
          </label>
          <input
            type="number"
            value={paymentData.amount}
            onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-lg"
            placeholder="Enter amount"
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            Maximum: ₹{booking.due.toLocaleString()}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Date *
          </label>
          <input
            type="date"
            value={paymentData.date}
            onChange={(e) => setPaymentData({ ...paymentData, date: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Mode *
          </label>
          <select
            value={paymentData.mode}
            onChange={(e) => setPaymentData({ ...paymentData, mode: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="Cash">Cash</option>
            <option value="Online">Online Transfer</option>
            <option value="UPI">UPI</option>
            <option value="Card">Card</option>
            <option value="Cheque">Cheque</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Note (Optional)
          </label>
          <textarea
            value={paymentData.note}
            onChange={(e) => setPaymentData({ ...paymentData, note: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            placeholder="Add any notes about this payment..."
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? 'Adding Payment...' : 'Add Payment'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Payment History */}
      {booking.payments && booking.payments.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6 mt-6">
          <h2 className="text-lg font-semibold mb-4">Payment History</h2>
          <div className="space-y-3">
            {booking.payments.map((payment) => (
              <div
                key={payment.id}
                className="flex justify-between items-start border-b border-gray-200 pb-3 last:border-0"
              >
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
