import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowUp, ArrowDown, Loader2, Crown, Zap, Rocket } from "lucide-react";
import { TIERS, getTierIndex, type SubscriptionTier } from "@/lib/subscriptionTiers";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTierKey: string;
}

const tierIcons: Record<string, React.ReactNode> = {
  free: null,
  basic: <Zap className="w-5 h-5" />,
  pro: <Crown className="w-5 h-5" />,
  enterprise: <Rocket className="w-5 h-5" />,
  invoice: <Zap className="w-5 h-5" />,
};

const SubscriptionDialog = ({ open, onOpenChange, currentTierKey }: SubscriptionDialogProps) => {
  const [loading, setLoading] = useState<string | null>(null);
  const currentIndex = getTierIndex(currentTierKey);

  const handleSelectTier = async (tier: SubscriptionTier) => {
    const tierIndex = getTierIndex(tier.key);

    if (tier.key === currentTierKey) return;

    // Free tier → just close
    if (tier.key === "free") {
      toast.info("To downgrade to Free, cancel your subscription from the billing portal.");
      // Open customer portal for cancellation
      setLoading("free");
      try {
        const { data, error } = await supabase.functions.invoke("customer-portal");
        if (error) throw error;
        if (data?.error) {
          toast.error(data.error);
          return;
        }
        if (data?.url) window.open(data.url, "_blank");
      } catch {
        toast.error("Failed to open billing portal");
      } finally {
        setLoading(null);
      }
      return;
    }

    // For any paid tier change (upgrade or downgrade), go to checkout
    setLoading(tier.key);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: tier.priceId },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
        onOpenChange(false);
      }
    } catch (err) {
      console.error("Checkout error:", err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("STRIPE_SECRET_KEY") || msg.includes("not set") || msg.includes("configuration")) {
        toast.error("Payment system not configured. Please contact support.");
      } else {
        toast.error("Failed to start checkout. Please try again.");
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-display">Manage Subscription</DialogTitle>
          <DialogDescription>Choose a plan that fits your needs. Changes take effect immediately.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          {TIERS.map((tier) => {
            const isCurrent = tier.key === currentTierKey;
            const tierIndex = getTierIndex(tier.key);
            const isUpgrade = tierIndex > currentIndex;
            const isDowngrade = tierIndex < currentIndex;

            return (
              <div
                key={tier.key}
                className={`relative rounded-xl border p-5 transition-all ${
                  isCurrent
                    ? "border-accent bg-accent/5 ring-1 ring-accent/20"
                    : "border-border hover:border-accent/30"
                }`}
              >
                {isCurrent && (
                  <Badge className="absolute -top-2.5 right-3 bg-accent text-accent-foreground text-[10px]">
                    Current Plan
                  </Badge>
                )}
                <div className="flex items-center gap-2 mb-2">
                  {tierIcons[tier.key]}
                  <h3 className="font-display font-bold text-foreground">{tier.name}</h3>
                </div>
                <div className="mb-3">
                  <span className="text-3xl font-display font-black text-foreground">€{tier.price}</span>
                  {tier.price > 0 && <span className="text-sm text-muted-foreground">/mo</span>}
                </div>
                <ul className="space-y-1.5 mb-4">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={isCurrent ? "outline" : isUpgrade ? "hero" : "outline"}
                  size="sm"
                  className="w-full"
                  disabled={isCurrent || loading !== null}
                  onClick={() => handleSelectTier(tier)}
                >
                  {loading === tier.key ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</>
                  ) : isCurrent ? (
                    "Current Plan"
                  ) : isUpgrade ? (
                    <><ArrowUp className="w-4 h-4" /> Upgrade</>
                  ) : (
                    <><ArrowDown className="w-4 h-4" /> Downgrade</>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionDialog;
