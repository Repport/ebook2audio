
import { supabase } from "@/integrations/supabase/client";

export const logTermsAcceptance = async (
  token: string,
  score: number,
  fileName?: string,
  fileType?: string
) => {
  try {
    const ipResponse = await fetch('https://api.ipify.org?format=json');
    const ipData = await ipResponse.json();
    
    const { error } = await supabase
      .from('terms_acceptance_logs')
      .insert([
        {
          ip_address: ipData.ip,
          user_agent: navigator.userAgent,
          file_name: fileName,
          file_type: fileType,
          captcha_token: token,
          recaptcha_score: score,
          retention_period_accepted: true
        }
      ]);

    return { error };
  } catch (error) {
    console.error('Error getting IP or logging acceptance:', error);
    return { error };
  }
};
