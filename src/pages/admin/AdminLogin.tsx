import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { AlertCircle } from 'lucide-react';

export default function AdminLogin() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Simulated authentication
      // In a real app, this would authenticate with Supabase
      if (email && password.length >= 6) {
        const token = btoa(`${email}:${password}`);
        setAuth(token, email);
        navigate('/admin/dashboard');
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF7F2] to-white flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#E8BFCF] to-[#C9A86A] rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-2xl">L</span>
            </div>
          </div>

          <h1 className="font-playfair text-3xl font-bold text-[#1F1F1F] text-center mb-2">
            Admin Login
          </h1>
          <p className="font-manrope text-gray-600 text-center mb-8">
            Welcome back to Lash Studio Admin
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-2xl flex items-center gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
              <p className="font-manrope text-red-700">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4 mb-8">
            <div>
              <label className="block font-manrope text-sm font-semibold text-[#1F1F1F] mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-manrope focus:border-[#C9A86A] outline-none transition-colors"
                required
              />
            </div>
            <div>
              <label className="block font-manrope text-sm font-semibold text-[#1F1F1F] mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-manrope focus:border-[#C9A86A] outline-none transition-colors"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#E8BFCF] to-[#C9A86A] text-white py-3 rounded-xl font-manrope font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
            <p className="font-manrope text-xs text-blue-700 font-semibold mb-2">
              Demo Credentials:
            </p>
            <p className="font-manrope text-xs text-blue-600">
              Email: 
              <br />
              Password: 
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
