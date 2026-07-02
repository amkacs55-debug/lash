import { Link } from 'react-router-dom';
import { Phone } from 'lucide-react';
import { useSalonSettings } from '@/hooks/useSalonSettings';

export default function Footer() {
  const { settings } = useSalonSettings();
  const salonName = settings?.salon_name || 'Lash Studio';

  return (
    <footer className="bg-[#1F1F1F] text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              {settings?.logo_url && (
                <img
                  src={settings.logo_url}
                  alt={salonName}
                  className="h-12 w-12 rounded-full object-cover ring-1 ring-white/10"
                />
              )}
              <h3 className="font-playfair text-2xl">{salonName}</h3>
            </div>
            <p className="text-gray-400 font-manrope">
              Мэргэжлийн анхаарал халамжтай дээд зэргийн хиймэл сормуусны үйлчилгээ.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-playfair text-lg mb-4">Хурдан Холбоос</h4>
            <div className="space-y-2 font-manrope">
              <Link to="/" className="text-gray-400 hover:text-[#E8BFCF] transition">
                Нүүр
              </Link>
              <br />
              <Link to="/gallery" className="text-gray-400 hover:text-[#E8BFCF] transition">
                Галерей
              </Link>
              <br />
              <Link to="/services" className="text-gray-400 hover:text-[#E8BFCF] transition">
                Үйлчилгээ
              </Link>
              <br />
              <Link to="/contact" className="text-gray-400 hover:text-[#E8BFCF] transition">
                Холбоо барих
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-playfair text-lg mb-4">Холбоо Барих</h4>
            <div className="space-y-3 font-manrope">
              <a href="tel:88445111" className="flex items-center gap-2 text-gray-400 hover:text-[#E8BFCF] transition">
                <Phone size={18} />
                88445111
              </a>
              <a
                href="https://www.facebook.com/share/g/1Fnf6RprQ9/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-400 hover:text-[#E8BFCF] transition"
              >
                <span>f</span>
                Биднийг дагаарай
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-8 text-center text-gray-400 font-manrope">
          <p>&copy; Nomin Salon.</p>
        </div>
      </div>
    </footer>
  );
}
