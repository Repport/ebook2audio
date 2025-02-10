
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ConversionsTable from "../components/ConversionsTable";
import ConversionsPagination from "../components/ConversionsPagination";

interface Conversion {
  id: string;
  created_at: string;
  expires_at: string;
  file_name: string;
  file_size: number;
  storage_path: string | null;
  compressed_storage_path: string | null;
}

const ITEMS_PER_PAGE = 10;

const Conversions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate("/auth", { state: { returnTo: "/conversions" } });
    }
  }, [user, navigate]);

  const {
    data: conversionsData,
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ["conversions", page, user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return { conversions: [] };
      }

      try {
        await supabase.rpc('set_statement_timeout');

        const { data, error } = await supabase
          .from("text_conversions")
          .select("id, created_at, expires_at, file_name, file_size, storage_path, compressed_storage_path")
          .eq('user_id', user.id)
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
    enabled: !!user?.id,
    staleTime: 300000,
    gcTime: 600000,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const handleDownload = async (storagePath: string | null, fileName: string) => {
    if (!storagePath) {
      toast({
        title: "Download failed",
        description: "Storage path is missing",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Downloading from storage path:', storagePath);
      const { data, error } = await supabase.storage
        .from("audio_cache")
        .download(storagePath);

      if (error) {
        console.error("Download error:", error);
        throw error;
      }

      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName.replace(/\.[^/.]+$/, "") + ".mp3";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Download started",
        description: "Your file will download shortly",
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "There was an error downloading your file",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("text_conversions")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Conversion deleted",
        description: "The conversion has been removed from your history",
      });
      
      refetch();
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "There was an error deleting the conversion",
        variant: "destructive",
      });
    }
  };

  if (!user) return null;

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Converter
        </Button>
      </div>

      <h1 className="text-3xl font-bold mb-8">Your Conversions</h1>

      {isError ? (
        <div className="text-center py-8 space-y-4">
          <p className="text-red-500">There was an error loading your conversions</p>
          <Button onClick={() => refetch()} className="gap-2">
            Try Again
          </Button>
        </div>
      ) : conversionsData?.conversions.length === 0 && !isLoading ? (
        <div className="text-center py-8 space-y-4">
          <p className="text-gray-500">You haven't converted any files yet</p>
          <Button onClick={() => navigate("/")} className="gap-2">
            Create Your First Conversion
          </Button>
        </div>
      ) : (
        <>
          <ConversionsTable
            conversions={conversionsData?.conversions}
            isLoading={isLoading}
            onDownload={handleDownload}
            onDelete={handleDelete}
          />
          <ConversionsPagination
            page={page}
            hasMore={
              conversionsData?.conversions &&
              conversionsData.conversions.length >= ITEMS_PER_PAGE
            }
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
};

export default Conversions;
