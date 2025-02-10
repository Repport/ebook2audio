
import { Chapter } from '@/utils/textExtraction';
import { formatTimestamp } from '@/utils/timeFormatting';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ChaptersListProps {
  chapters: Chapter[];
}

export const ChaptersList = ({ chapters }: ChaptersListProps) => {
  if (!chapters || chapters.length === 0) return null;

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="chapters">
        <AccordionTrigger className="text-sm">
          {chapters.length} {chapters.length === 1 ? 'Chapter' : 'Chapters'} Found
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            {chapters.map((chapter, index) => (
              <div key={index} className="flex justify-between items-center py-1">
                <span className="font-medium truncate flex-1 mr-4">{chapter.title}</span>
                <span className="text-muted-foreground whitespace-nowrap">
                  {formatTimestamp(chapter.timestamp || 0)}
                </span>
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
