
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

interface Conversion {
  id: string;
  created_at: string;
  expires_at: string;
  file_name: string;
  file_size: number;
  storage_path: string;
}

const Conversions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate("/auth", { state: { from: location } });
    }
  }, [user, navigate]);

  const { data: conversions, isLoading } = useQuery({
    queryKey: ["conversions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("text_conversions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Conversion[];
    },
    enabled: !!user,
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

      {isLoading ? (
        <div>Loading...</div>
      ) : conversions?.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          You haven't converted any files yet
        </div>
      ) : (
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
              {conversions?.map((conversion) => (
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
      )}
    </div>
  );
};

export default Conversions;
