
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ConversionsPaginationProps {
  page: number;
  hasMore: boolean;
  onPageChange: (newPage: number) => void;
}

const ConversionsPagination = ({
  page,
  hasMore,
  onPageChange,
}: ConversionsPaginationProps) => {
  return (
    <div className="flex items-center justify-center space-x-2 my-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.max(0, page - 1))}
        disabled={page === 0}
        className="h-8 w-8 p-0"
      >
        <span className="sr-only">Página anterior</span>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <div className="text-sm">
        Página {page + 1}
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={!hasMore}
        className="h-8 w-8 p-0"
      >
        <span className="sr-only">Página siguiente</span>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ConversionsPagination;
