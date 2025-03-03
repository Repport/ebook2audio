
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SystemMonitor from '@/components/monitoring/SystemMonitor';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const Monitoring = () => {
  const { user, isLoading } = useAuth();
  
  // Show loading indicator while checking auth status
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Header />
      
      <main className="flex-grow">
        <SystemMonitor />
      </main>
      
      <Footer />
    </div>
  );
};

export default Monitoring;
