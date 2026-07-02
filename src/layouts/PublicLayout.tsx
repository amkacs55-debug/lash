import { Outlet } from 'react-router-dom';
import Navigation from '@/components/public/Navigation';
import Footer from '@/components/public/Footer';

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <Navigation />
      <main className="pt-20">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
