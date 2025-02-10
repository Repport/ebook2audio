
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Conversion {
  id: string;
  created_at: string;
  expires_at: string;
  file_name: string;
  file_size: number;
  storage_path: string | null;
  compressed_storage_path: string | null;
}

const ITEMS_PER_PAGE = 10;

export function useConversions(page: number, userId: string | undefined) {
  const { toast } = useToast();

  return useQuery({
    queryKey: ["conversions", page, userId],
    queryFn: async () => {
      if (!userId) {
        return { conversions: [] };
      }

      try {
        await supabase.rpc('set_statement_timeout');

        const { data, error } = await supabase
          .from("text_conversions")
          .select("id, created_at, expires_at, file_name, file_size, storage_path, compressed_storage_path")
          .eq('user_id', userId)
          .eq('status', 'completed')
          .order("created_at", { ascending: false })
          .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);

        if (error) {
          console.error("Error fetching conversions:", error);
          throw error;
        }

        return {
          conversions: data as Conversion[],
        };
      } catch (error) {
        console.error("Failed to fetch conversions:", error);
        throw error;
      }
    },
    enabled: !!userId,
    staleTime: 300000,
    gcTime: 600000,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

