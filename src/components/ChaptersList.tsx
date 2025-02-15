
import { Chapter } from '@/utils/textExtraction';
import { formatTimestamp } from '@/utils/timeFormatting';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

interface ChaptersListProps {
  chapters: Chapter[];
}

const getTypeColor = (type?: string) => {
  switch (type) {
    case 'pattern':
      return 'bg-green-500';
    case 'style':
      return 'bg-blue-500';
    case 'heading':
      return 'bg-purple-500';
    default:
      return 'bg-gray-500';
  }
};

export const ChaptersList = ({ chapters }: ChaptersListProps) => {
  console.log('ChaptersList received chapters:', chapters);

  if (!chapters || chapters.length === 0) {
    console.log('No chapters to display');
    return null;
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="chapters">
        <AccordionTrigger className="text-sm">
          {chapters.length} {chapters.length === 1 ? 'Chapter' : 'Chapters'} Found
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            {chapters.map((chapter, index) => {
              console.log('Rendering chapter:', chapter);
              return (
                <div key={index} className="flex items-center justify-between py-1">
                  <div className="flex items-center space-x-2 flex-1">
                    <span className="font-medium truncate">{chapter.title}</span>
                    {chapter.type && (
                      <Badge variant="secondary" className={`${getTypeColor(chapter.type)} text-white`}>
                        {chapter.type}
                      </Badge>
                    )}
                    {chapter.confidence && (
                      <Badge variant="outline" className="text-xs">
                        {Math.round(chapter.confidence * 100)}%
                      </Badge>
                    )}
                  </div>
                  <span className="text-muted-foreground whitespace-nowrap">
                    {formatTimestamp(chapter.timestamp || 0)}
                  </span>
                </div>
              );
            })}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
