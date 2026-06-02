import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getTierByProductId } from "@/lib/subscriptionTiers";
import { isMobileApp } from "@/lib/isMobileApp";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isPro: boolean;
  isAdmin: boolean;
  isMobile: boolean;           // true when running inside Capacitor native app
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
  isMobile: false,
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

  // Detect mobile once — stable across renders
  const mobile = isMobileApp();

  const checkSubscription = useCallback(async () => {
    // On mobile: authenticated users always get full access — no subscription check needed
    if (mobile) return;

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (!error && data) {
        const subscribed = data.subscribed ?? false;
        setIsPro(subscribed);
        setSubscriptionEnd(data.subscription_end ?? null);
        if (data.product_id) {
          const tier = getTierByProductId(data.product_id);
          setCurrentTierKey(tier.key);
        } else if (subscribed) {
          setCurrentTierKey("pro");
        } else {
          setCurrentTierKey("free");
        }
      }
    } catch (e) {
      console.error("Failed to check subscription:", e);
    }
  }, [mobile]);

  const checkRole = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
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
        // Mobile: immediately set as pro — all features unlocked
        if (mobile) {
          setIsPro(true);
          setCurrentTierKey("pro");
        } else {
          setTimeout(() => { checkSubscription(); }, 0);
        }
        checkRole(session.user.id);
      } else {
        setIsAdmin(false);
        setIsPro(false);
        setCurrentTierKey("free");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        if (mobile) {
          setIsPro(true);
          setCurrentTierKey("pro");
        } else {
          checkSubscription();
        }
        checkRole(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [checkSubscription, checkRole, mobile]);

  useEffect(() => {
    if (!user || mobile) return;
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [user, checkSubscription, mobile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsPro(false);
    setIsAdmin(false);
    setSubscriptionEnd(null);
    setCurrentTierKey("free");
  };

  return (
    <AuthContext.Provider value={{
      user, session, loading, isPro, isAdmin,
      isMobile: mobile,
      subscriptionEnd, currentTierKey, checkSubscription, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
