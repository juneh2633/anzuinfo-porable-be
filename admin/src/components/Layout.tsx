import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Decorative background blooms */}
      <div className="fixed top-0 left-0 w-96 h-96 bg-primary-600/20 rounded-full blur-[128px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[128px] pointer-events-none translate-x-1/3 translate-y-1/3" />
      
      <Sidebar />
      <main className="flex-1 h-full overflow-y-auto z-10 p-8">
        <div className="max-w-6xl mx-auto h-full animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
