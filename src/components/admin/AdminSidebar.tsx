import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, LayoutDashboard, Calendar, Scissors, Images, Settings, Menu, X } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useSalonSettings } from '@/hooks/useSalonSettings';

const menuItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
  { label: 'Bookings', icon: Calendar, href: '/admin/bookings' },
  { label: 'Services', icon: Scissors, href: '/admin/services' },
  { label: 'Gallery', icon: Images, href: '/admin/gallery' },
  { label: 'Settings', icon: Settings, href: '/admin/settings' },
];

export default function AdminSidebar() {
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const [isOpen, setIsOpen] = useState(false);
  const { settings } = useSalonSettings();

  const isActive = (href: string) => location.pathname === href;

  const handleLogout = () => {
    logout();
    window.location.href = '/admin/login';
  };

  const activeItem = menuItems.find((item) => isActive(item.href));

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between bg-white shadow-sm px-4 py-3">
        <div className="flex items-center gap-2">
          {settings?.logo_url ? (
            <img
              src={settings.logo_url}
              alt={settings.salon_name || 'Logo'}
              className="h-10 w-10 rounded-full object-cover flex-shrink-0 shadow ring-1 ring-black/5"
            />
          ) : (
            <div className="w-8 h-8 bg-gradient-to-br from-[#E8BFCF] to-[#C9A86A] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">L</span>
            </div>
          )}
          <span className="font-playfair text-base font-bold text-[#1F1F1F] truncate">
            {activeItem?.label || 'Admin'}
          </span>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-lg text-[#1F1F1F] hover:bg-gray-100 transition-all"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar: drawer on mobile, static on desktop */}
      <aside
        className={`
          bg-white shadow-lg flex flex-col z-50
          fixed inset-y-0 left-0 w-72 max-w-[80vw] transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:w-64 lg:max-w-none lg:h-full
        `}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {settings?.logo_url ? (
              <img
                src={settings.logo_url}
                alt={settings.salon_name || 'Logo'}
                className="h-12 w-12 rounded-full object-cover flex-shrink-0 shadow ring-1 ring-black/5"
              />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-[#E8BFCF] to-[#C9A86A] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">L</span>
              </div>
            )}
            <span className="font-playfair text-lg font-bold text-[#1F1F1F]">Admin</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1 rounded-lg text-gray-500 hover:bg-gray-100 transition-all"
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-4 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all ${
                  active
                    ? 'bg-gradient-to-r from-[#E8BFCF] to-[#C9A86A] text-white'
                    : 'text-[#1F1F1F] hover:bg-gray-100'
                }`}
              >
                <Icon size={20} className="flex-shrink-0" />
                <span className="font-manrope">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all font-manrope"
          >
            <LogOut size={20} className="flex-shrink-0" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
