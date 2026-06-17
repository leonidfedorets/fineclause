import { Link, useLocation } from "react-router-dom";
import { FileSearch, LayoutDashboard, FileText, Info } from "lucide-react";
import { useState } from "react";

const tabs = [
  { to: "/scan",      icon: FileSearch,      label: "Scan" },
  { to: "/dashboard", icon: LayoutDashboard, label: "My Scans" },
  { to: "/careers",   icon: FileText,        label: "CV Check" },
  { to: "/contact",   icon: Info,            label: "More" },
];

const MobileTabBar = () => {
  const { pathname } = useLocation();

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
            <Link
              key={to}
              to={to}
              className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors"
              style={{ WebkitTapHighlightColor: "transparent" }}
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
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileTabBar;
