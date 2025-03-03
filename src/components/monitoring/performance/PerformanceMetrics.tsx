
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PerformanceMetricsProps } from '../types';

/**
 * Performance metrics component
 */
const PerformanceMetrics = ({ metrics, isLoading, onRefresh }: PerformanceMetricsProps) => {
  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Performance Metrics</CardTitle>
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
        <CardDescription>Operation performance and timing data</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : metrics.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No performance data found
          </div>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Operation</TableHead>
                  <TableHead className="text-right">Avg Duration</TableHead>
                  <TableHead className="text-right">Max</TableHead>
                  <TableHead className="text-right">Min</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.map((metric, index) => (
                  <TableRow key={index}>
                    <TableCell>{metric.operation}</TableCell>
                    <TableCell className="text-right">
                      {metric.avg_duration_ms}ms
                    </TableCell>
                    <TableCell className="text-right">
                      {metric.max_duration_ms}ms
                    </TableCell>
                    <TableCell className="text-right">
                      {metric.min_duration_ms}ms
                    </TableCell>
                    <TableCell className="text-right">{metric.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PerformanceMetrics;
