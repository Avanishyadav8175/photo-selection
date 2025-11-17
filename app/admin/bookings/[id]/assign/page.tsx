'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Manpower {
  id: number;
  name: string;
  specialty: string;
}

interface Booking {
  id: number;
  name: string;
  events: any[];
}

export default function AssignTeamPage() {
  const params = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [manpower, setManpower] = useState<Manpower[]>([]);
  const [assignments, setAssignments] = useState<{ [key: string]: string[] }>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('adminToken');

      // Load booking
      const bookingRes = await fetch(`/api/admin/bookings/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (bookingRes.ok) {
        const bookingData = await bookingRes.json();
        setBooking(bookingData.booking);

        // Initialize assignments from existing teams
        const initialAssignments: { [key: string]: string[] } = {};
        bookingData.booking.events.forEach((event: any) => {
          initialAssignments[event.name] = event.team || [];
        });
        setAssignments(initialAssignments);
      }

      // Load manpower
      const manpowerRes = await fetch('/api/admin/manpower', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (manpowerRes.ok) {
        const manpowerData = await manpowerRes.json();
        setManpower(manpowerData.manpower);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMember = (eventName: string, memberName: string) => {
    setAssignments((prev) => {
      const eventTeam = prev[eventName] || [];
      const isAssigned = eventTeam.includes(memberName);

      return {
        ...prev,
        [eventName]: isAssigned
          ? eventTeam.filter((name) => name !== memberName)
          : [...eventTeam, memberName],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/bookings/${params.id}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ assignments }),
      });

      if (res.ok) {
        alert('Team assigned successfully!');
        router.push(`/admin/bookings/${params.id}`);
      } else {
        alert('Failed to assign team');
      }
    } catch (error) {
      console.error('Failed to assign team:', error);
      alert('Failed to assign team');
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

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="text-indigo-600 hover:text-indigo-800 mb-4 flex items-center gap-2"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Assign Team</h1>
        <p className="text-gray-600 mt-1">{booking.name}</p>
      </div>

      {manpower.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Manpower Available</h3>
          <p className="text-gray-600 mb-6">Add team members first to assign them to events</p>
          <button
            onClick={() => router.push('/admin/bookings/manpower')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Manage Manpower
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {booking.events && booking.events.length > 0 ? (
            booking.events.map((event) => (
              <div key={event.name} className="bg-white rounded-xl shadow-md p-6">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold">{event.name}</h2>
                  <p className="text-sm text-gray-600">
                    {new Date(event.date).toLocaleDateString()} • {event.time}
                  </p>
                  <p className="text-sm text-gray-600">
                    Services: {event.services?.join(', ') || 'None'}
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {manpower.map((member) => {
                    const isAssigned = assignments[event.name]?.includes(member.name) || false;
                    return (
                      <label
                        key={member.id}
                        className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${isAssigned
                            ? 'border-indigo-600 bg-indigo-50'
                            : 'border-gray-200 hover:border-indigo-300'
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={isAssigned}
                          onChange={() => handleToggleMember(event.name, member.name)}
                          className="w-5 h-5 text-indigo-600"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{member.name}</div>
                          <div className="text-xs text-gray-500">{member.specialty}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {assignments[event.name] && assignments[event.name].length > 0 && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-sm font-medium text-green-800">
                      Assigned: {assignments[event.name].join(', ')}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <p className="text-gray-600">No events found for this booking</p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-8 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Assignment'}
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
      )}
    </div>
  );
}
