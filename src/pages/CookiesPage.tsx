import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const CookiesPage = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="font-[var(--font-display)] text-3xl md:text-4xl font-bold text-foreground mb-8">
            Cookie Policy
          </h1>
          <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 space-y-6">
            <p className="text-muted-foreground text-sm">Last updated: March 23, 2026</p>

            <section>
              <h2 className="text-xl font-semibold text-foreground">1. What Are Cookies</h2>
              <p>
                Cookies are small text files stored on your device when you visit a website. They help the website remember your preferences and improve your experience. FineClause uses cookies in accordance with the EU ePrivacy Directive (2009/136/EC) and the General Data Protection Regulation (GDPR).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">2. Types of Cookies We Use</h2>
              
              <h3 className="text-lg font-medium text-foreground mt-4">Essential Cookies (Strictly Necessary)</h3>
              <p>These cookies are required for the basic functioning of FineClause. They enable core features such as authentication, session management, and security. They cannot be disabled.</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Authentication cookies</strong> — Maintain your login session securely</li>
                <li><strong>Security cookies</strong> — Protect against cross-site request forgery and unauthorized access</li>
                <li><strong>Cookie consent cookie</strong> — Remembers your cookie preference</li>
              </ul>

              <h3 className="text-lg font-medium text-foreground mt-4">Analytics Cookies (Optional)</h3>
              <p>These cookies help us understand how visitors use FineClause so we can improve our service. They collect anonymized, aggregated data and are only set with your explicit consent.</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Usage statistics</strong> — Page views, feature usage patterns</li>
                <li><strong>Performance data</strong> — Load times, error tracking</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">3. Your Choices</h2>
              <p>
                When you first visit FineClause, you will see a cookie consent banner allowing you to:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Accept All</strong> — Enables all cookies including analytics</li>
                <li><strong>Essential Only</strong> — Only strictly necessary cookies will be used</li>
              </ul>
              <p>
                You can change your preferences at any time by clearing your browser cookies and revisiting FineClause, which will trigger the consent banner again.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">4. Third-Party Cookies</h2>
              <p>
                FineClause may use third-party services (such as payment processors) that set their own cookies. These are governed by the respective third party's cookie and privacy policies. We use:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Stripe</strong> — Payment processing (subject to Stripe's privacy policy)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">5. Cookie Retention</h2>
              <p>
                <strong>Session cookies</strong> are deleted when you close your browser. <strong>Persistent cookies</strong> remain on your device until they expire or you delete them. Our consent cookie is stored for 12 months.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">6. Your Rights Under GDPR</h2>
              <p>Under the General Data Protection Regulation (EU 2016/679), you have the right to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Access the personal data we hold about you</li>
                <li>Request rectification or erasure of your data</li>
                <li>Withdraw consent at any time</li>
                <li>Lodge a complaint with a supervisory authority</li>
              </ul>
              <p>
                For Latvia, the supervisory authority is the Data State Inspectorate (<em>Datu valsts inspekcija</em>).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">7. Data Controller</h2>
              <p>
                <strong>SIA "Empatixtech"</strong><br />
                Registration No. 40203614886<br />
                Rīga, Pērnavas iela 21 - 22, Latvia<br />
                Email: <a href="mailto:sales@empatixtech.com" className="text-accent hover:underline">sales@empatixtech.com</a>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">8. Updates</h2>
              <p>
                We may update this Cookie Policy from time to time. Changes will be posted on this page with an updated revision date. We encourage you to review this policy periodically.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CookiesPage;
