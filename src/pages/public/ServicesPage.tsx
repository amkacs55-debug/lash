import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/contexts/SupabaseContext';
import { ArrowRight, Info } from 'lucide-react';

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  duration?: number;
  image_url?: string;
  is_active: boolean;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const goToBooking = (service: Service) => {
    navigate('/booking', { state: { serviceId: service.id } });
  };

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setServices(data || []);
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="font-playfair text-5xl md:text-6xl font-bold text-[#1F1F1F] mb-4">
            Манай Үйлчилгээ
          </h1>
          <p className="font-manrope text-xl text-gray-600 max-w-2xl mx-auto">
            Байгалийн гоо үзэсгэлэнг тань улам гэрэлтүүлэх мэргэжлийн хиймэл сормуусны үйлчилгээ
          </p>
        </motion.div>

        {/* Notice */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mb-10 flex items-start sm:items-center gap-3 bg-[#C9A86A]/10 border-2 border-[#C9A86A]/30 rounded-2xl px-5 py-4 max-w-2xl mx-auto"
        >
          <Info className="text-[#C9A86A] flex-shrink-0 mt-0.5 sm:mt-0" size={22} />
          <p className="font-manrope text-sm sm:text-base text-[#6B5A32]">
            Та авах үйлчилгээгээ сонгоод цагаа захиална уу.
          </p>
        </motion.div>

        {/* Services Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#C9A86A] border-t-transparent" />
          </div>
        ) : services.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {services.map((service) => (
              <motion.div
                key={service.id}
                variants={itemVariants}
                whileHover={{ y: -8 }}
                className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 ring-1 ring-black/5 flex flex-col"
              >
                <div
                  onClick={() => goToBooking(service)}
                  className="relative h-72 overflow-hidden bg-gradient-to-br from-[#F5EDE4] to-[#EFE0D0] cursor-pointer"
                >
                  {service.image_url ? (
                    <img
                      src={service.image_url}
                      alt={service.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-playfair text-6xl text-[#C9A86A]/30">✦</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {service.duration ? (
                    <span className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-[#1F1F1F] text-xs font-manrope font-semibold px-3 py-1.5 rounded-full shadow">
                      {service.duration} мин
                    </span>
                  ) : null}
                </div>
                <div className="p-6 sm:p-8 flex flex-col flex-1">
                  <h3 className="font-playfair text-2xl font-bold text-[#1F1F1F] mb-3">
                    {service.title}
                  </h3>
                  {service.description && (
                    <p className="font-manrope text-gray-600 mb-6 line-clamp-3 leading-relaxed">
                      {service.description}
                    </p>
                  )}
                  <div className="mt-auto flex items-center justify-between gap-4 pt-2 border-t border-gray-100">
                    <p className="font-playfair text-3xl font-bold bg-gradient-to-r from-[#E8BFCF] to-[#C9A86A] bg-clip-text text-transparent">
                      {service.price.toLocaleString()}₮
                    </p>
                    <Link
                      to="/booking"
                      state={{ serviceId: service.id }}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-[#E8BFCF] to-[#C9A86A] text-white px-6 py-3 rounded-full font-manrope font-semibold hover:shadow-lg hover:scale-105 transition-all whitespace-nowrap"
                    >
                      Захиалах
                      <ArrowRight size={18} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-20">
            <p className="font-manrope text-xl text-gray-600">
              Үйлчилгээнүүд удахгүй нэмэгдэнэ. Дараа дахин зочилно уу!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
