'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function CreateBookingPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    bookingDate: new Date().toISOString().split('T')[0],
    customerName: '',
    mobile: '',
    whatsapp: '',
    customerAddress: '',
    venueAddress: '',
    eventType: '',
    totalAmount: '',
    advanceAmount: '',
    eventNote: '',
  });

  const [weddingEvents, setWeddingEvents] = useState({
    tilak: { date: '', time: 'Day', photo: false, video: false, drone: false },
    haldi: { date: '', time: 'Day', photo: false, video: false, drone: false },
    wedding: { date: '', time: 'Day', photo: false, video: false, drone: false },
  });

  const [nonWeddingEvent, setNonWeddingEvent] = useState({
    date: '',
    time: 'Day',
    photo: false,
    video: false,
    drone: false,
  });

  const [showPreview, setShowPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const dueAmount = (parseFloat(formData.totalAmount) || 0) - (parseFloat(formData.advanceAmount) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerName || !formData.mobile || !formData.eventType || !formData.totalAmount) {
      alert('Please fill all required fields');
      return;
    }

    setShowPreview(true);
  };

  const confirmBooking = async () => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('adminToken');

      let events: any[] = [];
      let mainEventDate = '';

      if (formData.eventType === 'wedding') {
        if (weddingEvents.tilak.date) {
          events.push({
            name: 'Tilak',
            date: weddingEvents.tilak.date,
            time: weddingEvents.tilak.time,
            services: [
              weddingEvents.tilak.photo && 'Photo',
              weddingEvents.tilak.video && 'Video',
              weddingEvents.tilak.drone && 'Drone',
            ].filter(Boolean),
            team: [],
          });
        }
        if (weddingEvents.haldi.date) {
          events.push({
            name: 'Haldi',
            date: weddingEvents.haldi.date,
            time: weddingEvents.haldi.time,
            services: [
              weddingEvents.haldi.photo && 'Photo',
              weddingEvents.haldi.video && 'Video',
              weddingEvents.haldi.drone && 'Drone',
            ].filter(Boolean),
            team: [],
          });
        }
        if (weddingEvents.wedding.date) {
          events.push({
            name: 'Wedding',
            date: weddingEvents.wedding.date,
            time: weddingEvents.wedding.time,
            services: [
              weddingEvents.wedding.photo && 'Photo',
              weddingEvents.wedding.video && 'Video',
              weddingEvents.wedding.drone && 'Drone',
            ].filter(Boolean),
            team: [],
          });
          mainEventDate = weddingEvents.wedding.date;
        }
      } else if (formData.eventType && nonWeddingEvent.date) {
        events.push({
          name: formData.eventType.charAt(0).toUpperCase() + formData.eventType.slice(1),
          date: nonWeddingEvent.date,
          time: nonWeddingEvent.time,
          services: [
            nonWeddingEvent.photo && 'Photo',
            nonWeddingEvent.video && 'Video',
            nonWeddingEvent.drone && 'Drone',
          ].filter(Boolean),
          team: [],
        });
        mainEventDate = nonWeddingEvent.date;
      }

      const advanceAmount = parseFloat(formData.advanceAmount) || 0;
      const payments = advanceAmount > 0 ? [{
        id: Date.now(),
        amount: advanceAmount,
        date: formData.bookingDate,
        mode: 'Advance',
        note: 'Initial advance payment',
      }] : [];

      const bookingData = {
        name: formData.customerName,
        mobile: formData.mobile,
        whatsapp: formData.whatsapp,
        customerAddress: formData.customerAddress,
        venueAddress: formData.venueAddress,
        eventType: formData.eventType,
        mainEventDate,
        events,
        total: parseFloat(formData.totalAmount),
        due: dueAmount,
        note: formData.eventNote,
        payments,
        expenses: [],
      };

      const res = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bookingData),
      });

      if (res.ok) {
        alert('Booking created successfully!');
        router.push('/admin/bookings');
      } else {
        alert('Failed to create booking');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="text-indigo-600 hover:text-indigo-800 mb-4 flex items-center gap-2"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Create New Booking</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Details */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Customer Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Name *
              </label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number *
              </label>
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp Number
              </label>
              <input
                type="tel"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Booking Date
              </label>
              <input
                type="date"
                name="bookingDate"
                value={formData.bookingDate}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                readOnly
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Address
              </label>
              <textarea
                name="customerAddress"
                value={formData.customerAddress}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Venue Address
              </label>
              <textarea
                name="venueAddress"
                value={formData.venueAddress}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Event Details */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Event Details</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Type *
            </label>
            <select
              name="eventType"
              value={formData.eventType}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">-- Select Event Type --</option>
              <option value="wedding">Wedding</option>
              <option value="engagement">Engagement</option>
              <option value="mundan">Mundan</option>
              <option value="birthday">Birthday</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Wedding Events */}
          {formData.eventType === 'wedding' && (
            <div className="space-y-4 mt-6">
              {['tilak', 'haldi', 'wedding'].map((eventKey) => (
                <div key={eventKey} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 capitalize">{eventKey}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Date</label>
                      <input
                        type="date"
                        value={weddingEvents[eventKey as keyof typeof weddingEvents].date}
                        onChange={(e) =>
                          setWeddingEvents({
                            ...weddingEvents,
                            [eventKey]: { ...weddingEvents[eventKey as keyof typeof weddingEvents], date: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Time</label>
                      <select
                        value={weddingEvents[eventKey as keyof typeof weddingEvents].time}
                        onChange={(e) =>
                          setWeddingEvents({
                            ...weddingEvents,
                            [eventKey]: { ...weddingEvents[eventKey as keyof typeof weddingEvents], time: e.target.value as 'Day' | 'Night' },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="Day">Day</option>
                        <option value="Night">Night</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={weddingEvents[eventKey as keyof typeof weddingEvents].photo}
                        onChange={(e) =>
                          setWeddingEvents({
                            ...weddingEvents,
                            [eventKey]: { ...weddingEvents[eventKey as keyof typeof weddingEvents], photo: e.target.checked },
                          })
                        }
                        className="w-4 h-4"
                      />
                      Photo
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={weddingEvents[eventKey as keyof typeof weddingEvents].video}
                        onChange={(e) =>
                          setWeddingEvents({
                            ...weddingEvents,
                            [eventKey]: { ...weddingEvents[eventKey as keyof typeof weddingEvents], video: e.target.checked },
                          })
                        }
                        className="w-4 h-4"
                      />
                      Video
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={weddingEvents[eventKey as keyof typeof weddingEvents].drone}
                        onChange={(e) =>
                          setWeddingEvents({
                            ...weddingEvents,
                            [eventKey]: { ...weddingEvents[eventKey as keyof typeof weddingEvents], drone: e.target.checked },
                          })
                        }
                        className="w-4 h-4"
                      />
                      Drone
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Non-Wedding Event */}
          {formData.eventType && formData.eventType !== 'wedding' && (
            <div className="border border-gray-200 rounded-lg p-4 mt-6">
              <h3 className="font-semibold mb-3">Event Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={nonWeddingEvent.date}
                    onChange={(e) => setNonWeddingEvent({ ...nonWeddingEvent, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Time</label>
                  <select
                    value={nonWeddingEvent.time}
                    onChange={(e) => setNonWeddingEvent({ ...nonWeddingEvent, time: e.target.value as 'Day' | 'Night' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="Day">Day</option>
                    <option value="Night">Night</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={nonWeddingEvent.photo}
                    onChange={(e) => setNonWeddingEvent({ ...nonWeddingEvent, photo: e.target.checked })}
                    className="w-4 h-4"
                  />
                  Photo
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={nonWeddingEvent.video}
                    onChange={(e) => setNonWeddingEvent({ ...nonWeddingEvent, video: e.target.checked })}
                    className="w-4 h-4"
                  />
                  Video
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={nonWeddingEvent.drone}
                    onChange={(e) => setNonWeddingEvent({ ...nonWeddingEvent, drone: e.target.checked })}
                    className="w-4 h-4"
                  />
                  Drone
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Financial Details */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Financial Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Amount *
              </label>
              <input
                type="number"
                name="totalAmount"
                value={formData.totalAmount}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Advance Amount
              </label>
              <input
                type="number"
                name="advanceAmount"
                value={formData.advanceAmount}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Amount
              </label>
              <input
                type="number"
                value={dueAmount}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                readOnly
              />
            </div>
          </div>
        </div>

        {/* Event Note */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Additional Notes</h2>
          <textarea
            name="eventNote"
            value={formData.eventNote}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            placeholder="Any special requirements or notes..."
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="submit"
            className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
          >
            Preview Booking
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

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Booking Preview</h2>

            <div className="space-y-4 mb-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">Customer Details</h3>
                <p><strong>Name:</strong> {formData.customerName}</p>
                <p><strong>Mobile:</strong> {formData.mobile}</p>
                {formData.whatsapp && <p><strong>WhatsApp:</strong> {formData.whatsapp}</p>}
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Event Details</h3>
                <p><strong>Type:</strong> {formData.eventType}</p>
                {/* Show event details based on type */}
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Financial Details</h3>
                <p><strong>Total:</strong> ₹{parseFloat(formData.totalAmount).toLocaleString()}</p>
                <p><strong>Advance:</strong> ₹{parseFloat(formData.advanceAmount || '0').toLocaleString()}</p>
                <p><strong>Due:</strong> ₹{dueAmount.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={confirmBooking}
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Confirm Booking'}
              </button>
              <button
                onClick={() => setShowPreview(false)}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
