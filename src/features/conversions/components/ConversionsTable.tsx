
import { formatDistanceToNow } from "date-fns";
import { Download, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Conversion {
  id: string;
  created_at: string;
  expires_at: string;
  file_name: string;
  file_size: number;
  storage_path: string;
}

interface ConversionsTableProps {
  conversions?: Conversion[];
  isLoading: boolean;
  onDownload: (storage_path: string, fileName: string) => void;
  onDelete: (id: string) => void;
}

const ConversionsTable = ({
  conversions,
  isLoading,
  onDownload,
  onDelete,
}: ConversionsTableProps) => {
  const formatFileSize = (bytes: number): string => {
    if (!bytes) return "N/A";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
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
    );
  }

  return (
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
                    onDownload(conversion.storage_path, conversion.file_name)
                  }
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(conversion.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ConversionsTable;

