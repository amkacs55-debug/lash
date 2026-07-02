import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

export default function HomePage() {
  const fadeUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#FAF7F2] via-white to-[#E8BFCF]/20" />

        <div className="relative z-10 text-center px-4 max-w-4xl">
          <motion.div {...fadeUp}>
            <h1 className="font-playfair text-6xl md:text-7xl font-bold text-[#1F1F1F] mb-6 leading-tight">
              Гоо сайхнаа Илэрхийл
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <p className="font-manrope text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Мэргэжлийн анхаарал халамж, нарийвчлалтай хосгүй хиймэл сормуусны урлагийг мэдрээрэй
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              to="/services"
              className="bg-gradient-to-r from-[#E8BFCF] to-[#C9A86A] text-white px-8 py-4 rounded-full font-manrope font-semibold hover:shadow-xl transition-all inline-flex items-center justify-center gap-2"
            >
              Цаг Захиалах
              <ChevronRight size={20} />
            </Link>
            <Link
              to="/gallery"
              className="border-2 border-[#C9A86A] text-[#C9A86A] px-8 py-4 rounded-full font-manrope font-semibold hover:bg-[#C9A86A]/10 transition-all"
            >
              Галерей Үзэх
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="grid grid-cols-3 gap-4 mt-16 max-w-md mx-auto"
          >
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="font-playfair text-2xl font-bold text-[#C9A86A]">500+</div>
              <div className="text-sm text-gray-600 font-manrope">Сэтгэл Ханамжтай Үйлчлүүлэгч</div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="font-playfair text-2xl font-bold text-[#C9A86A]">5★</div>
              <div className="text-sm text-gray-600 font-manrope">Үнэлгээ</div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="font-playfair text-2xl font-bold text-[#C9A86A]">8+</div>
              <div className="text-sm text-gray-600 font-manrope">Жилийн Туршлага</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="font-playfair text-5xl font-bold text-[#1F1F1F] text-center mb-16"
          >
            Бидэнд Итгэх Шалтгаан
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Дээд Зэргийн Чанар',
                description: 'Урт удаан хугацааны үр дүнд зориулж зөвхөн шилдэг материал, техник ашигладаг',
                icon: '✨',
              },
              {
                title: 'Мэргэжлийн Мастерууд',
                description: 'Олон жилийн туршлагатай, гэрчилгээжсэн мэргэжилтнүүд',
                icon: '👑',
              },
              {
                title: 'Тав Тухтай Студи',
                description: 'Тайван орчин, дээд зэргийн үйлчилгээ',
                icon: '🏠',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="bg-white rounded-3xl p-8 hover:shadow-xl transition-all"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="font-playfair text-2xl font-bold text-[#1F1F1F] mb-3">
                  {feature.title}
                </h3>
                <p className="font-manrope text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-[#E8BFCF] to-[#C9A86A]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="font-playfair text-5xl font-bold text-white mb-6"
          >
            Дүр Төрхөө Өөрчлөхөд Бэлэн Үү?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="font-manrope text-xl text-white/90 mb-8"
          >
            Өнөөдөр цагаа захиалж, мэргэжлийн хиймэл сормуусны ялгааг мэдрээрэй
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <Link
              to="/services"
              className="inline-block bg-white text-[#C9A86A] px-10 py-4 rounded-full font-manrope font-bold hover:shadow-xl transition-all"
            >
              Одоо Захиалах
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
