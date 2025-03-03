
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";

interface SystemStatsProps { 
  stats: {
    totalConversions: number;
    completedConversions: number;
    cachedItems: number;
    avgProcessingTime: number;
  };
  isLoading: boolean;
  onRefresh: () => void;
}

/**
 * System statistics component displaying global metrics
 */
const SystemStats = ({ stats, isLoading, onRefresh }: SystemStatsProps) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">System Statistics</CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onRefresh} 
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
        <CardDescription>Overall system performance metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Total Conversions</p>
            <p className="text-2xl font-bold">{isLoading ? '...' : stats.totalConversions}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Completed</p>
            <p className="text-2xl font-bold">{isLoading ? '...' : stats.completedConversions}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Cached Items</p>
            <p className="text-2xl font-bold">{isLoading ? '...' : stats.cachedItems}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Avg. Processing Time</p>
            <p className="text-2xl font-bold">{isLoading ? '...' : `${stats.avgProcessingTime}s`}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemStats;
