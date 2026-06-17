import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { isMobileApp } from "@/lib/isMobileApp";

const ContactPage = () => {
  const mobile = isMobileApp();
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-3xl mx-auto animate-fade-up">
          <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-3">Get in Touch</p>
          <h1 className="text-3xl md:text-5xl font-black font-display leading-[1.1] tracking-tight mb-4">
            Contact <em className="italic text-accent">Us</em>
          </h1>
          <p className="text-muted-foreground text-lg mb-12 max-w-lg leading-relaxed">
            We're always happy to help you with any questions about FineClause. Reach out and we'll respond promptly.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-border rounded-sm overflow-hidden mb-16">
            <div className="p-8 border-b md:border-b-0 md:border-r border-border">
              <div className="w-12 h-12 border border-border rounded-full bg-card flex items-center justify-center mb-5">
                <MapPin className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-display text-lg font-bold mb-2">Address</h3>
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
              <h3 className="font-display text-lg font-bold mb-2">Phone</h3>
              <p className="text-muted-foreground text-sm">
                <a href="tel:+37126761557" className="hover:text-foreground transition-colors">+371 2676 1557</a>
              </p>
            </div>

            <div className="p-8 border-b md:border-b-0 md:border-r border-border">
              <div className="w-12 h-12 border border-border rounded-full bg-card flex items-center justify-center mb-5">
                <Mail className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-display text-lg font-bold mb-2">Email</h3>
              <p className="text-muted-foreground text-sm">
                <a href="mailto:sales@empatixtech.com" className="hover:text-foreground transition-colors">sales@empatixtech.com</a>
              </p>
            </div>

            <div className="p-8">
              <div className="w-12 h-12 border border-border rounded-full bg-card flex items-center justify-center mb-5">
                <MessageCircle className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-display text-lg font-bold mb-2">Messengers</h3>
              {mobile ? (
                <p className="text-sm text-muted-foreground">Email or call us directly.</p>
              ) : (
                <div className="flex gap-4">
                  <a href="https://t.me/empatixtech" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Telegram</a>
                  <a href="https://wa.me/37126761557" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">WhatsApp</a>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-border pt-8">
            <p className="text-sm text-muted-foreground font-mono">
              FineClause is developed and operated by{" "}
              <span className="text-foreground font-medium">Empatixtech</span>
              , Pērnavas iela 21–22, Rīga, LV-1009, Latvia.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ContactPage;
