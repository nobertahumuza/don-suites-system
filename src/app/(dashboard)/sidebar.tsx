'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/rooms', label: 'Rooms', icon: 'fas fa-bed' },
  { href: '/bookings', label: 'Bookings', icon: 'fas fa-calendar-alt' },
  { href: '/bookings/new', label: 'New Booking', icon: 'fas fa-plus-circle' },
  { href: '/bookings/checkin', label: 'Check-in', icon: 'fas fa-sign-in-alt' },
  { href: '/bookings/checkout', label: 'Check-out', icon: 'fas fa-sign-out-alt' },
];

export default function Sidebar({ user }: { user: { full_name: string; role: string } }) {
  const pathname = usePathname();

  return (
    <>
      <div
        id="sidebar-overlay"
        className="fixed inset-0 bg-black/50 z-40 hidden md:hidden"
        onClick={() => {
          const sidebar = document.getElementById('mobile-sidebar');
          if (sidebar) sidebar.classList.add('-translate-x-full');
        }}
      />
      <aside
        id="mobile-sidebar"
        className="fixed top-0 left-0 z-50 h-full w-[240px] flex flex-col -translate-x-full md:translate-x-0 transition-transform duration-200"
        style={{
          background: 'linear-gradient(180deg, #080e22, #0f1a3c)',
        }}
      >
        <div className="flex items-center gap-3 px-5 h-14 border-b border-white/10">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: '#c9a96e', color: '#0f1a3c' }}
          >
            DS
          </div>
          <div>
            <div className="text-white text-sm font-bold leading-tight">
              DON <span style={{ color: '#c9a96e' }}>SUITES</span>
            </div>
            <div className="text-white/40 text-[10px]">Management System</div>
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-white/30 px-3 mb-2">
            Accommodation
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-1 transition-all duration-150 ${
                  isActive ? 'text-white' : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
                style={isActive ? { background: 'rgba(201,169,110,0.15)', color: '#c9a96e' } : {}}
              >
                <i className={`${item.icon} w-5 text-center text-[13px]`}></i>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-3 border-t border-white/10">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{ background: 'rgba(201,169,110,0.2)', color: '#c9a96e' }}
            >
              {user.full_name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-medium truncate">{user.full_name}</div>
              <div className="text-white/40 text-[10px] capitalize">{user.role}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
