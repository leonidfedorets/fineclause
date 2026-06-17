import { Link, useLocation, useNavigate } from "react-router-dom";
import { FileSearch, LayoutDashboard, FileText, Info } from "lucide-react";

const tabs = [
  { to: "/scan",      icon: FileSearch,      label: "Scan" },
  { to: "/dashboard", icon: LayoutDashboard, label: "My Scans" },
  { to: "/careers",   icon: FileText,        label: "CV Check" },
  { to: "/contact",   icon: Info,            label: "More" },
];

const fireHaptic = async () => {
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch { /* non-fatal */ }
};

const MobileTabBar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
        boxShadow: "0 -1px 0 hsl(var(--border))",
      }}
    >
      <div className="flex items-stretch h-16">
        {tabs.map(({ to, icon: Icon, label }) => {
          const active = pathname === to || (to !== "/" && pathname.startsWith(to));
          return (
            <button
              key={to}
              onClick={() => { fireHaptic(); navigate(to); }}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors"
              style={{ WebkitTapHighlightColor: "transparent", background: "none", border: "none" }}
            >
              <Icon
                className="w-6 h-6 transition-colors"
                style={{ color: active ? "hsl(var(--accent))" : "hsl(var(--muted-foreground))" }}
                strokeWidth={active ? 2.5 : 1.75}
              />
              <span
                className="text-[10px] font-medium tracking-wide transition-colors"
                style={{ color: active ? "hsl(var(--accent))" : "hsl(var(--muted-foreground))" }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileTabBar;
