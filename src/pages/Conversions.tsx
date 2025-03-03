
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import ConversionsTable from '@/features/conversions/components/ConversionsTable';
import ConversionsPagination from '@/features/conversions/components/ConversionsPagination';

const Conversions = () => {
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
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Your Conversions</h1>
        <ConversionsTable />
        <div className="mt-4 flex justify-center">
          <ConversionsPagination />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Conversions;
