
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Download, Trash2, AlertTriangle, CheckCircle, Clock } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

// Updated interface to include all required properties
export interface Conversion {
  id: string;
  created_at: string;
  expires_at: string;
  file_name: string | null;
  file_size: number | null;
  storage_path: string | null;
  status: string;
}

interface ConversionsTableProps {
  conversions?: Conversion[];
  isLoading: boolean;
  onDownload: (storage_path: string, fileName: string) => void;
  onDelete: (id: string) => void;
}

const ConversionsTable = ({
  conversions = [],
  isLoading,
  onDownload,
  onDelete,
}: ConversionsTableProps) => {
  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return "N/A";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" /> Completado
        </Badge>;
      case 'error':
        return <Badge variant="outline" className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 border-red-200">
          <AlertTriangle className="h-3 w-3 mr-1" /> Error
        </Badge>;
      case 'converting':
        return <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 border-blue-200">
          <Clock className="h-3 w-3 mr-1 animate-pulse" /> En proceso
        </Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800">
          {status}
        </Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Archivo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Creado</TableHead>
              <TableHead>Expira</TableHead>
              <TableHead>Tamaño</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(3)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
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

  // Si no hay conversiones después de cargar, no mostrar la tabla
  if (conversions.length === 0) {
    return null;
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Archivo</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Creado</TableHead>
            <TableHead>Expira</TableHead>
            <TableHead>Tamaño</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {conversions.map((conversion) => (
            <TableRow key={conversion.id}>
              <TableCell className="font-medium">
                {conversion.file_name || "Sin nombre"}
              </TableCell>
              <TableCell>
                {getStatusBadge(conversion.status)}
              </TableCell>
              <TableCell>
                {formatDistanceToNow(new Date(conversion.created_at), {
                  addSuffix: true,
                  locale: es
                })}
              </TableCell>
              <TableCell>
                {formatDistanceToNow(new Date(conversion.expires_at), {
                  addSuffix: true,
                  locale: es
                })}
              </TableCell>
              <TableCell>{formatFileSize(conversion.file_size)}</TableCell>
              <TableCell className="text-right space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={conversion.status !== 'completed' || !conversion.storage_path}
                  onClick={() =>
                    onDownload(conversion.storage_path || "", conversion.file_name || `audio_${conversion.id}.mp3`)
                  }
                  title={conversion.status !== 'completed' ? "La conversión debe estar completa para descargar" : "Descargar"}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(conversion.id)}
                  title="Eliminar"
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
