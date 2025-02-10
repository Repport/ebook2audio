
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Download, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface Conversion {
  id: string;
  created_at: string;
  expires_at: string;
  file_name: string;
  file_size: number;
  storage_path: string;
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
          .select("id, created_at, expires_at, file_name, file_size, storage_path")
          .eq('user_id', user.id)
          .eq('status', 'completed')  // Only fetch completed conversions
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
    staleTime: 300000, // Cache data for 5 minutes
    cacheTime: 600000, // Keep cache for 10 minutes
    retry: 2,
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Don't refetch on component mount if data exists
  });

  const formatFileSize = (bytes: number): string => {
    if (!bytes) return "N/A";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const handleDownload = async (storage_path: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("audio_cache")
        .download(storage_path);

      if (error) throw error;

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
        description: "There was an error downloading your file",
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
        description: "There was an error deleting the conversion",
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
      ) : isLoading ? (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(3)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-8 w-[80px] ml-auto" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : conversionsData?.conversions.length === 0 ? (
        <div className="text-center py-8 space-y-4">
          <p className="text-gray-500">You haven't converted any files yet</p>
          <Button onClick={() => navigate("/")} className="gap-2">
            Create Your First Conversion
          </Button>
        </div>
      ) : (
        <>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conversionsData?.conversions.map((conversion) => (
                  <TableRow key={conversion.id}>
                    <TableCell>{conversion.file_name}</TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(conversion.created_at), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(conversion.expires_at), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell>{formatFileSize(conversion.file_size)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleDownload(
                            conversion.storage_path,
                            conversion.file_name
                          )
                        }
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(conversion.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={
                !conversionsData?.conversions.length ||
                conversionsData.conversions.length < ITEMS_PER_PAGE
              }
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default Conversions;
