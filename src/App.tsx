
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import Settings from '@/pages/Settings';
import Conversions from '@/pages/Conversions';
import Monitoring from '@/pages/Monitoring';
import Privacy from '@/pages/Privacy';
import CookiePolicy from '@/pages/CookiePolicy';
import NotFound from '@/pages/NotFound';
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import CookieConsent from "@/components/CookieConsent"
import { LanguageProvider } from "@/hooks/useLanguage";
import ErrorBoundary from "@/components/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary componentName="App">
      <BrowserRouter>
        <LanguageProvider>
          <ThemeProvider>
            <Toaster />
            <CookieConsent />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/conversions" element={<Conversions />} />
              <Route path="/monitoring" element={<Monitoring />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/cookie-policy" element={<CookiePolicy />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ThemeProvider>
        </LanguageProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
