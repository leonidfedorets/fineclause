import { useState, useRef, useEffect } from "react";
import { LogOut, Menu, ShieldCheck, X, ChevronDown, FileSearch, Briefcase, FileText, Scale } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";

interface NavDropdownProps {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
}

const NavDropdown = ({ label, icon, children, active }: NavDropdownProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 text-sm font-medium transition-colors px-1 py-1 rounded-md ${
          active
            ? "text-accent"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {icon}
        {label}
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 min-w-[200px] bg-card border border-border rounded-xl shadow-[0_8px_32px_hsl(222_47%_11%/0.12)] py-1.5 z-50 animate-fade-up"
          style={{ animationDuration: "0.15s" }}>
          {children}
        </div>
      )}
    </div>
  );
};

const DropdownLink = ({ to, onClick, icon, children }: { to: string; onClick: () => void; icon?: React.ReactNode; children: React.ReactNode }) => (
  <Link
    to={to}
    onClick={onClick}
    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground/70 hover:text-foreground hover:bg-muted/60 transition-colors mx-1 rounded-lg"
  >
    {icon && <span className="text-muted-foreground">{icon}</span>}
    {children}
  </Link>
);

const Navbar = () => {
  const { user, isAdmin, signOut, isMobile } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useTranslation();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const close = () => setMobileOpen(false);

  const docScanPaths = ["/scan", "/templates", "/dashboard"];
  const careerPaths = ["/careers", "/recruiter"];
  const businessPaths = ["/invoices", "/expenses", "/carbon", "/tax"];
  const isDocScanActive = docScanPaths.some((p) => location.pathname.startsWith(p));
  const isCareerActive = careerPaths.some((p) => location.pathname.startsWith(p));
  const isBusinessActive = businessPaths.some((p) => location.pathname.startsWith(p));

  const desktopNav = user ? (
    <>
      <NavDropdown label={t("nav.groupDocScan")} icon={<FileSearch className="w-3.5 h-3.5" />} active={isDocScanActive}>
        <DropdownLink to="/scan" onClick={close} icon={<FileSearch className="w-3.5 h-3.5" />}>{t("nav.scan")}</DropdownLink>
        <DropdownLink to="/templates" onClick={close} icon={<FileText className="w-3.5 h-3.5" />}>{t("nav.templates")}</DropdownLink>
        <DropdownLink to="/dashboard" onClick={close} icon={<Scale className="w-3.5 h-3.5" />}>{t("nav.scansAnalytics")}</DropdownLink>
      </NavDropdown>

      <NavDropdown label={t("nav.groupCareer")} icon={<Briefcase className="w-3.5 h-3.5" />} active={isCareerActive}>
        <DropdownLink to="/careers" onClick={close} icon={<Briefcase className="w-3.5 h-3.5" />}>{t("nav.careers")}</DropdownLink>
        <DropdownLink to="/recruiter" onClick={close} icon={<FileSearch className="w-3.5 h-3.5" />}>{t("nav.recruiterDashboard")}</DropdownLink>
      </NavDropdown>

      <NavDropdown label={t("nav.groupBusiness")} icon={<FileText className="w-3.5 h-3.5" />} active={isBusinessActive}>
        <DropdownLink to="/invoices" onClick={close}>{t("nav.invoices")}</DropdownLink>
        <DropdownLink to="/expenses" onClick={close}>{t("nav.expenses")}</DropdownLink>
        <DropdownLink to="/carbon" onClick={close}>{t("nav.carbon")}</DropdownLink>
        <DropdownLink to="/tax" onClick={close}>{t("nav.tax")}</DropdownLink>
      </NavDropdown>

      {isAdmin && (
        <Link to="/admin" className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ShieldCheck className="w-3.5 h-3.5" />
          {t("nav.admin")}
        </Link>
      )}
      <button
        onClick={() => { signOut(); close(); }}
        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <LogOut className="w-3.5 h-3.5" />
        {t("nav.signOut")}
      </button>
    </>
  ) : (
    <>
      <NavDropdown label={t("nav.groupDocScan")} icon={<FileSearch className="w-3.5 h-3.5" />} active={location.pathname === "/scan"}>
        <DropdownLink to="/scan" onClick={close}>{t("nav.scan")}</DropdownLink>
      </NavDropdown>
      <NavDropdown label={t("nav.groupCareer")} icon={<Briefcase className="w-3.5 h-3.5" />} active={location.pathname === "/careers"}>
        <DropdownLink to="/careers" onClick={close}>{t("nav.careers")}</DropdownLink>
      </NavDropdown>
      <NavDropdown label={t("nav.groupBusiness")} icon={<FileText className="w-3.5 h-3.5" />} active={businessPaths.some(p => location.pathname.startsWith(p))}>
        <DropdownLink to="/invoices" onClick={close}>{t("nav.invoices")}</DropdownLink>
        <DropdownLink to="/expenses" onClick={close}>{t("nav.expenses")}</DropdownLink>
        <DropdownLink to="/carbon" onClick={close}>{t("nav.carbon")}</DropdownLink>
        <DropdownLink to="/tax" onClick={close}>{t("nav.tax")}</DropdownLink>
      </NavDropdown>
      {!isMobile && (
        <a href="/#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          {t("nav.pricing")}
        </a>
      )}
      <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
        {t("nav.signIn")}
      </Link>
      {/* Hide "Try Free" on mobile — user already has the app */}
      {!isMobile && (
        <Link
          to="/signup"
          className="text-sm font-semibold bg-accent text-accent-foreground px-5 py-2 rounded-lg hover:bg-accent/90 transition-all hover:shadow-[0_4px_16px_hsl(221_83%_53%/0.35)] active:scale-[0.98]"
        >
          {t("nav.tryFree")}
        </Link>
      )}
    </>
  );

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled
        ? "bg-card/90 backdrop-blur-xl border-b border-border shadow-[0_1px_0_hsl(var(--border))]"
        : "bg-background/80 backdrop-blur-md border-b border-transparent"
    }`}>
      <div className="container mx-auto px-6 h-16 flex items-center justify-between max-w-7xl">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shadow-[0_2px_8px_hsl(221_83%_53%/0.3)]">
            <span className="text-white font-display font-bold text-base leading-none">F</span>
          </div>
          <span className="font-display font-semibold text-lg tracking-tight text-foreground group-hover:text-accent transition-colors">
            FineClause
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
          {desktopNav}
          <div className="flex items-center gap-2 pl-2 border-l border-border">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-foreground hover:bg-muted transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-card border-t border-border px-6 pb-6 pt-4 flex flex-col gap-1 animate-fade-up" style={{ animationDuration: "0.2s" }}>
          <MobileSection label={t("nav.groupDocScan")} icon={<FileSearch className="w-4 h-4" />}>
            <Link to="/scan" className="block py-2 pl-8 text-sm text-muted-foreground hover:text-foreground" onClick={close}>{t("nav.scan")}</Link>
            <Link to="/templates" className="block py-2 pl-8 text-sm text-muted-foreground hover:text-foreground" onClick={close}>{t("nav.templates")}</Link>
            <Link to="/dashboard" className="block py-2 pl-8 text-sm text-muted-foreground hover:text-foreground" onClick={close}>{t("nav.scansAnalytics")}</Link>
          </MobileSection>
          <MobileSection label={t("nav.groupCareer")} icon={<Briefcase className="w-4 h-4" />}>
            <Link to="/careers" className="block py-2 pl-8 text-sm text-muted-foreground hover:text-foreground" onClick={close}>{t("nav.careers")}</Link>
            <Link to="/recruiter" className="block py-2 pl-8 text-sm text-muted-foreground hover:text-foreground" onClick={close}>{t("nav.recruiterDashboard")}</Link>
          </MobileSection>
          <MobileSection label={t("nav.groupBusiness")} icon={<FileText className="w-4 h-4" />}>
            <Link to="/invoices" className="block py-2 pl-8 text-sm text-muted-foreground hover:text-foreground" onClick={close}>{t("nav.invoices")}</Link>
            <Link to="/expenses" className="block py-2 pl-8 text-sm text-muted-foreground hover:text-foreground" onClick={close}>{t("nav.expenses")}</Link>
            <Link to="/carbon" className="block py-2 pl-8 text-sm text-muted-foreground hover:text-foreground" onClick={close}>{t("nav.carbon")}</Link>
            <Link to="/tax" className="block py-2 pl-8 text-sm text-muted-foreground hover:text-foreground" onClick={close}>{t("nav.tax")}</Link>
          </MobileSection>
          {!user && (
            <div className="flex flex-col gap-2 pt-4 border-t border-border mt-2">
              <Link to="/login" className="text-sm font-medium text-center py-2.5 rounded-lg border border-border text-foreground hover:bg-muted transition-colors" onClick={close}>{t("nav.signIn")}</Link>
              <Link to="/signup" className="text-sm font-semibold text-center py-2.5 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 transition-colors" onClick={close}>{t("nav.tryFree")}</Link>
            </div>
          )}
          <div className="flex items-center gap-3 pt-4 border-t border-border mt-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      )}
    </nav>
  );
};

const MobileSection = ({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/50 pb-1">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full py-2.5 text-sm font-medium text-foreground/80 hover:text-foreground"
      >
        <span className="text-accent">{icon}</span>
        {label}
        <ChevronDown className={`w-3.5 h-3.5 ml-auto transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="mb-1 space-y-0.5">{children}</div>}
    </div>
  );
};

export default Navbar;
