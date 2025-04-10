
import React from 'react';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage.tsx";

interface DownloadButtonProps {
  onDownloadClick: () => void;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ onDownloadClick }) => {
  const { translations } = useLanguage();
  
  return (
    <Button
      onClick={onDownloadClick}
      type="button"
      className="w-full py-6 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white dark:bg-green-600 dark:text-white dark:hover:bg-green-700"
    >
      <Download className="w-5 h-5" />
      {translations.downloadAudio || "Download Audio"}
    </Button>
  );
};

export default DownloadButton;
