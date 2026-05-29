import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16">
        <article className="max-w-3xl mx-auto animate-fade-up">
          <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-3">Legal</p>
          <h1 className="text-3xl md:text-5xl font-black font-display leading-[1.1] tracking-tight mb-2">
            Terms of <em className="italic text-accent">Use</em>
          </h1>
          <p className="text-sm text-muted-foreground mb-12">Last updated: February 21, 2026</p>

          <div className="space-y-10 text-[15px] leading-relaxed text-foreground/85">
            <section>
              <p>
                Welcome to FineClause. By accessing or using this website and our services in any way, you agree to comply with these Terms of Use. FineClause is developed and operated by Empatixtech, registered at Pērnavas iela 21–22, Rīga, LV-1009, Latvia.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold font-display mb-3">Our Services</h2>
              <p>
                FineClause provides AI-powered contract analysis, including risk detection, clause-by-clause breakdown, risk scoring, and plain-English explanations of legal language. The service is designed to assist users in understanding contracts and legal documents. FineClause does <strong>not</strong> provide legal advice and should not be considered a substitute for professional legal counsel.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold font-display mb-3">Account Registration</h2>
              <p>
                To access certain features, you must create an account by providing a valid email address and password. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorised use of your account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold font-display mb-3">Acceptable Use</h2>
              <p className="mb-3">You agree not to:</p>
              <ul className="list-none space-y-2">
                <li className="flex items-start gap-2.5 border-b border-border pb-2"><span className="text-accent font-bold text-xs mt-1">•</span><span>Use FineClause for any unlawful purpose or in violation of any applicable laws or regulations.</span></li>
                <li className="flex items-start gap-2.5 border-b border-border pb-2"><span className="text-accent font-bold text-xs mt-1">•</span><span>Upload malicious files, viruses, or any content intended to disrupt the service.</span></li>
                <li className="flex items-start gap-2.5 border-b border-border pb-2"><span className="text-accent font-bold text-xs mt-1">•</span><span>Attempt to reverse-engineer, decompile, or extract the underlying AI models or algorithms.</span></li>
                <li className="flex items-start gap-2.5 border-b border-border pb-2"><span className="text-accent font-bold text-xs mt-1">•</span><span>Resell, redistribute, or sublicense access to FineClause without written authorisation.</span></li>
                <li className="flex items-start gap-2.5"><span className="text-accent font-bold text-xs mt-1">•</span><span>Interfere with or disrupt the security, integrity, or performance of our services.</span></li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold font-display mb-3">Intellectual Property</h2>
              <p>
                All content on this website — including text, graphics, logos, icons, images, software, and the FineClause name and brand — is protected by copyright and intellectual property laws. You may not copy, modify, sell, distribute, or create derivative works based on any part of the site or service without prior written permission from Empatixtech.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold font-display mb-3">Your Documents</h2>
              <p>
                You retain full ownership of all documents you upload to FineClause. We do not claim any intellectual property rights over your content. Documents are processed solely to provide you with our analysis service. We do not use your documents to train AI models or share them with third parties.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold font-display mb-3">Subscriptions & Payments</h2>
              <p>
                FineClause offers free and paid subscription tiers. Paid subscriptions are billed monthly. You may cancel at any time; cancellation takes effect at the end of the current billing period. Refunds are not provided for partial billing periods. Prices may change with 30 days' prior notice.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold font-display mb-3">Disclaimer of Warranties</h2>
              <p className="mb-3">All materials and services are provided "as is" without any warranties, express or implied. FineClause does not guarantee that:</p>
              <ul className="list-none space-y-2">
                <li className="flex items-start gap-2.5 border-b border-border pb-2"><span className="text-accent font-bold text-xs mt-1">•</span><span>The service will be uninterrupted, timely, secure, or error-free.</span></li>
                <li className="flex items-start gap-2.5 border-b border-border pb-2"><span className="text-accent font-bold text-xs mt-1">•</span><span>The results obtained from the service will be accurate or reliable.</span></li>
                <li className="flex items-start gap-2.5"><span className="text-accent font-bold text-xs mt-1">•</span><span>Any analysis constitutes legal advice or replaces the need for professional legal counsel.</span></li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold font-display mb-3">Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, Empatixtech and FineClause shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of data, profits, or business opportunities, arising out of or related to your use of the service. Our total liability shall not exceed the amount you have paid to FineClause in the 12 months preceding the claim.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold font-display mb-3">Governing Law</h2>
              <p>
                These Terms of Use are governed by and construed in accordance with the laws of the Republic of Latvia and applicable European Union regulations. Any disputes shall be resolved in the courts of Rīga, Latvia.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold font-display mb-3">Changes to Terms</h2>
              <p>
                FineClause reserves the right to modify these Terms of Use at any time. Updates will be posted on this page with an updated "last updated" date. Your continued use of the service after changes are posted constitutes acceptance of the modified terms.
              </p>
            </section>

            <section className="border-t border-border pt-8">
              <h2 className="text-xl font-bold font-display mb-3">Contact</h2>
              <p className="text-muted-foreground">
                <strong className="text-foreground">Empatixtech</strong><br />
                Pērnavas iela 21–22, Rīga, LV-1009, Latvia<br />
                Phone: <a href="tel:+37126761557" className="text-accent hover:underline">+371 2676 1557</a><br />
                Email: <a href="mailto:sales@empatixtech.com" className="text-accent hover:underline">sales@empatixtech.com</a>
              </p>
            </section>
          </div>
        </article>
      </div>

      <Footer />
    </div>
  );
};

export default TermsPage;
