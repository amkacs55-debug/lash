import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/contexts/SupabaseContext';
import { Trash2, Search } from 'lucide-react';

interface Booking {
  id: string;
  date: string;
  time: string;
  customer_name: string;
  customer_phone: string;
  service_id: string;
  status: string;
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    let filtered = bookings;

    // Filter by status
    if (filter !== 'all') {
      filtered = filtered.filter((b) => b.status === filter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (b) =>
          b.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.customer_phone.includes(searchTerm)
      );
    }

    setFilteredBookings(filtered);
  }, [bookings, searchTerm, filter]);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      fetchBookings();
    } catch (error) {
      console.error('Error updating booking:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this booking?')) return;

    try {
      const { error } = await supabase.from('bookings').delete().eq('id', id);

      if (error) throw error;
      fetchBookings();
    } catch (error) {
      console.error('Error deleting booking:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#C9A86A] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 lg:mb-8"
        >
          <h1 className="font-playfair text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1F1F1F] mb-4 lg:mb-6">
            Bookings
          </h1>

          {/* Search and Filter */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg font-manrope focus:border-[#C9A86A] outline-none"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
              {['all', 'pending_payment', 'confirmed', 'completed', 'cancelled'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg font-manrope text-sm sm:text-base transition-all ${
                    filter === status
                      ? 'bg-gradient-to-r from-[#E8BFCF] to-[#C9A86A] text-white'
                      : 'bg-white text-[#1F1F1F] border-2 border-gray-300 hover:border-[#C9A86A]'
                  }`}
                >
                  {status === 'pending_payment'
                    ? 'Pending Payment'
                    : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Bookings: cards on mobile, table on desktop */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {filteredBookings.length > 0 ? (
            <>
              {/* Mobile cards */}
              <div className="grid grid-cols-1 gap-4 lg:hidden">
                {filteredBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="bg-white rounded-2xl shadow-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="min-w-0">
                        <p className="font-playfair font-bold text-[#1F1F1F] truncate">
                          {booking.customer_name}
                        </p>
                        <p className="font-manrope text-sm text-gray-600">
                          {booking.customer_phone}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(booking.id)}
                        className="text-red-600 hover:text-red-800 transition-colors flex-shrink-0 ml-2 p-1"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="flex justify-between items-center text-sm font-manrope text-gray-600 mb-3">
                      <span>{booking.date}</span>
                      <span>{booking.time}</span>
                    </div>
                    <select
                      value={booking.status}
                      onChange={(e) =>
                        handleStatusChange(booking.id, e.target.value)
                      }
                      className={`w-full px-3 py-2 rounded-lg font-manrope text-sm font-semibold border-none focus:outline-none cursor-pointer ${
                        booking.status === 'confirmed'
                          ? 'bg-green-100 text-green-800'
                          : booking.status === 'completed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      <option value="pending_payment">Pending Payment</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden lg:block bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                      <tr>
                        <th className="text-left font-manrope font-semibold text-[#1F1F1F] p-4">
                          Customer
                        </th>
                        <th className="text-left font-manrope font-semibold text-[#1F1F1F] p-4">
                          Phone
                        </th>
                        <th className="text-left font-manrope font-semibold text-[#1F1F1F] p-4">
                          Date
                        </th>
                        <th className="text-left font-manrope font-semibold text-[#1F1F1F] p-4">
                          Time
                        </th>
                        <th className="text-left font-manrope font-semibold text-[#1F1F1F] p-4">
                          Status
                        </th>
                        <th className="text-left font-manrope font-semibold text-[#1F1F1F] p-4">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.map((booking) => (
                        <tr key={booking.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="font-manrope text-[#1F1F1F] p-4">
                            {booking.customer_name}
                          </td>
                          <td className="font-manrope text-gray-600 p-4">
                            {booking.customer_phone}
                          </td>
                          <td className="font-manrope text-gray-600 p-4">
                            {booking.date}
                          </td>
                          <td className="font-manrope text-gray-600 p-4">
                            {booking.time}
                          </td>
                          <td className="p-4">
                            <select
                              value={booking.status}
                              onChange={(e) =>
                                handleStatusChange(booking.id, e.target.value)
                              }
                              className={`px-3 py-1 rounded-full font-manrope text-sm font-semibold border-none focus:outline-none cursor-pointer ${
                                booking.status === 'confirmed'
                                  ? 'bg-green-100 text-green-800'
                                  : booking.status === 'completed'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              <option value="pending_payment">Pending Payment</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => handleDelete(booking.id)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <p className="font-manrope text-gray-600">No bookings found</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
