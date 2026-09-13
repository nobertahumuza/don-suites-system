import { requireAuth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Sidebar from './sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  return (
    <div className="flex min-h-screen" style={{ background: '#f1f5f9' }}>
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col ml-0 md:ml-[240px]">
        <header
          className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-6 h-14"
          style={{
            background: 'linear-gradient(135deg, #0f1a3c, #1a2d5a)',
          }}
        >
          <div className="flex items-center gap-3">
            <button
              id="sidebar-toggle"
              className="md:hidden text-white text-lg"
              onClick={() => {
                const sidebar = document.getElementById('mobile-sidebar');
                if (sidebar) sidebar.classList.toggle('translate-x-0');
                if (sidebar) sidebar.classList.toggle('-translate-x-full');
              }}
            >
              <i className="fas fa-bars"></i>
            </button>
            <h1 className="text-white text-sm font-semibold tracking-wide">
              DON <span style={{ color: '#c9a96e' }}>SUITES</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white text-xs hidden sm:inline">{user.full_name}</span>
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase"
              style={{
                background: 'rgba(201,169,110,0.2)',
                color: '#c9a96e',
              }}
            >
              {user.role}
            </span>
            <form action="/api/auth/logout" method="GET">
              <button
                type="submit"
                className="text-white/60 hover:text-white text-xs transition-colors"
                title="Logout"
              >
                <i className="fas fa-sign-out-alt"></i>
              </button>
            </form>
          </div>
        </header>
        <main className="flex-1 p-3 md:p-5 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
