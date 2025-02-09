
import React from 'react';
import { Loader2 } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Chapter } from '@/utils/textExtraction';

interface ConversionStatusProps {
  status: 'idle' | 'converting' | 'completed' | 'error';
  progress?: number;
  fileType?: 'PDF' | 'EPUB';
  chaptersFound?: number;
  detectingChapters?: boolean;
  chapters?: Chapter[];
}

const ConversionStatus = ({ 
  status, 
  progress = 0, 
  fileType = 'EPUB',
  chaptersFound = 0,
  detectingChapters = false,
  chapters = []
}: ConversionStatusProps) => {
  const statusMessages = {
    idle: 'Ready to convert',
    converting: `Converting your ${fileType} to MP3...`,
    completed: 'Conversion completed!',
    error: 'Conversion failed'
  };

  const formatTimestamp = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="flex flex-col items-center space-y-4 animate-fade-up">
      {status === 'converting' && (
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      )}
      <p className="text-lg font-medium text-gray-900">{statusMessages[status]}</p>
      
      {detectingChapters && (
        <p className="text-sm text-gray-600">
          Detecting chapters... Found {chaptersFound} chapters
        </p>
      )}
      
      {chapters.length > 0 && (
        <Accordion type="single" collapsible className="w-full max-w-md">
          <AccordionItem value="chapters">
            <AccordionTrigger className="text-sm">
              {chapters.length} Chapters Found
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 text-sm text-gray-600">
                {chapters.map((chapter, index) => (
                  <div key={index} className="flex justify-between items-center py-1">
                    <span className="font-medium">{chapter.title}</span>
                    <span className="text-gray-500">
                      {formatTimestamp(chapter.timestamp || 0)}
                    </span>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {status === 'converting' && (
        <div className="w-full max-w-xs bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-primary h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default ConversionStatus;
