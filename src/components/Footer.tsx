import { Link } from "react-router-dom";
import { Mail, MessageCircle, Scale, ArrowUpRight } from "lucide-react";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();

  const sections = [
    {
      title: "Product",
      links: [
        { label: "Contract Scanner", to: "/scan" },
        { label: "Templates", to: "/templates" },
        { label: "Analytics", to: "/dashboard" },
        { label: "Invoices", to: "/invoices" },
      ],
    },
    {
      title: "Career",
      links: [
        { label: "CV Analysis", to: "/careers" },
        { label: "Job Matching", to: "/careers" },
        { label: "For Employers", to: "/employers" },
        { label: "Recruiter Dashboard", to: "/recruiter" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: t("footer.privacy"), to: "/privacy" },
        { label: t("footer.terms"), to: "/terms" },
        { label: t("footer.cookies"), to: "/cookies" },
        { label: t("footer.security"), to: "/security" },
        { label: t("footer.contact"), to: "/contact" },
      ],
    },
  ];

  return (
    <footer className="border-t border-border bg-card">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        {/* Main footer grid */}
        <div className="py-14 grid grid-cols-2 md:grid-cols-4 gap-10">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4 group w-fit">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shadow-[0_2px_8px_hsl(221_83%_53%/0.3)]">
                <Scale className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-semibold text-base tracking-tight text-foreground group-hover:text-accent transition-colors">
                FineClause
              </span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed mb-5 max-w-[200px]">
              AI-powered legal and contract intelligence for modern businesses.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-2">
              <a
                href="mailto:sales@empatixtech.com"
                aria-label="Email"
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/20 hover:bg-muted/50 transition-all"
              >
                <Mail className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://t.me/empatixtech"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Telegram"
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/20 hover:bg-muted/50 transition-all"
              >
                <MessageCircle className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://wa.me/37126761557"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/20 hover:bg-muted/50 transition-all"
              >
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.025.506 3.934 1.395 5.608L.055 23.583a.5.5 0 00.612.612l5.975-1.34A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.94 9.94 0 01-5.39-1.583l-.387-.232-3.546.796.796-3.546-.232-.387A9.94 9.94 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Link sections */}
          {sections.map((section) => (
            <div key={section.title}>
              <h4 className="text-xs font-semibold tracking-widest uppercase text-foreground/50 mb-4">
                {section.title}
              </h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.to + link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="py-5 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            © 2026 FineClause · All rights reserved
          </span>
          <div className="flex items-center gap-4">
            <a
              href="https://fineclause.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              fineclause.com <ArrowUpRight className="w-3 h-3" />
            </a>
            <span className="text-xs text-muted-foreground/40">·</span>
            <span className="text-xs text-muted-foreground">Built with AI · Trusted by legal teams</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
