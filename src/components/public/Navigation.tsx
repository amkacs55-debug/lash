import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSalonSettings } from '@/hooks/useSalonSettings';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { settings } = useSalonSettings();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Нүүр', href: '/' },
    { label: 'Галерей', href: '/gallery' },
    { label: 'Үйлчилгээ', href: '/services' },
    { label: 'Холбоо барих', href: '/contact' },
  ];

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/80 backdrop-blur-md shadow-lg'
          : 'bg-[#FAF7F2]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            {settings?.logo_url ? (
              <img
                src={settings.logo_url}
                alt={settings.salon_name || 'Logo'}
                className="h-14 w-14 sm:h-16 sm:w-16 rounded-full object-cover shadow-md ring-1 ring-black/5"
              />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-[#E8BFCF] to-[#C9A86A] rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">L</span>
              </div>
            )}
            <span className="font-playfair text-2xl font-bold text-[#1F1F1F] hidden sm:inline">
              {settings?.salon_name || 'Lash Studio'}
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="text-[#1F1F1F] font-manrope hover:text-[#E8BFCF] transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/services"
              className="bg-gradient-to-r from-[#E8BFCF] to-[#C9A86A] text-white px-6 py-2 rounded-full font-manrope hover:shadow-lg transition-shadow"
            >
              Цаг Захиалах
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-[#1F1F1F]"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden pb-4 space-y-2"
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="block px-4 py-2 text-[#1F1F1F] hover:bg-[#E8BFCF]/10 rounded-lg transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/services"
              className="block bg-gradient-to-r from-[#E8BFCF] to-[#C9A86A] text-white px-4 py-2 rounded-lg font-manrope text-center"
              onClick={() => setIsOpen(false)}
            >
              Цаг Захиалах
            </Link>
          </motion.div>
        )}
      </div>
    </nav>
  );
}
