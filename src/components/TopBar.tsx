interface TopBarProps {
  title: string;
  icon?: string;
  children?: React.ReactNode;
}

export default function TopBar({ title, icon, children }: TopBarProps) {
  return (
    <div
      className="sticky top-0 z-[1060] px-8 py-4 flex items-center justify-between border-b border-white/10"
      style={{ background: "linear-gradient(135deg, #0f1a3c, #1a2d5a)" }}
    >
      <h4 className="m-0 text-white font-bold text-lg tracking-tight flex items-center gap-3">
        {icon && <i className={`${icon} text-[var(--accent)]`} />}
        {title}
      </h4>
      <div className="flex items-center gap-4">
        {children}
        <span className="text-white/80 text-sm font-medium">
          <i className="fas fa-user-circle mr-2" />
        </span>
      </div>
    </div>
  );
}
