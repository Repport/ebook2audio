
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Privacy from "./pages/Privacy";
import CookiePolicy from "./pages/CookiePolicy";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import Conversions from "./features/conversions/pages/Conversions";
import CookieConsentBanner from "./components/CookieConsent";
import { LanguageProvider } from "./hooks/useLanguage";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
};

const queryClient = new QueryClient();

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/auth" element={<Auth />} />
    <Route path="/settings" element={<Settings />} />
    <Route 
      path="/conversions" 
      element={
        <ProtectedRoute>
          <Conversions />
        </ProtectedRoute>
      } 
    />
    <Route path="/privacy" element={<Privacy />} />
    <Route path="/cookie-policy" element={<CookiePolicy />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <AuthProvider>
      <LanguageProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
            <CookieConsentBanner />
          </TooltipProvider>
        </QueryClientProvider>
      </LanguageProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;

