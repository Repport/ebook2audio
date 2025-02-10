
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import ConversionsTable from "../components/ConversionsTable";
import ConversionsPagination from "../components/ConversionsPagination";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { useConversions } from "../hooks/useConversions";
import { useConversionActions } from "../hooks/useConversionActions";

const Conversions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const { handleDownload, handleDelete } = useConversionActions();

  useEffect(() => {
    if (!user) {
      navigate("/auth", { state: { returnTo: "/conversions" } });
    }
  }, [user, navigate]);

  const {
    data: conversionsData,
    isLoading,
    isError,
    refetch
  } = useConversions(page, user?.id);

  if (!user) return null;

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Converter
        </Button>
      </div>

      <h1 className="text-3xl font-bold mb-8">Your Conversions</h1>

      {isError ? (
        <ErrorState onRetry={refetch} />
      ) : conversionsData?.conversions.length === 0 && !isLoading ? (
        <EmptyState />
      ) : (
        <>
          <ConversionsTable
            conversions={conversionsData?.conversions}
            isLoading={isLoading}
            onDownload={handleDownload}
            onDelete={async (id) => {
              const success = await handleDelete(id);
              if (success) refetch();
            }}
          />
          <ConversionsPagination
            page={page}
            hasMore={
              conversionsData?.conversions &&
              conversionsData.conversions.length >= 10
            }
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
};

export default Conversions;

