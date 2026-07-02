import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/contexts/SupabaseContext';
import { Trash2, Plus } from 'lucide-react';
import ImageDropzone from '@/components/admin/ImageDropzone';

interface GalleryImage {
  id: string;
  url: string;
  alt: string;
  position: number;
}

export default function AdminGallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .order('position', { ascending: true });

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error('Error fetching gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddImage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!imageUrl) {
      alert('Please enter an image URL');
      return;
    }

    try {
      const nextPosition = Math.max(...images.map((i) => i.position || 0), 0) + 1;

      const { error } = await supabase.from('gallery').insert([
        {
          url: imageUrl,
          alt: imageAlt || 'Lash Extension',
          position: nextPosition,
        },
      ]);

      if (error) throw error;

      setImageUrl('');
      setImageAlt('');
      fetchImages();
    } catch (error) {
      console.error('Error adding image:', error);
      const detail =
        error && typeof error === 'object' && 'message' in error
          ? (error as { message: string }).message
          : 'Тодорхойгүй алдаа';
      alert(
        `Зураг нэмэхэд алдаа гарлаа: ${detail}\n\nХэрэв энэ нь "row-level security policy" эсвэл "permission denied" гэсэн алдаа бол Supabase дээрх "gallery" хүснэгтэд INSERT/UPDATE/DELETE зөвшөөрсөн policy үүсгэх шаардлагатай.`
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const { error } = await supabase.from('gallery').delete().eq('id', id);

      if (error) throw error;
      fetchImages();
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  const handleReorder = async (id: string, newPosition: number) => {
    try {
      const { error } = await supabase
        .from('gallery')
        .update({ position: newPosition })
        .eq('id', id);

      if (error) throw error;
      fetchImages();
    } catch (error) {
      console.error('Error reordering:', error);
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
            Gallery
          </h1>

          {/* Upload Form */}
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 mb-6 lg:mb-8">
            <h2 className="font-playfair text-xl sm:text-2xl font-bold text-[#1F1F1F] mb-6">
              Upload Image
            </h2>
            <form onSubmit={handleAddImage} className="space-y-4">
              <ImageDropzone
                label="Gallery Image"
                value={imageUrl}
                onChange={setImageUrl}
                aspect="video"
              />
              <input
                type="text"
                placeholder="Alt text (optional)"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg font-manrope focus:border-[#C9A86A] outline-none"
              />
              <button
                type="submit"
                className="flex items-center gap-2 bg-gradient-to-r from-[#E8BFCF] to-[#C9A86A] text-white px-6 py-3 rounded-lg font-manrope hover:shadow-lg transition-all"
              >
                <Plus size={20} />
                Add Image
              </button>
            </form>
          </div>
        </motion.div>

        {/* Images Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {images.map((image, index) => (
            <div
              key={image.id}
              className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 ring-1 ring-black/5"
            >
              <div className="relative h-64 overflow-hidden bg-gray-100">
                <img
                  src={image.url}
                  alt={image.alt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-[#1F1F1F] text-xs font-manrope font-semibold px-2.5 py-1 rounded-full shadow">
                  #{index + 1}
                </span>
              </div>
              <div className="p-4">
                <p className="font-manrope text-sm text-gray-600 mb-4 truncate">
                  {image.alt || 'Гарчиггүй'}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {index > 0 && (
                    <button
                      onClick={() =>
                        handleReorder(image.id, image.position - 1)
                      }
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border-2 border-gray-300 text-[#1F1F1F] rounded-lg font-manrope text-sm hover:border-[#C9A86A] transition-all"
                    >
                      Move Up
                    </button>
                  )}
                  {index < images.length - 1 && (
                    <button
                      onClick={() =>
                        handleReorder(image.id, image.position + 1)
                      }
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border-2 border-gray-300 text-[#1F1F1F] rounded-lg font-manrope text-sm hover:border-[#C9A86A] transition-all"
                    >
                      Move Down
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(image.id)}
                    className="flex items-center justify-center gap-2 px-3 py-2 border-2 border-red-600 text-red-600 rounded-lg font-manrope text-sm hover:bg-red-50 transition-all"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {images.length === 0 && (
          <div className="text-center py-12">
            <p className="font-manrope text-gray-600 text-lg">
              No images yet. Upload your first image to get started!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
