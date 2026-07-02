import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/contexts/SupabaseContext';
import { Save, AlertCircle } from 'lucide-react';
import ImageDropzone from '@/components/admin/ImageDropzone';

interface Settings {
  id?: string;
  salon_name: string;
  logo_url?: string;
  address: string;
  address_image_url?: string;
  phone: string;
  facebook_link: string;
  working_hours?: string;
  qpay_config?: {
    merchant_id?: string;
    api_key?: string;
  };
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<Settings>({
    salon_name: '',
    address: '',
    phone: '',
    facebook_link: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      if (settings.id) {
        const { error } = await supabase
          .from('settings')
          .update(settings)
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('settings').insert([settings]);

        if (error) throw error;
      }

      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      const detail =
        error && typeof error === 'object' && 'message' in error
          ? (error as { message: string }).message
          : 'Тодорхойгүй алдаа';
      setMessage(`Хадгалахад алдаа гарлаа: ${detail}`);
    } finally {
      setSaving(false);
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
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 lg:mb-8"
        >
          <h1 className="font-playfair text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1F1F1F] mb-2">
            Settings
          </h1>
          <p className="font-manrope text-gray-600 text-sm sm:text-base">
            Manage your salon information and configuration
          </p>
        </motion.div>

        {/* Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 font-manrope ${
              message.includes('successfully')
                ? 'bg-green-100 text-green-800 border-2 border-green-300'
                : 'bg-red-100 text-red-800 border-2 border-red-300'
            }`}
          >
            <AlertCircle size={20} />
            {message}
          </motion.div>
        )}

        {/* Settings Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          onSubmit={handleSave}
          className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 space-y-6"
        >
          {/* Basic Info */}
          <div>
            <h2 className="font-playfair text-xl sm:text-2xl font-bold text-[#1F1F1F] mb-6">
              Basic Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block font-manrope font-semibold text-[#1F1F1F] mb-2">
                  Salon Name
                </label>
                <input
                  type="text"
                  name="salon_name"
                  value={settings.salon_name}
                  onChange={handleChange}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg font-manrope focus:border-[#C9A86A] outline-none"
                  required
                />
              </div>

              <ImageDropzone
                label="Logo"
                value={settings.logo_url}
                onChange={(url) =>
                  setSettings((prev) => ({ ...prev, logo_url: url }))
                }
                aspect="square"
              />
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h2 className="font-playfair text-xl sm:text-2xl font-bold text-[#1F1F1F] mb-6">
              Contact Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block font-manrope font-semibold text-[#1F1F1F] mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={settings.phone}
                  onChange={handleChange}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg font-manrope focus:border-[#C9A86A] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-manrope font-semibold text-[#1F1F1F] mb-2">
                  Address
                </label>
                <textarea
                  name="address"
                  value={settings.address}
                  onChange={handleChange}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg font-manrope focus:border-[#C9A86A] outline-none"
                  rows={3}
                  required
                />
              </div>

              <ImageDropzone
                label="Address Image"
                value={settings.address_image_url}
                onChange={(url) =>
                  setSettings((prev) => ({ ...prev, address_image_url: url }))
                }
                aspect="wide"
              />

              <div>
                <label className="block font-manrope font-semibold text-[#1F1F1F] mb-2">
                  Facebook Link
                </label>
                <input
                  type="url"
                  name="facebook_link"
                  value={settings.facebook_link}
                  onChange={handleChange}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg font-manrope focus:border-[#C9A86A] outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Working Hours */}
          <div>
            <h2 className="font-playfair text-xl sm:text-2xl font-bold text-[#1F1F1F] mb-6">
              Working Hours
            </h2>
            <div>
              <label className="block font-manrope font-semibold text-[#1F1F1F] mb-2">
                Hours (e.g., Mon-Fri: 10am-6pm, Sat: 10am-4pm)
              </label>
              <textarea
                name="working_hours"
                value={settings.working_hours || ''}
                onChange={handleChange}
                className="w-full p-3 border-2 border-gray-300 rounded-lg font-manrope focus:border-[#C9A86A] outline-none"
                rows={3}
                placeholder="Enter your working hours"
              />
            </div>
          </div>

          {/* QPay Configuration */}
          <div>
            <h2 className="font-playfair text-xl sm:text-2xl font-bold text-[#1F1F1F] mb-6">
              QPay Configuration
            </h2>
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
              <p className="font-manrope text-sm text-blue-700">
                Configure your QPay integration for payment processing
              </p>
              <div>
                <label className="block font-manrope font-semibold text-[#1F1F1F] mb-2">
                  Merchant ID
                </label>
                <input
                  type="text"
                  placeholder="Your QPay Merchant ID"
                  className="w-full p-3 border-2 border-gray-300 rounded-lg font-manrope focus:border-[#C9A86A] outline-none"
                />
              </div>
              <div>
                <label className="block font-manrope font-semibold text-[#1F1F1F] mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  placeholder="Your QPay API Key"
                  className="w-full p-3 border-2 border-gray-300 rounded-lg font-manrope focus:border-[#C9A86A] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#E8BFCF] to-[#C9A86A] text-white py-4 rounded-lg font-manrope font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={20} />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </motion.form>
      </div>
    </div>
  );
}
