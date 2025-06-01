import { StoredConversionState } from './types';
import { updateSupabaseConversion } from './conversionUpdate';
import { fetchSupabaseConversion } from './conversionFetch';

// Re-export these functions for backward compatibility
export { 
  updateSupabaseConversion,
  fetchSupabaseConversion
};
