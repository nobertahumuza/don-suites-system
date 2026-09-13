"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  role: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles?: string[];
}

interface NavGroup {
  heading: string;
  items: NavItem[];
  roles: string[];
}

const navGroups: NavGroup[] = [
  {
    heading: "",
    items: [{ label: "Dashboard", href: "/dashboard", icon: "fas fa-tachometer-alt" }],
    roles: ["admin", "reception", "storekeeper", "security"],
  },
  {
    heading: "HOTEL SERVICES",
    items: [
      { label: "Rooms", href: "/accommodation/rooms", icon: "fas fa-bed" },
      { label: "Add/Edit Room", href: "/accommodation/add-room", icon: "fas fa-plus-circle" },
      { label: "Room Calendar", href: "/accommodation/calendar", icon: "fas fa-calendar-alt" },
      { label: "Front Desk", href: "/reception/front-desk", icon: "fas fa-bell-concierge" },
      { label: "New F&B Order", href: "/food-beverage/new-order", icon: "fas fa-plus-circle" },
      { label: "F&B Orders", href: "/food-beverage/orders", icon: "fas fa-receipt" },
      { label: "F&B Menu Items", href: "/food-beverage/items", icon: "fas fa-list" },
      { label: "F&B Categories", href: "/food-beverage/categories", icon: "fas fa-folder" },
      { label: "Guest Search", href: "/guests/search", icon: "fas fa-search" },
    ],
    roles: ["admin", "reception"],
  },
  {
    heading: "PRICING",
    items: [
      { label: "Room Pricing", href: "/pricing", icon: "fas fa-tag" },
      { label: "Seasonal Pricing", href: "/pricing/seasonal", icon: "fas fa-sun" },
      { label: "Discounts", href: "/pricing/discounts", icon: "fas fa-tags" },
      { label: "Bulk Price Update", href: "/pricing/bulk-update", icon: "fas fa-sync-alt", roles: ["admin"] },
    ],
    roles: ["admin", "reception", "storekeeper"],
  },
  {
    heading: "STORE & INVENTORY",
    items: [{ label: "Inventory", href: "/inventory", icon: "fas fa-boxes" }],
    roles: ["admin", "storekeeper"],
  },
  {
    heading: "SECURITY & PARKING",
    items: [
      { label: "Guest Register", href: "/security/guest-register", icon: "fas fa-clipboard-list" },
      { label: "Visitor Log", href: "/security/visitors", icon: "fas fa-user-shield" },
      { label: "Vehicle Parking", href: "/parking", icon: "fas fa-parking" },
      { label: "Incident Log", href: "/security/incidents", icon: "fas fa-exclamation-triangle" },
      { label: "Patrol Log", href: "/security/patrol", icon: "fas fa-shield-alt" },
    ],
    roles: ["admin", "security"],
  },
  {
    heading: "MANAGEMENT",
    items: [
      { label: "User Accounts", href: "/staff/users", icon: "fas fa-users-cog" },
      { label: "Staff", href: "/staff", icon: "fas fa-user-tie" },
      { label: "Staff Shifts", href: "/staff/shifts", icon: "fas fa-clock" },
      { label: "Leave / Off Days", href: "/staff/leave", icon: "fas fa-calendar-times" },
    ],
    roles: ["admin"],
  },
  {
    heading: "FINANCE",
    items: [
      { label: "Finance", href: "/finance", icon: "fas fa-money-bill-wave" },
      { label: "Expenses", href: "/finance/expenses", icon: "fas fa-wallet" },
      { label: "Refunds", href: "/finance/refunds", icon: "fas fa-undo" },
      { label: "Profit & Loss", href: "/finance/profit-loss", icon: "fas fa-chart-pie" },
      { label: "Utility Bills", href: "/finance/utilities", icon: "fas fa-bolt" },
      { label: "Wages", href: "/finance/wages", icon: "fas fa-money-check-alt" },
      { label: "Expense Categories", href: "/finance/expense-categories", icon: "fas fa-folder-open" },
    ],
    roles: ["admin"],
  },
  {
    heading: "BOOKINGS",
    items: [
      { label: "Manage Bookings", href: "/bookings", icon: "fas fa-clipboard-check" },
      { label: "New Booking", href: "/bookings/new", icon: "fas fa-calendar-plus" },
      { label: "Check-In", href: "/bookings/check-in", icon: "fas fa-sign-in-alt" },
      { label: "Check-Out", href: "/bookings/check-out", icon: "fas fa-sign-out-alt" },
    ],
    roles: ["admin"],
  },
  {
    heading: "REPORTS",
    items: [
      { label: "Reports Hub", href: "/reports", icon: "fas fa-chart-bar" },
      { label: "Detailed Reports", href: "/reports/detailed", icon: "fas fa-chart-line" },
    ],
    roles: ["admin"],
  },
  {
    heading: "SYSTEM",
    items: [
      { label: "Email Settings", href: "/settings/smtp", icon: "fas fa-envelope" },
      { label: "Database Backup", href: "/settings/backup", icon: "fas fa-database" },
      { label: "Activity Log", href: "/audit/activity-log", icon: "fas fa-history" },
    ],
    roles: ["admin"],
  },
  {
    heading: "ACCOUNT",
    items: [
      { label: "Profile", href: "/profile", icon: "fas fa-user-circle" },
      { label: "Logout", href: "/api/auth/logout", icon: "fas fa-sign-out-alt" },
    ],
    roles: ["admin", "reception", "storekeeper", "security"],
  },
];

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <nav
      id="sidebar"
      className="fixed top-0 left-0 w-[260px] h-screen text-white overflow-y-auto z-[1050]"
      style={{ background: "var(--sidebar-bg)" }}
    >
      <style>{`
        .sidebar-nav a:hover {
          color: white;
          background: rgba(255,255,255,0.08);
          border-left-color: var(--accent);
          padding-left: 28px;
        }
        .sidebar-nav a.sidebar-active {
          color: white;
          background: rgba(201,169,110,0.12);
          border-left-color: var(--accent);
          font-weight: 600;
        }
      `}</style>

      <div className="px-4 pt-5 pb-4 text-center border-b border-white/[0.08]">
        <img
          src="/don suits.jpeg"
          alt="Don Suites"
          className="w-[42px] h-[42px] rounded-full object-cover mx-auto mb-1.5"
          style={{ border: "2px solid rgba(201,169,110,0.4)" }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <div className="text-[13px] leading-tight tracking-[0.3px]">
          <div className="font-extrabold">DON SUITES</div>
          <small className="font-medium opacity-70 text-[10px]">
            &amp; Vacation Apartments
          </small>
          <br />
          <small className="font-normal opacity-50 text-[9px]">
            <i className="fas fa-phone text-[8px]" /> +256 741 44 5555
            <br />
            <i className="fas fa-envelope text-[8px]" /> donsuites26@gmail.com
          </small>
        </div>
      </div>

      <ul className="sidebar-nav list-none py-2">
        {navGroups.map((group, gi) => {
          const visibleItems = group.items.filter(
            (item) => !item.roles || item.roles.includes(role)
          );
          if (!group.roles.includes(role)) return null;
          if (visibleItems.length === 0) return null;

          return (
            <li key={gi}>
              {group.heading && (
                <li
                  key={`h-${gi}`}
                  className="px-6 pt-5 pb-1.5 text-[10.5px] uppercase text-white/30 tracking-[1.5px] font-bold"
                >
                  {group.heading}
                </li>
              )}
              {visibleItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center px-6 py-[11px] text-[13.5px] font-medium border-l-[3px] border-transparent transition-all duration-300 ${
                      isActive(item.href)
                        ? "sidebar-active text-white"
                        : "text-white/60"
                    }`}
                  >
                    <i
                      className={`w-[22px] mr-3 text-center text-[15px] ${
                        isActive(item.href) ? "opacity-100" : "opacity-80"
                      } ${item.icon}`}
                    />
                    {item.label}
                  </Link>
                </li>
              ))}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
