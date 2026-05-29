import { Shield, Lock, Server, Eye, AlertTriangle, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const measures = [
  {
    icon: <Lock className="w-5 h-5 text-accent" />,
    title: "Encryption at Rest & In Transit",
    description: "All data is encrypted using AES-256 at rest and TLS 1.3 in transit. Your documents and personal information are protected with industry-leading encryption standards at every stage.",
  },
  {
    icon: <Server className="w-5 h-5 text-accent" />,
    title: "Secure Infrastructure",
    description: "FineClause runs on enterprise-grade cloud infrastructure with SOC 2 Type II compliance, automatic backups, and geo-redundant storage across multiple availability zones in the EU.",
  },
  {
    icon: <Eye className="w-5 h-5 text-accent" />,
    title: "Access Control",
    description: "Strict role-based access controls ensure that only authorised personnel can access systems. All access is logged and audited. We follow the principle of least privilege.",
  },
  {
    icon: <Shield className="w-5 h-5 text-accent" />,
    title: "Document Privacy",
    description: "Your uploaded documents are processed solely for analysis and are never shared with third parties. We do not use your documents to train AI models. You can delete your documents at any time.",
  },
  {
    icon: <AlertTriangle className="w-5 h-5 text-accent" />,
    title: "Breach Notification",
    description: "In the unlikely event of a data breach, we will notify affected users and relevant regulatory authorities within 72 hours, in full compliance with GDPR requirements.",
  },
  {
    icon: <RefreshCw className="w-5 h-5 text-accent" />,
    title: "Regular Audits & Updates",
    description: "We conduct regular security audits, penetration testing, and vulnerability assessments. Our systems are continuously monitored and updated to address emerging threats.",
  },
];

const SecurityPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-3xl mx-auto animate-fade-up">
          <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-3">Trust & Security</p>
          <h1 className="text-3xl md:text-5xl font-black font-display leading-[1.1] tracking-tight mb-4">
            Your documents are <em className="italic text-accent">safe.</em>
          </h1>
          <p className="text-muted-foreground text-lg mb-12 max-w-lg leading-relaxed">
            Security is at the core of everything we build. FineClause is designed to protect your most sensitive legal documents with enterprise-grade security measures.
          </p>

          <div className="space-y-0 border border-border rounded-sm overflow-hidden mb-16">
            {measures.map((measure, idx) => (
              <div
                key={measure.title}
                className={`p-8 ${idx < measures.length - 1 ? "border-b border-border" : ""} hover:bg-cream transition-colors`}
              >
                <div className="flex items-start gap-5">
                  <div className="w-10 h-10 border border-border rounded-full bg-card flex items-center justify-center flex-shrink-0 mt-0.5">
                    {measure.icon}
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold mb-2">{measure.title}</h3>
                    <p className="text-muted-foreground text-[15px] leading-relaxed">{measure.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-sm bg-foreground text-primary-foreground p-8 mb-16">
            <h2 className="text-xl font-bold font-display mb-3">GDPR Compliance</h2>
            <p className="text-primary-foreground/70 text-[15px] leading-relaxed mb-4">
              FineClause is fully compliant with the General Data Protection Regulation (GDPR). As an EU-based company (Latvia), we adhere to the highest standards of data protection and privacy. You have full control over your data, including the right to access, rectify, delete, and export your personal information.
            </p>
            <Link to="/privacy" className="text-accent hover:underline text-sm font-medium">
              Read our full Privacy Policy →
            </Link>
          </div>

          <div className="border-t border-border pt-8">
            <h2 className="text-xl font-bold font-display mb-3">Report a Vulnerability</h2>
            <p className="text-muted-foreground text-[15px] leading-relaxed">
              If you discover a security vulnerability, please report it responsibly to{" "}
              <a href="mailto:security@empatixtech.com" className="text-accent hover:underline">security@empatixtech.com</a>.
              We take all reports seriously and will respond within 24 hours. We appreciate your help in keeping FineClause secure.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default SecurityPage;
