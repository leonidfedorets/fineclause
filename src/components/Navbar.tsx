import { useState, useRef, useEffect } from "react";
import { LogOut, Menu, ShieldCheck, X, ChevronDown, FileSearch, Briefcase, FileText } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import logo from "@/assets/fineclause-logo.png";
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
        className={`flex items-center gap-1.5 text-sm tracking-wide transition-colors ${
          active ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {icon}
        {label}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 min-w-[180px] bg-popover border border-border rounded-md shadow-lg py-1 z-50">
          {children}
        </div>
      )}
    </div>
  );
};

const DropdownLink = ({ to, onClick, children }: { to: string; onClick: () => void; children: React.ReactNode }) => (
  <Link
    to={to}
    onClick={onClick}
    className="block px-4 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
  >
    {children}
  </Link>
);

const Navbar = () => {
  const { user, isAdmin, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useTranslation();
  const location = useLocation();

  const close = () => setMobileOpen(false);

  const docScanPaths = ["/scan", "/templates", "/dashboard"];
  const careerPaths = ["/careers", "/recruiter"];
  const businessPaths = ["/invoices", "/expenses", "/carbon", "/tax"];
  const isDocScanActive = docScanPaths.some((p) => location.pathname.startsWith(p));
  const isCareerActive = careerPaths.some((p) => location.pathname.startsWith(p));
  const isBusinessActive = businessPaths.some((p) => location.pathname.startsWith(p));

  const desktopNav = user ? (
    <>
      <NavDropdown
        label={t("nav.groupDocScan")}
        icon={<FileSearch className="w-3.5 h-3.5" />}
        active={isDocScanActive}
      >
        <DropdownLink to="/scan" onClick={close}>{t("nav.scan")}</DropdownLink>
        <DropdownLink to="/templates" onClick={close}>{t("nav.templates")}</DropdownLink>
        <DropdownLink to="/dashboard" onClick={close}>{t("nav.scansAnalytics")}</DropdownLink>
      </NavDropdown>

      <NavDropdown
        label={t("nav.groupCareer")}
        icon={<Briefcase className="w-3.5 h-3.5" />}
        active={isCareerActive}
      >
        <DropdownLink to="/careers" onClick={close}>{t("nav.careers")}</DropdownLink>
        <DropdownLink to="/recruiter" onClick={close}>{t("nav.recruiterDashboard")}</DropdownLink>
      </NavDropdown>

      <NavDropdown
        label={t("nav.groupBusiness")}
        icon={<FileText className="w-3.5 h-3.5" />}
        active={isBusinessActive}
      >
        <DropdownLink to="/invoices" onClick={close}>{t("nav.invoices")}</DropdownLink>
        <DropdownLink to="/expenses" onClick={close}>{t("nav.expenses")}</DropdownLink>
        <DropdownLink to="/carbon" onClick={close}>{t("nav.carbon")}</DropdownLink>
        <DropdownLink to="/tax" onClick={close}>{t("nav.tax")}</DropdownLink>
      </NavDropdown>

      {isAdmin && (
        <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors tracking-wide flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          {t("nav.admin")}
        </Link>
      )}
      <button
        onClick={() => { signOut(); close(); }}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 tracking-wide"
      >
        <LogOut className="w-3.5 h-3.5" />
        {t("nav.signOut")}
      </button>
    </>
  ) : (
    <>
      <NavDropdown
        label={t("nav.groupDocScan")}
        icon={<FileSearch className="w-3.5 h-3.5" />}
        active={location.pathname === "/scan"}
      >
        <DropdownLink to="/scan" onClick={close}>{t("nav.scan")}</DropdownLink>
      </NavDropdown>

      <NavDropdown
        label={t("nav.groupCareer")}
        icon={<Briefcase className="w-3.5 h-3.5" />}
        active={location.pathname === "/careers"}
      >
        <DropdownLink to="/careers" onClick={close}>{t("nav.careers")}</DropdownLink>
      </NavDropdown>

      <NavDropdown
        label={t("nav.groupBusiness")}
        icon={<FileText className="w-3.5 h-3.5" />}
        active={location.pathname === "/invoices"}
      >
        <DropdownLink to="/invoices" onClick={close}>{t("nav.invoices")}</DropdownLink>
        <DropdownLink to="/expenses" onClick={close}>{t("nav.expenses")}</DropdownLink>
        <DropdownLink to="/carbon" onClick={close}>{t("nav.carbon")}</DropdownLink>
        <DropdownLink to="/tax" onClick={close}>{t("nav.tax")}</DropdownLink>
      </NavDropdown>

      <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors tracking-wide">
        {t("nav.pricing")}
      </a>
      <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors tracking-wide">
        {t("nav.signIn")}
      </Link>
      <Link
        to="/signup"
        className="text-sm font-medium bg-foreground text-background px-5 py-2.5 rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors tracking-wide"
      >
        {t("nav.tryFree")}
      </Link>
    </>
  );

  // Mobile nav uses expandable sections
  const mobileNav = user ? (
    <>
      <MobileSection label={t("nav.groupDocScan")} icon={<FileSearch className="w-3.5 h-3.5" />}>
        <Link to="/scan" className="block py-1.5 pl-7 text-sm text-muted-foreground hover:text-foreground" onClick={close}>{t("nav.scan")}</Link>
        <Link to="/templates" className="block py-1.5 pl-7 text-sm text-muted-foreground hover:text-foreground" onClick={close}>{t("nav.templates")}</Link>
        <Link to="/dashboard" className="block py-1.5 pl-7 text-sm text-muted-foreground hover:text-foreground" onClick={close}>{t("nav.scansAnalytics")}</Link>
      </MobileSection>

      <MobileSection label={t("nav.groupCareer")} icon={<Briefcase className="w-3.5 h-3.5" />}>
        <Link to="/careers" className="block py-1.5 pl-7 text-sm text-muted-foreground hover:text-foreground" onClick={close}>{t("nav.careers")}</Link>
        <Link to="/recruiter" className="block py-1.5 pl-7 text-sm text-muted-foreground hover:text-foreground" onClick={close}>{t("nav.recruiterDashboard")}</Link>
      </MobileSection>

      <MobileSection label={t("nav.groupBusiness")} icon={<FileText className="w-3.5 h-3.5" />}>
        <Link to="/invoices" className="block py-1.5 pl-7 text-sm text-muted-foreground hover:text-foreground" onClick={close}>{t("nav.invoices")}</Link>
        <Link to="/expenses" className="block py-1.5 pl-7 text-sm text-muted-foreground hover:text-foreground" onClick={close}>{t("nav.expenses")}</Link>
        <Link to="/carbon" className="block py-1.5 pl-7 text-sm text-muted-foreground hover:text-foreground" onClick={close}>{t("nav.carbon")}</Link>
        <Link to="/tax" className="block py-1.5 pl-7 text-sm text-muted-foreground hover:text-foreground" onClick={close}>{t("nav.tax")}</Link>
      </MobileSection>

      {isAdmin && (
        <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors tracking-wide flex items-center gap-1" onClick={close}>
          <ShieldCheck className="w-3.5 h-3.5" />
          {t("nav.admin")}
        </Link>
      )}
      <button
        onClick={() => { signOut(); close(); }}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 tracking-wide"
      >
        <LogOut className="w-3.5 h-3.5" />
        {t("nav.signOut")}
      </button>
    </>
  ) : (
    <>
      <MobileSection label={t("nav.groupDocScan")} icon={<FileSearch className="w-3.5 h-3.5" />}>
        <Link to="/scan" className="block py-1.5 pl-7 text-sm text-muted-foreground hover:text-foreground" onClick={close}>{t("nav.scan")}</Link>
      </MobileSection>

      <MobileSection label={t("nav.groupCareer")} icon={<Briefcase className="w-3.5 h-3.5" />}>
        <Link to="/careers" className="block py-1.5 pl-7 text-sm text-muted-foreground hover:text-foreground" onClick={close}>{t("nav.careers")}</Link>
      </MobileSection>

      <MobileSection label={t("nav.groupBusiness")} icon={<FileText className="w-3.5 h-3.5" />}>
        <Link to="/invoices" className="block py-1.5 pl-7 text-sm text-muted-foreground hover:text-foreground" onClick={close}>{t("nav.invoices")}</Link>
        <Link to="/expenses" className="block py-1.5 pl-7 text-sm text-muted-foreground hover:text-foreground" onClick={close}>{t("nav.expenses")}</Link>
        <Link to="/carbon" className="block py-1.5 pl-7 text-sm text-muted-foreground hover:text-foreground" onClick={close}>{t("nav.carbon")}</Link>
        <Link to="/tax" className="block py-1.5 pl-7 text-sm text-muted-foreground hover:text-foreground" onClick={close}>{t("nav.tax")}</Link>
      </MobileSection>

      <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors tracking-wide" onClick={close}>
        {t("nav.pricing")}
      </a>
      <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors tracking-wide" onClick={close}>
        {t("nav.signIn")}
      </Link>
      <Link
        to="/signup"
        className="text-sm font-medium bg-foreground text-background px-5 py-2.5 rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors tracking-wide inline-block text-center"
        onClick={close}
      >
        {t("nav.tryFree")}
      </Link>
    </>
  );

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/92 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="FineClause" className="h-9" />
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
          {desktopNav}
          <LanguageSwitcher />
          <ThemeToggle />
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-background/98 backdrop-blur-md border-t border-border px-4 pb-4 pt-2 flex flex-col gap-3">
          {mobileNav}
          <div className="flex items-center gap-4 text-sm text-muted-foreground border-t border-border pt-3 mt-1">
            <LanguageSwitcher />
            <ThemeToggle />
            <span className="tracking-wide">{t("nav.theme")}</span>
          </div>
        </div>
      )}
    </nav>
  );
};

const MobileSection = ({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground tracking-wide w-full"
      >
        {icon}
        {label}
        <ChevronDown className={`w-3 h-3 ml-auto transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="mt-1 space-y-0.5">{children}</div>}
    </div>
  );
};

export default Navbar;
