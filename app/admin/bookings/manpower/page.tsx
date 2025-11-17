'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Manpower {
  id: number;
  name: string;
  whatsapp?: string;
  specialty: string;
  rates: {
    tilak?: number;
    haldi?: number;
    wedding?: number;
    engagement?: number;
    birthday?: number;
    mundan?: number;
  };
}

export default function ManpowerPage() {
  const router = useRouter();
  const [manpower, setManpower] = useState<Manpower[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
    specialty: 'Photography',
    rates: {
      tilak: '',
      haldi: '',
      wedding: '',
      engagement: '',
      birthday: '',
      mundan: '',
    },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('adminToken');

      // Load manpower
      const manpowerRes = await fetch('/api/admin/manpower', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (manpowerRes.ok) {
        const data = await manpowerRes.json();
        setManpower(data.manpower);
      }

      // Load bookings for earnings calculation
      const bookingsRes = await fetch('/api/admin/bookings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (bookingsRes.ok) {
        const data = await bookingsRes.json();
        setBookings(data.bookings);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateEarnings = (member: Manpower) => {
    let total = 0;
    bookings.forEach((booking) => {
      booking.events?.forEach((event: any) => {
        if (event.team?.includes(member.name)) {
          const eventKey = event.name.toLowerCase() as keyof typeof member.rates;
          const rate = member.rates[eventKey] || 0;
          total += rate;
        }
      });
    });
    return total;
  };

  const handleOpenModal = (member?: Manpower) => {
    if (member) {
      setEditingId(member.id);
      setFormData({
        name: member.name,
        whatsapp: member.whatsapp || '',
        specialty: member.specialty,
        rates: {
          tilak: member.rates.tilak?.toString() || '',
          haldi: member.rates.haldi?.toString() || '',
          wedding: member.rates.wedding?.toString() || '',
          engagement: member.rates.engagement?.toString() || '',
          birthday: member.rates.birthday?.toString() || '',
          mundan: member.rates.mundan?.toString() || '',
        },
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        whatsapp: '',
        specialty: 'Photography',
        rates: {
          tilak: '',
          haldi: '',
          wedding: '',
          engagement: '',
          birthday: '',
          mundan: '',
        },
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('adminToken');
      const url = editingId
        ? `/api/admin/manpower/${editingId}`
        : '/api/admin/manpower';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          whatsapp: formData.whatsapp,
          specialty: formData.specialty,
          rates: {
            tilak: parseFloat(formData.rates.tilak) || 0,
            haldi: parseFloat(formData.rates.haldi) || 0,
            wedding: parseFloat(formData.rates.wedding) || 0,
            engagement: parseFloat(formData.rates.engagement) || 0,
            birthday: parseFloat(formData.rates.birthday) || 0,
            mundan: parseFloat(formData.rates.mundan) || 0,
          },
        }),
      });

      if (res.ok) {
        alert(editingId ? 'Member updated successfully!' : 'Member added successfully!');
        setShowModal(false);
        loadData();
      } else {
        alert('Failed to save member');
      }
    } catch (error) {
      console.error('Failed to save member:', error);
      alert('Failed to save member');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this member?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/manpower/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        alert('Member deleted successfully');
        loadData();
      } else {
        alert('Failed to delete member');
      }
    } catch (error) {
      console.error('Failed to delete member:', error);
      alert('Failed to delete member');
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="text-indigo-600 hover:text-indigo-800 mb-4 flex items-center gap-2"
        >
          ← Back
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manpower Management</h1>
            <p className="text-gray-600 mt-1">Manage your team members and their rates</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
          >
            ➕ Add New Member
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : manpower.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Team Members Yet</h3>
          <p className="text-gray-600 mb-6">Add your first team member to get started</p>
          <button
            onClick={() => handleOpenModal()}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Add First Member
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {manpower.map((member) => {
            const earnings = calculateEarnings(member);
            return (
              <div key={member.id} className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900">{member.name}</h3>
                    {member.whatsapp && (
                      <p className="text-sm text-gray-600 mt-1">📱 {member.whatsapp}</p>
                    )}
                  </div>
                  <span className="px-3 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs rounded-full">
                    {member.specialty}
                  </span>
                </div>

                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm text-gray-600">Total Earnings</div>
                  <div className="text-2xl font-bold text-green-600">
                    ₹{earnings.toLocaleString()}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <h4 className="text-sm font-semibold text-gray-700">Event Rates</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(member.rates).map(([event, rate]) => {
                      if (rate && rate > 0) {
                        return (
                          <div key={event} className="flex justify-between">
                            <span className="text-gray-600 capitalize">{event}:</span>
                            <span className="font-medium">₹{rate.toLocaleString()}</span>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenModal(member)}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(member.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full my-8">
            <h2 className="text-2xl font-bold mb-6">
              {editingId ? 'Edit Member' : 'Add New Member'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Member Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specialty *
                </label>
                <select
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Photography">Photography</option>
                  <option value="Videography">Videography</option>
                  <option value="Drone Pilot">Drone Pilot</option>
                  <option value="Helper">Helper</option>
                </select>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Event Rates (per event)</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.keys(formData.rates).map((event) => (
                    <div key={event}>
                      <label className="block text-sm text-gray-700 mb-1 capitalize">
                        {event}
                      </label>
                      <input
                        type="number"
                        value={formData.rates[event as keyof typeof formData.rates]}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            rates: { ...formData.rates, [event]: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  {editingId ? 'Update Member' : 'Add Member'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
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
