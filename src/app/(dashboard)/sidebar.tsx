'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

interface Section {
  title: string;
  items: NavItem[];
  roles: string[];
}

const sections: Section[] = [
  {
    title: 'Main',
    roles: ['admin', 'reception', 'storekeeper', 'security'],
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: 'fas fa-th-large' },
    ],
  },
  {
    title: 'Front Office',
    roles: ['admin', 'reception'],
    items: [
      { href: '/front-desk', label: 'Front Desk', icon: 'fas fa-desktop' },
      { href: '/rooms', label: 'Rooms', icon: 'fas fa-bed' },
      { href: '/rooms/new', label: 'Room Types', icon: 'fas fa-plus-square' },
      { href: '/rooms/status', label: 'Room Status Grid', icon: 'fas fa-th' },
      { href: '/bookings', label: 'Bookings', icon: 'fas fa-calendar-alt' },
      { href: '/bookings/new', label: 'New Booking', icon: 'fas fa-plus-circle' },
      { href: '/bookings/walk-in', label: 'Walk-in', icon: 'fas fa-walking' },
      { href: '/bookings/checkin', label: 'Check-in', icon: 'fas fa-sign-in-alt' },
      { href: '/bookings/checkout', label: 'Check-out', icon: 'fas fa-sign-out-alt' },
      { href: '/bookings/transfer', label: 'Room Transfer', icon: 'fas fa-exchange-alt' },
      { href: '/bookings/calendar', label: 'Calendar View', icon: 'fas fa-calendar-week' },
      { href: '/housekeeping', label: 'Housekeeping', icon: 'fas fa-broom' },
      { href: '/guests', label: 'Guests', icon: 'fas fa-users' },
    ],
  },
  {
    title: 'Food & Beverage',
    roles: ['admin', 'reception'],
    items: [
      { href: '/fb/orders', label: 'Orders', icon: 'fas fa-clipboard-list' },
      { href: '/fb/orders/new', label: 'New Order', icon: 'fas fa-plus' },
      { href: '/fb/items', label: 'Menu Items', icon: 'fas fa-utensils' },
      { href: '/fb/categories', label: 'Categories', icon: 'fas fa-tags' },
    ],
  },
  {
    title: 'Conference & Events',
    roles: ['admin', 'reception'],
    items: [
      { href: '/conference', label: 'Conference', icon: 'fas fa-chalkboard-teacher' },
      { href: '/garden-bookings', label: 'Garden Bookings', icon: 'fas fa-seedling' },
    ],
  },
  {
    title: 'Security',
    roles: ['admin', 'security'],
    items: [
      { href: '/security/visitors', label: 'Visitors', icon: 'fas fa-id-badge' },
      { href: '/security/patrol', label: 'Patrol Logs', icon: 'fas fa-walking' },
      { href: '/security/incidents', label: 'Incidents', icon: 'fas fa-exclamation-triangle' },
      { href: '/night-audit', label: 'Night Audit', icon: 'fas fa-moon' },
      { href: '/parking', label: 'Parking', icon: 'fas fa-parking' },
    ],
  },
  {
    title: 'Staff',
    roles: ['admin'],
    items: [
      { href: '/staff', label: 'Staff List', icon: 'fas fa-users-cog' },
      { href: '/staff/shifts', label: 'Shifts', icon: 'fas fa-clock' },
      { href: '/staff/leave', label: 'Leave', icon: 'fas fa-calendar-times' },
      { href: '/staff/users', label: 'User Accounts', icon: 'fas fa-user-shield' },
    ],
  },
  {
    title: 'Finance',
    roles: ['admin'],
    items: [
      { href: '/finance', label: 'Overview', icon: 'fas fa-chart-line' },
      { href: '/finance/expenses', label: 'Expenses', icon: 'fas fa-receipt' },
      { href: '/finance/expense-categories', label: 'Expense Categories', icon: 'fas fa-list-alt' },
      { href: '/finance/wages', label: 'Wages', icon: 'fas fa-money-bill-wave' },
      { href: '/finance/utilities', label: 'Utilities', icon: 'fas fa-bolt' },
      { href: '/finance/refunds', label: 'Refunds', icon: 'fas fa-undo' },
    ],
  },
  {
    title: 'Inventory',
    roles: ['admin', 'storekeeper'],
    items: [
      { href: '/inventory', label: 'Stock Overview', icon: 'fas fa-boxes' },
      { href: '/inventory/categories', label: 'Categories', icon: 'fas fa-layer-group' },
      { href: '/inventory/stock-adjustments', label: 'Stock Adjustments', icon: 'fas fa-sliders-h' },
    ],
  },
  {
    title: 'Pricing',
    roles: ['admin'],
    items: [
      { href: '/pricing/seasonal', label: 'Seasonal Pricing', icon: 'fas fa-sun' },
      { href: '/pricing/discounts', label: 'Discounts', icon: 'fas fa-percent' },
    ],
  },
  {
    title: 'Reports',
    roles: ['admin'],
    items: [
      { href: '/reports', label: 'Reports Center', icon: 'fas fa-chart-bar' },
    ],
  },
  {
    title: 'System',
    roles: ['admin'],
    items: [
      { href: '/audit', label: 'Audit Trail', icon: 'fas fa-history' },
      { href: '/settings/smtp', label: 'Email Settings', icon: 'fas fa-envelope-open-text' },
      { href: '/settings/backup', label: 'Backup', icon: 'fas fa-database' },
      { href: '/profile', label: 'My Profile', icon: 'fas fa-user-circle' },
    ],
  },
];

export default function Sidebar({ user }: { user: { full_name: string; role: string } }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleSection = (title: string) => {
    setCollapsed((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const visibleSections = sections.filter((s) => s.roles.includes(user.role));

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
          {visibleSections.map((section) => {
            const isCollapsed = collapsed[section.title] ?? false;
            return (
              <div key={section.title} className="mb-3">
                <button
                  onClick={() => toggleSection(section.title)}
                  className="flex items-center justify-between w-full text-[10px] font-semibold uppercase tracking-wider text-white/30 px-3 mb-1 hover:text-white/50 transition-colors"
                >
                  {section.title}
                  <i
                    className={`fas fa-chevron-down text-[9px] transition-transform duration-200 ${
                      isCollapsed ? '-rotate-90' : ''
                    }`}
                  />
                </button>
                {!isCollapsed &&
                  section.items.map((item) => {
                    const isActive =
                      pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium mb-0.5 transition-all duration-150 ${
                          isActive
                            ? 'text-white'
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                        style={
                          isActive
                            ? { background: 'rgba(201,169,110,0.15)', color: '#c9a96e' }
                            : {}
                        }
                      >
                        <i className={`${item.icon} w-5 text-center text-[13px]`}></i>
                        {item.label}
                      </Link>
                    );
                  })}
              </div>
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
