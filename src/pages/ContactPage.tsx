import { Helmet } from "react-helmet-async";
import { Mail, Phone, MapPin, MessageCircle, Send } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { isMobileApp } from "@/lib/isMobileApp";
import { useTranslation } from "react-i18next";
import { useState } from "react";

const ContactPage = () => {
  const { t } = useTranslation();
  const mobile = isMobileApp();
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [formStatus, setFormStatus] = useState<"idle" | "sending" | "sent">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus("sending");
    await new Promise((r) => setTimeout(r, 800));
    setFormStatus("sent");
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Contact Us — FineClause</title>
        <meta name="description" content="Get in touch with the FineClause team. We're based in Rīga, Latvia and happy to help with questions about our AI contract and career intelligence platform." />
      </Helmet>
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-3xl mx-auto animate-fade-up">
          <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-3">{t("contact.eyebrow")}</p>
          <h1 className="text-3xl md:text-5xl font-black font-display leading-[1.1] tracking-tight mb-4">
            {t("contact.title1")} <em className="italic text-accent">{t("contact.titleAccent")}</em>
          </h1>
          <p className="text-muted-foreground text-lg mb-12 max-w-lg leading-relaxed">
            {t("contact.subtitle")}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-border rounded-sm overflow-hidden mb-16">
            <div className="p-8 border-b md:border-b-0 md:border-r border-border">
              <div className="w-12 h-12 border border-border rounded-full bg-card flex items-center justify-center mb-5">
                <MapPin className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-display text-lg font-bold mb-2">{t("contact.addressTitle")}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Pērnavas iela 21–22<br />
                Rīga, LV-1009<br />
                Latvia
              </p>
            </div>

            <div className="p-8 border-b md:border-b-0 border-border">
              <div className="w-12 h-12 border border-border rounded-full bg-card flex items-center justify-center mb-5">
                <Phone className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-display text-lg font-bold mb-2">{t("contact.phoneTitle")}</h3>
              <p className="text-muted-foreground text-sm">
                <a href="tel:+37126761557" className="hover:text-foreground transition-colors">+371 2676 1557</a>
              </p>
            </div>

            <div className="p-8 border-b md:border-b-0 md:border-r border-border">
              <div className="w-12 h-12 border border-border rounded-full bg-card flex items-center justify-center mb-5">
                <Mail className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-display text-lg font-bold mb-2">{t("contact.emailTitle")}</h3>
              <p className="text-muted-foreground text-sm">
                <a href="mailto:support@fineclause.com" className="hover:text-foreground transition-colors">support@fineclause.com</a>
              </p>
            </div>

            <div className="p-8">
              <div className="w-12 h-12 border border-border rounded-full bg-card flex items-center justify-center mb-5">
                <MessageCircle className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-display text-lg font-bold mb-2">{t("contact.messengersTitle")}</h3>
              {mobile ? (
                <p className="text-sm text-muted-foreground">{t("contact.mobileContactHint")}</p>
              ) : (
                <div className="flex gap-4">
                  <a href="https://t.me/empatixtech" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Telegram</a>
                  <a href="https://wa.me/37126761557" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">WhatsApp</a>
                </div>
              )}
            </div>
          </div>

          {/* Contact form */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold font-display mb-6">Send us a message</h2>
            {formStatus === "sent" ? (
              <div className="rounded-2xl bg-card border border-border p-8 text-center">
                <Send className="w-10 h-10 text-accent mx-auto mb-3" />
                <h3 className="text-lg font-bold font-display mb-2">Message sent!</h3>
                <p className="text-muted-foreground text-sm">We'll get back to you at support@fineclause.com within 1 business day.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Your name"
                      className="w-full px-4 py-2.5 rounded-lg border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your@email.com"
                      className="w-full px-4 py-2.5 rounded-lg border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Subject</label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="How can we help?"
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Message</label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us more…"
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={formStatus === "sending"}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-colors disabled:opacity-60"
                >
                  <Send className="w-4 h-4" />
                  {formStatus === "sending" ? "Sending…" : "Send message"}
                </button>
              </form>
            )}
          </div>

          <div className="border-t border-border pt-8 mt-8">
            <p className="text-sm text-muted-foreground font-mono">
              {t("contact.footerNotePrefix")}{" "}
              <span className="text-foreground font-medium">Empatixtech</span>
              , Pērnavas iela 21–22, Rīga, LV-1009, Latvia.
            </p>
          </div>
        </div>
      </div>

      {/* Footer hidden on mobile — tab bar handles navigation (Guideline 4.2) */}
      {!mobile && <Footer />}
    </div>
  );
};

export default ContactPage;
