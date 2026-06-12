import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { isMobileApp } from "@/lib/isMobileApp";

const faqs = [
  {
    question: "What types of documents can FineClause analyze?",
    answer:
      "Any document with legal language — employment contracts, freelance agreements, NDAs, rental leases, SaaS terms of service, partnership agreements, vendor contracts, and more. Upload as PDF, DOCX, or paste raw text.",
  },
  {
    question: "How accurate is the AI analysis?",
    answer:
      "FineClause detects 94% of known risk patterns across thousands of clause types. Our models are trained on millions of real-world contracts and continuously improved. That said, we recommend using FineClause as a powerful first-pass tool — not a replacement for legal counsel on high-stakes deals.",
  },
  {
    question: "Is my document data secure?",
    answer:
      "Absolutely. Documents are encrypted in transit and at rest. We never use your documents to train our models, and you can delete your data at any time. We're SOC 2 compliant and GDPR-ready.",
  },
  {
    question: "Does FineClause replace a lawyer?",
    answer:
      "FineClause is designed to help you understand contracts faster and flag potential issues before you sign. For complex negotiations or high-value deals, we always recommend consulting a qualified attorney. Think of us as your first line of defense.",
  },
  {
    question: "What languages are supported?",
    answer:
      "Currently, FineClause works best with English-language contracts. We're actively expanding to support German, French, Spanish, and Portuguese — with more languages coming soon.",
  },
];

// "Pro subscription" FAQ is web-only — the mobile app has no subscriptions (Apple 3.1.1)
const proSubscriptionFaq = {
  question: "Can I cancel my Pro subscription anytime?",
  answer:
    "Yes — no lock-in, no cancellation fees (we'd catch those in our own contract). Cancel anytime from your dashboard, and you'll keep access until the end of your billing period.",
};

const FAQSection = () => {
  const items = isMobileApp() ? faqs : [...faqs.slice(0, 3), proSubscriptionFaq, ...faqs.slice(3)];
  return (
    <section className="py-24 px-6 md:px-16 border-b border-border">
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-3"
      >
        FAQ
      </motion.p>
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-3xl md:text-4xl lg:text-5xl font-extrabold font-display leading-[1.1] tracking-tight mb-16 max-w-[600px]"
      >
        Questions? We've got <em className="italic text-accent">answers.</em>
      </motion.h2>

      <Accordion type="single" collapsible className="max-w-[700px]">
        {items.map((faq, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.4, delay: idx * 0.08 }}
          >
            <AccordionItem value={`item-${idx}`} className="border-border">
              <AccordionTrigger className="text-left text-[15px] font-semibold font-display tracking-tight hover:no-underline hover:text-accent transition-colors py-5">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-[15px] leading-relaxed pb-5">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          </motion.div>
        ))}
      </Accordion>
    </section>
  );
};

export default FAQSection;
