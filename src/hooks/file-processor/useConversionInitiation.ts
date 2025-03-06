
import { useCallback } from 'react';
import { useConversionStore } from '@/store/conversionStore';
import { clearConversionStorage } from '@/services/storage/conversionStorageService';

export function useConversionInitiation() {
  const conversionStore = useConversionStore();
  
  const initiateConversion = useCallback(async (
    selectedFile: File | null,
    extractedText: string,
    audioConversion: any,
    checkTermsAcceptance: () => Promise<boolean>,
    setShowTerms: (show: boolean) => void
  ) => {
    console.log('useConversionInitiation - initiateConversion called');
    
    if (!selectedFile || !extractedText) {
      console.log('useConversionInitiation - Missing file or text');
      return false;
    }
    
    try {
      console.log('useConversionInitiation - Checking terms acceptance');
      
      // Check if conversion is already in progress to prevent duplicate requests
      const currentStatus = conversionStore.status;
      if (currentStatus === 'converting' || currentStatus === 'processing') {
        console.log('useConversionInitiation - Already converting, skipping new request');
        return true; // Already converting, don't restart
      }
      
      // Generation a unique conversion ID to track this conversion
      const conversionId = crypto.randomUUID();
      console.log(`useConversionInitiation - Generated new conversion ID: ${conversionId}`);
      
      // Generate a text hash to help identify duplicate conversions
      const textHash = await generateTextHash(extractedText);
      console.log(`useConversionInitiation - Text hash: ${textHash}`);
      
      // Only reset if not already converting
      console.log('useConversionInitiation - Resetting conversion state');
      audioConversion.resetConversion();
      conversionStore.resetConversion();
      clearConversionStorage();
      
      const termsAccepted = await checkTermsAcceptance();
      if (!termsAccepted) {
        setShowTerms(true);
        return true; // We're showing terms, so this is a successful flow
      }
      
      return true;
    } catch (err) {
      console.error('useConversionInitiation - Error in terms acceptance check:', err);
      setShowTerms(true);
      return false;
    }
  }, [conversionStore]);
  
  return {
    initiateConversion
  };
}

// Helper function to generate a hash for text
async function generateTextHash(text: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex.substring(0, 16); // Return first 16 chars of the hash for brevity
  } catch (error) {
    console.error('Error generating text hash:', error);
    return Date.now().toString(36); // Fallback to timestamp if hashing fails
  }
}
