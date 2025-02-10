
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function useConversionActions() {
  const { toast } = useToast();

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
      
      return true;
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "There was an error deleting the conversion",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    handleDownload,
    handleDelete,
  };
}

