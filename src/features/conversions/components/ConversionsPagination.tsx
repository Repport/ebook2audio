
import { Button } from "@/components/ui/button";

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
    <div className="mt-4 flex justify-end gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.max(0, page - 1))}
        disabled={page === 0}
      >
        Previous
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={!hasMore}
      >
        Next
      </Button>
    </div>
  );
};

export default ConversionsPagination;

