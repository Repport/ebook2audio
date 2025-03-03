
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import ConversionsTable from '@/features/conversions/components/ConversionsTable';
import ConversionsPagination from '@/features/conversions/components/ConversionsPagination';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Conversion {
  id: string;
  created_at: string;
  expires_at: string;
  file_name: string;
  file_size: number;
  storage_path: string;
  status: string;
}

const Conversions = () => {
  const { user, isLoading } = useAuth();
  const [page, setPage] = useState(0);
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [isLoadingConversions, setIsLoadingConversions] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  
  const ITEMS_PER_PAGE = 10;
  
  // Cargar conversiones cuando el componente se monta o el usuario/página cambian
  useEffect(() => {
    if (user) {
      loadConversions();
    }
  }, [user, page]);
  
  const loadConversions = async () => {
    try {
      setIsLoadingConversions(true);
      
      // Consultar conversiones del usuario actual con paginación
      const { data, error, count } = await supabase
        .from('text_conversions')
        .select('*', { count: 'exact' })
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);
      
      if (error) {
        console.error('Error loading conversions:', error);
        toast.error('No se pudieron cargar las conversiones');
        setConversions([]);
        return;
      }
      
      // Si no hay conversiones para este usuario, mostrar un array vacío
      if (!data || data.length === 0) {
        setConversions([]);
        setHasMore(false);
      } else {
        setConversions(data as Conversion[]);
        // Verificar si hay más páginas disponibles
        setHasMore(count ? count > (page + 1) * ITEMS_PER_PAGE : false);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('Ocurrió un error inesperado');
    } finally {
      setIsLoadingConversions(false);
    }
  };

  const handleDownload = async (storagePath: string, fileName: string) => {
    try {
      // Mostrar notificación de progreso
      toast.loading(`Preparando descarga de ${fileName}...`);
      
      // Obtener URL de descarga
      const { data, error } = await supabase
        .storage
        .from('audio_cache')
        .createSignedUrl(storagePath, 60);
      
      if (error) {
        throw error;
      }
      
      if (!data?.signedUrl) {
        throw new Error('No se pudo generar el enlace de descarga');
      }
      
      // Crear un enlace y simular clic para descargar
      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.dismiss();
      toast.success(`Descargando ${fileName}`);
    } catch (error) {
      console.error('Download error:', error);
      toast.dismiss();
      toast.error('Error al descargar el archivo');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta conversión?')) {
      return;
    }
    
    try {
      // Primero, obtener la ruta de almacenamiento
      const { data: conversionData, error: fetchError } = await supabase
        .from('text_conversions')
        .select('storage_path')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        throw fetchError;
      }
      
      // Eliminar el archivo si existe
      if (conversionData?.storage_path) {
        const { error: storageError } = await supabase
          .storage
          .from('audio_cache')
          .remove([conversionData.storage_path]);
        
        if (storageError) {
          console.error('Error removing file:', storageError);
          // Continuamos de todas formas para eliminar el registro
        }
      }
      
      // Eliminar el registro de la base de datos
      const { error: deleteError } = await supabase
        .from('text_conversions')
        .delete()
        .eq('id', id);
      
      if (deleteError) {
        throw deleteError;
      }
      
      // Actualizar la lista local
      setConversions(conversions.filter(conv => conv.id !== id));
      toast.success("Conversión eliminada correctamente");
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Error al eliminar la conversión');
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    // La carga de datos se maneja en el useEffect
  };

  // Show loading indicator while checking auth status
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Tus Conversiones</h1>
        
        <ConversionsTable 
          conversions={conversions}
          isLoading={isLoadingConversions}
          onDownload={handleDownload}
          onDelete={handleDelete}
        />
        
        {!isLoadingConversions && conversions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No tienes conversiones guardadas.
            </p>
          </div>
        ) : (
          <div className="mt-4 flex justify-center">
            <ConversionsPagination 
              page={page}
              hasMore={hasMore}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Conversions;
