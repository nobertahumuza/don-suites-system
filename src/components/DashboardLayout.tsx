import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
  role: string;
  children: React.ReactNode;
}

export default function DashboardLayout({ role, children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar role={role} />
      <div
        className="ml-[260px] flex-1 flex flex-col min-h-screen overflow-x-hidden relative z-[1]"
        style={{ animation: "fadeIn 0.4s ease" }}
      >
        <div className="p-7 pt-0 flex-1">{children}</div>
        <footer
          className="no-print text-center py-4 px-5 text-[13px] mt-auto border-t-2 border-[var(--accent)]"
          style={{ background: "linear-gradient(135deg, #080e22, #0f1a3c)", color: "rgba(255,255,255,0.7)" }}
        >
          <p className="m-0 font-bold italic">
            Designed by Nobtech World. For assistance contact +256 760399849
          </p>
        </footer>
      </div>
    </div>
  );
}
