import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getTierByProductId } from "@/lib/subscriptionTiers";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isPro: boolean;
  isAdmin: boolean;
  subscriptionEnd: string | null;
  currentTierKey: string;
  checkSubscription: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isPro: false,
  isAdmin: false,
  subscriptionEnd: null,
  currentTierKey: "free",
  checkSubscription: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [currentTierKey, setCurrentTierKey] = useState("free");

  const checkSubscription = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (!error && data) {
        const subscribed = data.subscribed ?? false;
        setIsPro(subscribed);
        setSubscriptionEnd(data.subscription_end ?? null);
        
        // Determine tier from product_id
        if (data.product_id) {
          const tier = getTierByProductId(data.product_id);
          setCurrentTierKey(tier.key);
        } else if (subscribed) {
          // Subscribed but no product_id (manually granted)
          setCurrentTierKey("pro");
        } else {
          setCurrentTierKey("free");
        }
      }
    } catch (e) {
      console.error("Failed to check subscription:", e);
    }
  }, []);

  const checkRole = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!!data);
    } catch (e) {
      console.error("Failed to check role:", e);
      setIsAdmin(false);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        setTimeout(() => {
          checkSubscription();
          checkRole();
        }, 0);
      } else {
        setIsAdmin(false);
        setCurrentTierKey("free");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        checkSubscription();
        checkRole();
      }
    });

    return () => subscription.unsubscribe();
  }, [checkSubscription, checkRole]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsPro(false);
    setIsAdmin(false);
    setSubscriptionEnd(null);
    setCurrentTierKey("free");
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isPro, isAdmin, subscriptionEnd, currentTierKey, checkSubscription, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
