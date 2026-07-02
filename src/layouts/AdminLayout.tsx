import { Outlet } from 'react-router-dom';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminLayout() {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen lg:h-screen bg-gray-100">
      <AdminSidebar />
      <main className="flex-1 lg:overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
