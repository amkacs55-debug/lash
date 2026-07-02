import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/contexts/SupabaseContext';
import { Phone, MapPin } from 'lucide-react';

interface Settings {
  salon_name: string;
  address: string;
  address_image_url?: string;
  phone: string;
  facebook_link: string;
}

export default function ContactPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('*')
          .single();

        if (error) throw error;
        setSettings(data);
      } catch (error) {
        console.error('Error fetching settings:', error);
        // Use default values
        setSettings({
          salon_name: 'Lash Studio',
          address: 'Дундговь аймаг, Дэлгэрэх дэлгүүрийн 2 давхар',
          phone: '88445111',
          facebook_link: 'https://www.facebook.com/share/19CG65eSJP/',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const fadeUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
    viewport: { once: true },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#C9A86A] border-t-transparent" />
      </div>
    );
  }

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
            Бидэнтэй Холбогдоорой
          </h1>
          <p className="font-manrope text-xl text-gray-600 max-w-2xl mx-auto">
            Манай салонд хүрэлцэн ирээрэй эсвэл шууд холбогдоорой
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Contact Info */}
          <motion.div {...fadeUp} className="space-y-8">
            {/* Address */}
            <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#E8BFCF] to-[#C9A86A] rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="font-playfair text-2xl font-bold text-[#1F1F1F] mb-2">
                    Хаяг
                  </h3>
                  <p className="font-manrope text-gray-700 text-lg">
                    {settings?.address}
                  </p>
                </div>
              </div>
            </div>

            {/* Phone */}
            <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#E8BFCF] to-[#C9A86A] rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="font-playfair text-2xl font-bold text-[#1F1F1F] mb-2">
                    Утасдах
                  </h3>
                  <a
                    href={`tel:${settings?.phone}`}
                    className="font-manrope text-lg text-[#C9A86A] hover:text-[#E8BFCF] transition-colors"
                  >
                    {settings?.phone}
                  </a>
                </div>
              </div>
            </div>

            {/* Social */}
            <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all">
              <h3 className="font-playfair text-2xl font-bold text-[#1F1F1F] mb-4">
                Биднийг Дагаарай
              </h3>
              <a
                href={settings?.facebook_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-gradient-to-r from-[#E8BFCF] to-[#C9A86A] text-white px-6 py-3 rounded-full font-manrope hover:shadow-lg transition-all"
              >
                Facebook
              </a>
            </div>
          </motion.div>

          {/* Map / Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="rounded-3xl overflow-hidden shadow-lg h-96 sm:h-full min-h-96"
          >
            {settings?.address_image_url ? (
              <img
                src={settings.address_image_url}
                alt="Salon Location"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#E8BFCF] to-[#C9A86A] flex items-center justify-center">
                <MapPin size={64} className="text-white opacity-70" />
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
