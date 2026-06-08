import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useEffect } from "react";
import Index from "./pages/Index";
import ScanPage from "./pages/ScanPage";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import DashboardPage from "./pages/DashboardPage";
import ContactPage from "./pages/ContactPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import SecurityPage from "./pages/SecurityPage";
import InstallPage from "./pages/InstallPage";
import ComparisonPage from "./pages/ComparisonPage";
import AdminPage from "./pages/AdminPage";
import TemplatesPage from "./pages/TemplatesPage";
import CookiesPage from "./pages/CookiesPage";
import SharedReportPage from "./pages/SharedReportPage";
import CareersPage from "./pages/CareersPage";
import EmployersPage from "./pages/EmployersPage";
import RecruiterDashboardPage from "./pages/RecruiterDashboardPage";
import AgencySignupPage from "./pages/AgencySignupPage";
import InvoicesPage from "./pages/InvoicesPage";
import ExpensesPage from "./pages/ExpensesPage";
import CarbonFootprintPage from "./pages/CarbonFootprintPage";
import TaxEstimationPage from "./pages/TaxEstimationPage";
import CookieConsent from "./components/CookieConsent";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";
import { isMobileApp } from "@/lib/isMobileApp";

const queryClient = new QueryClient();
const mobileApp = isMobileApp();

/**
 * Apple App Review (Guideline 3.1.1) does not allow business/agency account
 * registration or recruiter/employer flows in the mobile app — only the free
 * CV analysis stays. These routes redirect to the careers (CV analysis) page
 * when running inside the Capacitor native shell.
 */
const MobileBlockedRoute = () => <Navigate to="/careers" replace />;

/**
 * Scrolls to a hash anchor after route changes.
 * Handles navigate("/#pricing") → scrolls to <section id="pricing">
 */
const HashScrollHandler = () => {
  const { hash, pathname } = useLocation();
  useEffect(() => {
    if (!hash) return;
    // Small delay lets the page render before scrolling
    const id = hash.replace("#", "");
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else {
      // Try again after a render cycle (for hash on newly loaded pages)
      const t = setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 150);
      return () => clearTimeout(t);
    }
  }, [hash, pathname]);
  return null;
};

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <HashScrollHandler />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/scan" element={<ProtectedRoute><ScanPage /></ProtectedRoute>} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/compare" element={<ProtectedRoute><ComparisonPage /></ProtectedRoute>} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/security" element={<SecurityPage />} />
              <Route path="/install" element={<InstallPage />} />
              <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
              <Route path="/templates" element={<ProtectedRoute><TemplatesPage /></ProtectedRoute>} />
              <Route path="/cookies" element={<CookiesPage />} />
              <Route path="/careers" element={<CareersPage />} />
              <Route path="/employers" element={mobileApp ? <MobileBlockedRoute /> : <EmployersPage />} />
              <Route path="/recruiter" element={mobileApp ? <MobileBlockedRoute /> : <ProtectedRoute><RecruiterDashboardPage /></ProtectedRoute>} />
              <Route path="/agency/signup" element={mobileApp ? <MobileBlockedRoute /> : <Navigate to="/signup?type=agency" replace />} />
              <Route path="/invoices" element={<ProtectedRoute><InvoicesPage /></ProtectedRoute>} />
              <Route path="/expenses" element={<ProtectedRoute><ExpensesPage /></ProtectedRoute>} />
              <Route path="/carbon" element={<ProtectedRoute><CarbonFootprintPage /></ProtectedRoute>} />
              <Route path="/tax" element={<ProtectedRoute><TaxEstimationPage /></ProtectedRoute>} />
              <Route path="/shared/:token" element={<SharedReportPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <CookieConsent />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
