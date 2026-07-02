import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/contexts/SupabaseContext';
import { Trash2, Edit2, Plus } from 'lucide-react';
import ImageDropzone from '@/components/admin/ImageDropzone';

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  duration?: number;
  image_url?: string;
  is_active: boolean;
}

export default function AdminServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    duration: '',
    image_url: '',
    is_active: true,
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const serviceData = {
      title: formData.title,
      description: formData.description,
      price: parseInt(formData.price),
      duration: formData.duration ? parseInt(formData.duration) : null,
      image_url: formData.image_url || null,
      is_active: formData.is_active,
    };

    try {
      if (editingId) {
        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', editingId);

        if (error) throw error;
        setEditingId(null);
      } else {
        const { error } = await supabase
          .from('services')
          .insert([serviceData]);

        if (error) throw error;
      }

      setFormData({
        title: '',
        description: '',
        price: '',
        duration: '',
        image_url: '',
        is_active: true,
      });
      setShowForm(false);
      fetchServices();
    } catch (error) {
      console.error('Error saving service:', error);
      alert('Error saving service');
    }
  };

  const handleEdit = (service: Service) => {
    setFormData({
      title: service.title,
      description: service.description,
      price: service.price.toString(),
      duration: service.duration?.toString() || '',
      image_url: service.image_url || '',
      is_active: service.is_active,
    });
    setEditingId(service.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      const { error } = await supabase.from('services').delete().eq('id', id);

      if (error) throw error;
      fetchServices();
    } catch (error) {
      console.error('Error deleting service:', error);
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
          className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 lg:mb-8"
        >
          <h1 className="font-playfair text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1F1F1F]">
            Services
          </h1>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setFormData({
                title: '',
                description: '',
                price: '',
                duration: '',
                image_url: '',
                is_active: true,
              });
            }}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#E8BFCF] to-[#C9A86A] text-white px-6 py-3 rounded-lg font-manrope hover:shadow-lg transition-all"
          >
            <Plus size={20} />
            Add Service
          </button>
        </motion.div>

        {/* Form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 mb-6 lg:mb-8"
          >
            <h2 className="font-playfair text-xl sm:text-2xl font-bold text-[#1F1F1F] mb-6">
              {editingId ? 'Edit Service' : 'Create New Service'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Service Title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="p-3 border-2 border-gray-300 rounded-lg font-manrope focus:border-[#C9A86A] outline-none"
                  required
                />
                <input
                  type="number"
                  placeholder="Price (₮)"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  className="p-3 border-2 border-gray-300 rounded-lg font-manrope focus:border-[#C9A86A] outline-none"
                  required
                />
              </div>

              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full p-3 border-2 border-gray-300 rounded-lg font-manrope focus:border-[#C9A86A] outline-none"
                rows={3}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="number"
                  placeholder="Duration (minutes)"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({ ...formData, duration: e.target.value })
                  }
                  className="p-3 border-2 border-gray-300 rounded-lg font-manrope focus:border-[#C9A86A] outline-none"
                />
              </div>

              <ImageDropzone
                label="Service Image"
                value={formData.image_url}
                onChange={(url) => setFormData({ ...formData, image_url: url })}
                aspect="video"
              />

              <label className="flex items-center gap-3 p-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-[#C9A86A] transition-all">

                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                />
                <span className="font-manrope">Active</span>
              </label>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-[#E8BFCF] to-[#C9A86A] text-white py-3 rounded-lg font-manrope hover:shadow-lg transition-all"
                >
                  {editingId ? 'Update Service' : 'Create Service'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                  className="flex-1 border-2 border-gray-300 text-[#1F1F1F] py-3 rounded-lg font-manrope hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Services Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all"
            >
              {service.image_url && (
                <div className="h-48 overflow-hidden bg-gray-100">
                  <img
                    src={service.image_url}
                    alt={service.title}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <div className="p-6">
                <h3 className="font-playfair text-xl font-bold text-[#1F1F1F] mb-2">
                  {service.title}
                </h3>
                <p className="font-manrope text-gray-600 text-sm mb-4 line-clamp-2">
                  {service.description}
                </p>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="font-playfair text-2xl font-bold text-[#C9A86A]">
                      {service.price.toLocaleString()}₮
                    </p>
                    {service.duration && (
                      <p className="text-xs text-gray-600 font-manrope">
                        {service.duration} min
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full font-manrope text-xs font-semibold ${
                      service.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {service.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(service)}
                    className="flex-1 flex items-center justify-center gap-2 border-2 border-[#C9A86A] text-[#C9A86A] py-2 rounded-lg font-manrope hover:bg-[#C9A86A]/10 transition-all"
                  >
                    <Edit2 size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="flex-1 flex items-center justify-center gap-2 border-2 border-red-600 text-red-600 py-2 rounded-lg font-manrope hover:bg-red-50 transition-all"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
