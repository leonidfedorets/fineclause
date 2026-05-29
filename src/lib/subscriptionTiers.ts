export interface SubscriptionTier {
  key: string;
  name: string;
  price: number;
  priceId: string;
  productId: string;
  scansPerMonth: number | null; // null = unlimited
  features: string[];
}

export const TIERS: SubscriptionTier[] = [
  {
    key: "free",
    name: "Free",
    price: 0,
    priceId: "",
    productId: "",
    scansPerMonth: 1,
    features: ["1 contract scan", "Risk flag summary", "Plain-English breakdown"],
  },
  {
    key: "basic",
    name: "Basic",
    price: 5,
    priceId: "price_1T5LjP1p2rOgyxtVfjQiCJco",
    productId: "prod_U3SeCMHKuHMYC0",
    scansPerMonth: 10,
    features: ["10 scans/month", "Risk score breakdown", "Scan history", "PDF export"],
  },
  {
    key: "pro",
    name: "Pro",
    price: 10,
    priceId: "price_1T3J5r1p2rOgyxtVBVO7k6LZ",
    productId: "prod_U1Lnud0U3FVc6k",
    scansPerMonth: null,
    features: ["Unlimited scans", "Full risk breakdown", "Document Q&A", "Priority processing"],
  },
  {
    key: "enterprise",
    name: "Enterprise",
    price: 25,
    priceId: "price_1T5MDk1p2rOgyxtVvqH8JrfB",
    productId: "prod_U3TACwcpT0V5NA",
    scansPerMonth: null,
    features: ["Unlimited scans", "Priority support", "Advanced analytics", "API access", "Custom risk templates"],
  },
  {
    key: "invoice",
    name: "Invoice AI",
    price: 20,
    priceId: "price_1TI8Ee1p2rOgyxtVPSO39aMI",
    productId: "prod_UGfZ4Hh9uJ22me",
    scansPerMonth: null,
    features: ["Unlimited invoice generation", "AI-formatted PDF export", "Client sending & registry", "Tax & compliance templates", "Multi-currency support"],
  },
  {
    key: "agency",
    name: "Agency",
    price: 25,
    priceId: "price_1THOJ61p2rOgyxtVmlAMLZgM",
    productId: "prod_UFu79NnR9U64av",
    scansPerMonth: null,
    features: ["Full recruitment platform", "CRM integration (HubSpot)", "Candidate matching & analytics", "Unlimited job listings", "Lead management dashboard"],
  },
];

export const getTierByProductId = (productId: string | null): SubscriptionTier => {
  if (!productId) return TIERS[0];
  return TIERS.find((t) => t.productId === productId) ?? TIERS[0];
};

export const getTierByKey = (key: string): SubscriptionTier => {
  return TIERS.find((t) => t.key === key) ?? TIERS[0];
};

export const getTierIndex = (key: string): number => {
  return TIERS.findIndex((t) => t.key === key);
};
