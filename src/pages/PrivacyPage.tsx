import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16">
        <article className="max-w-3xl mx-auto animate-fade-up prose-custom">
          <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-3">Legal</p>
          <h1 className="text-3xl md:text-5xl font-black font-display leading-[1.1] tracking-tight mb-2">
            Privacy <em className="italic text-accent">Policy</em>
          </h1>
          <p className="text-sm text-muted-foreground mb-12">Last updated: February 21, 2026</p>

          <div className="space-y-10 text-[15px] leading-relaxed text-foreground/85">
            <section>
              <p>
                FineClause (developed by Empatixtech, registered at Pērnavas iela 21–22, Rīga, LV-1009, Latvia) created this Privacy Policy in accordance with our commitment to protect your privacy on FineClause websites, applications, and in all marketing initiatives.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold font-display mb-3">Consent</h2>
              <p>
                By using FineClause, you consent to the collection, use, and sharing of your information as described in this Privacy Policy. If you do not agree with the terms of this Privacy Policy, please do not use FineClause websites or services. If you wish to stop receiving marketing communications, click the unsubscribe link included in our messages.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold font-display mb-3">Information We Collect</h2>
              <p className="mb-3">FineClause collects information to provide, improve, and secure our services. We collect information in the following ways:</p>
              <ul className="list-none space-y-2">
                <li className="flex items-start gap-2.5 border-b border-border pb-2"><span className="text-accent font-bold text-xs mt-1">•</span><span><strong>Account information:</strong> When you create an account, we collect your email address, name, and password.</span></li>
                <li className="flex items-start gap-2.5 border-b border-border pb-2"><span className="text-accent font-bold text-xs mt-1">•</span><span><strong>Document data:</strong> When you upload documents for analysis, we process the text content to provide risk analysis. Documents are encrypted at rest and in transit.</span></li>
                <li className="flex items-start gap-2.5 border-b border-border pb-2"><span className="text-accent font-bold text-xs mt-1">•</span><span><strong>Usage data:</strong> We collect information about how you interact with FineClause, including pages visited, features used, and time spent on the platform.</span></li>
                <li className="flex items-start gap-2.5 border-b border-border pb-2"><span className="text-accent font-bold text-xs mt-1">•</span><span><strong>Device information:</strong> Browser type, operating system, IP address, and device identifiers for security and analytics purposes.</span></li>
                <li className="flex items-start gap-2.5"><span className="text-accent font-bold text-xs mt-1">•</span><span><strong>Payment information:</strong> Billing details are collected and processed by our payment provider (Stripe) and are never stored on our servers.</span></li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold font-display mb-3">Information Sharing</h2>
              <p className="mb-3">FineClause may share your personal information with:</p>
              <ul className="list-none space-y-2">
                <li className="flex items-start gap-2.5 border-b border-border pb-2"><span className="text-accent font-bold text-xs mt-1">•</span><span><strong>Service providers:</strong> Third-party companies that help us operate, including cloud hosting, payment processing, and analytics services.</span></li>
                <li className="flex items-start gap-2.5 border-b border-border pb-2"><span className="text-accent font-bold text-xs mt-1">•</span><span><strong>Legal requirements:</strong> When required by law, regulation, or legal process.</span></li>
                <li className="flex items-start gap-2.5"><span className="text-accent font-bold text-xs mt-1">•</span><span><strong>Business transfers:</strong> In connection with a merger, acquisition, or sale of assets.</span></li>
              </ul>
              <p className="mt-3">We <strong>never</strong> sell your personal information to third parties. We <strong>never</strong> use your uploaded documents to train AI models.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold font-display mb-3">Legal Basis for Processing</h2>
              <p className="mb-3">For individuals protected by EU data protection law (GDPR), FineClause processes information based on:</p>
              <ul className="list-none space-y-2">
                <li className="flex items-start gap-2.5 border-b border-border pb-2"><span className="text-accent font-bold text-xs mt-1">•</span><span><strong>Contractual necessity:</strong> Processing required to fulfil our contract with you (e.g., providing document analysis).</span></li>
                <li className="flex items-start gap-2.5 border-b border-border pb-2"><span className="text-accent font-bold text-xs mt-1">•</span><span><strong>Legitimate interest:</strong> Processing for our legitimate business interests (e.g., improving our services, preventing fraud).</span></li>
                <li className="flex items-start gap-2.5"><span className="text-accent font-bold text-xs mt-1">•</span><span><strong>Consent:</strong> Processing based on your explicit consent (e.g., marketing communications).</span></li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold font-display mb-3">International Transfers</h2>
              <p>
                FineClause may process information on servers outside your country of residence. Such transfers are protected by appropriate safeguards, including the use of European Commission Standard Contractual Clauses (SCCs), ensuring your data receives adequate protection regardless of where it is processed.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold font-display mb-3">Data Retention</h2>
              <p>
                We retain your personal data only for as long as necessary to fulfil the purposes for which it was collected, including to satisfy legal, accounting, or reporting requirements. Uploaded documents are retained in your account history until you delete them. When you delete your account, all associated data is permanently removed within 30 days.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold font-display mb-3">Information Security</h2>
              <p>
                FineClause stores personal information securely using industry-standard encryption (AES-256 at rest, TLS 1.3 in transit). Access is restricted to authorized personnel only. In case of a data breach, affected individuals and relevant regulators will be notified within 72 hours in accordance with GDPR requirements.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold font-display mb-3">Your Rights</h2>
              <p className="mb-3">Under EU data protection law, you have the right to:</p>
              <ul className="list-none space-y-2">
                <li className="flex items-start gap-2.5 border-b border-border pb-2"><span className="text-accent font-bold text-xs mt-1">•</span><span><strong>Access</strong> your personal data and receive a copy of it.</span></li>
                <li className="flex items-start gap-2.5 border-b border-border pb-2"><span className="text-accent font-bold text-xs mt-1">•</span><span><strong>Rectify</strong> inaccurate or incomplete personal data.</span></li>
                <li className="flex items-start gap-2.5 border-b border-border pb-2"><span className="text-accent font-bold text-xs mt-1">•</span><span><strong>Erase</strong> your personal data ("right to be forgotten").</span></li>
                <li className="flex items-start gap-2.5 border-b border-border pb-2"><span className="text-accent font-bold text-xs mt-1">•</span><span><strong>Restrict</strong> processing of your personal data.</span></li>
                <li className="flex items-start gap-2.5 border-b border-border pb-2"><span className="text-accent font-bold text-xs mt-1">•</span><span><strong>Port</strong> your data to another service provider.</span></li>
                <li className="flex items-start gap-2.5"><span className="text-accent font-bold text-xs mt-1">•</span><span><strong>Object</strong> to processing of your personal data.</span></li>
              </ul>
              <p className="mt-3">To exercise any of these rights, please contact us at <a href="mailto:privacy@empatixtech.com" className="text-accent hover:underline">privacy@empatixtech.com</a>.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold font-display mb-3">Cookies</h2>
              <p>
                FineClause uses essential cookies required for the service to function (authentication, session management). We use analytics cookies only with your consent to understand how you use our service and improve it. You can manage cookie preferences through your browser settings.
              </p>
            </section>

            <section className="border-t border-border pt-8">
              <h2 className="text-xl font-bold font-display mb-3">Contact</h2>
              <p className="text-muted-foreground">
                <strong className="text-foreground">Empatixtech</strong><br />
                Pērnavas iela 21–22, Rīga, LV-1009, Latvia<br />
                Phone: <a href="tel:+37126761557" className="text-accent hover:underline">+371 2676 1557</a><br />
                Email: <a href="mailto:privacy@empatixtech.com" className="text-accent hover:underline">privacy@empatixtech.com</a>
              </p>
            </section>
          </div>
        </article>
      </div>

      <Footer />
    </div>
  );
};

export default PrivacyPage;
