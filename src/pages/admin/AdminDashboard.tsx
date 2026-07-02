import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/contexts/SupabaseContext';
import { Calendar, Users, TrendingUp, Clock } from 'lucide-react';

interface Booking {
  id: string;
  date: string;
  time: string;
  customer_name: string;
  status: string;
}

interface Stats {
  todayBookings: number;
  upcomingBookings: number;
  recentBookings: Booking[];
  totalRevenue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    todayBookings: 0,
    upcomingBookings: 0,
    recentBookings: [],
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];

        // Fetch today's bookings
        const { data: todayData, error: todayError } = await supabase
          .from('bookings')
          .select('*')
          .eq('date', today);

        if (todayError) throw todayError;

        // Fetch upcoming bookings
        const { data: upcomingData, error: upcomingError } = await supabase
          .from('bookings')
          .select('*')
          .gt('date', today)
          .limit(5);

        if (upcomingError) throw upcomingError;

        // Fetch recent bookings
        const { data: recentData, error: recentError } = await supabase
          .from('bookings')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (recentError) throw recentError;

        // Calculate revenue
        let totalRevenue = 0;
        if (recentData) {
          totalRevenue = recentData.length * 20000; // advance payment
        }

        setStats({
          todayBookings: todayData?.length || 0,
          upcomingBookings: upcomingData?.length || 0,
          recentBookings: recentData || [],
          totalRevenue,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      icon: Calendar,
      label: "Today's Bookings",
      value: stats.todayBookings,
      color: 'from-[#E8BFCF] to-pink-500',
    },
    {
      icon: Clock,
      label: 'Upcoming',
      value: stats.upcomingBookings,
      color: 'from-purple-400 to-purple-600',
    },
    {
      icon: TrendingUp,
      label: 'Revenue',
      value: `${stats.totalRevenue.toLocaleString()}₮`,
      color: 'from-[#C9A86A] to-yellow-600',
    },
    {
      icon: Users,
      label: 'Total Bookings',
      value: stats.recentBookings.length,
      color: 'from-blue-400 to-blue-600',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
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
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 lg:mb-12"
        >
          <h1 className="font-playfair text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1F1F1F] mb-2">
            Dashboard
          </h1>
          <p className="font-manrope text-gray-600 text-sm sm:text-base">
            Welcome back! Here's an overview of your business.
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 lg:mb-8"
        >
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                className={`bg-gradient-to-br ${card.color} rounded-2xl p-4 sm:p-6 text-white shadow-lg hover:shadow-xl transition-all`}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-manrope text-xs sm:text-sm opacity-90 mb-1 truncate">
                      {card.label}
                    </p>
                    <p className="font-playfair text-xl sm:text-3xl font-bold truncate">
                      {card.value}
                    </p>
                  </div>
                  <Icon size={24} className="opacity-80 flex-shrink-0 sm:hidden" />
                  <Icon size={32} className="opacity-80 flex-shrink-0 hidden sm:block" />
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Recent Bookings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg p-4 sm:p-6"
        >
          <h2 className="font-playfair text-xl sm:text-2xl font-bold text-[#1F1F1F] mb-4 sm:mb-6">
            Recent Bookings
          </h2>
          {stats.recentBookings.length > 0 ? (
            <>
              {/* Mobile cards */}
              <div className="grid grid-cols-1 gap-3 lg:hidden">
                {stats.recentBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="border border-gray-100 rounded-xl p-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-manrope font-semibold text-[#1F1F1F] truncate">
                        {booking.customer_name}
                      </p>
                      <p className="font-manrope text-xs text-gray-600">
                        {booking.date} · {booking.time}
                      </p>
                    </div>
                    <span
                      className={`flex-shrink-0 px-3 py-1 rounded-full font-manrope text-xs font-semibold ${
                        booking.status === 'confirmed'
                          ? 'bg-green-100 text-green-800'
                          : booking.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left font-manrope font-semibold text-[#1F1F1F] py-3">
                        Customer
                      </th>
                      <th className="text-left font-manrope font-semibold text-[#1F1F1F] py-3">
                        Date
                      </th>
                      <th className="text-left font-manrope font-semibold text-[#1F1F1F] py-3">
                        Time
                      </th>
                      <th className="text-left font-manrope font-semibold text-[#1F1F1F] py-3">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentBookings.map((booking) => (
                      <tr key={booking.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="font-manrope text-[#1F1F1F] py-3">
                          {booking.customer_name}
                        </td>
                        <td className="font-manrope text-gray-600 py-3">
                          {booking.date}
                        </td>
                        <td className="font-manrope text-gray-600 py-3">
                          {booking.time}
                        </td>
                        <td className="py-3">
                          <span className={`inline-block px-3 py-1 rounded-full font-manrope text-sm font-semibold ${
                            booking.status === 'confirmed'
                              ? 'bg-green-100 text-green-800'
                              : booking.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="font-manrope text-gray-600 text-center py-8">
              No bookings yet
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
