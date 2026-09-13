'use client';

export default function SidebarToggle() {
  return (
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
  );
}
