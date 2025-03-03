
import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { LogEntry } from '@/utils/loggingService';

/**
 * System statistics component displaying global metrics
 */
const SystemStats = ({ 
  stats,
  isLoading,
  onRefresh
}: { 
  stats: any;
  isLoading: boolean;
  onRefresh: () => void;
}) => {
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

/**
 * Recent logs component displaying system events
 */
const RecentLogs = ({
  logs,
  isLoading,
  onRefresh,
  onClearLogs
}: {
  logs: LogEntry[];
  isLoading: boolean;
  onRefresh: () => void;
  onClearLogs: () => void;
}) => {
  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Recent System Logs</CardTitle>
          <div className="flex gap-2">
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
            <Button 
              variant="outline" 
              size="sm"
              onClick={onClearLogs}
              disabled={isLoading}
            >
              Clear
            </Button>
          </div>
        </div>
        <CardDescription>Recent system activity and errors</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No logs found
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {logs.map(log => (
                <div 
                  key={log.id} 
                  className="border rounded-lg p-3 text-sm"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        log.status === 'error' ? 'destructive' : 
                        log.status === 'warning' ? 'warning' : 
                        log.status === 'success' ? 'success' : 'default'
                      }>
                        {log.event_type}
                      </Badge>
                      {log.entity_id && (
                        <span className="text-xs text-muted-foreground">
                          ID: {log.entity_id.substring(0, 8)}...
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-[100px]">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Error logs component for filtering and displaying errors
 */
const ErrorLogs = ({
  logs,
  isLoading,
  onRefresh
}: {
  logs: LogEntry[];
  isLoading: boolean;
  onRefresh: () => void;
}) => {
  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Error Logs</CardTitle>
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
        <CardDescription>System errors and exceptions</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No errors found
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {logs.map(log => (
                <div 
                  key={log.id} 
                  className="border border-destructive/20 bg-destructive/5 rounded-lg p-3 text-sm"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">
                        {log.event_type}
                      </Badge>
                      {log.entity_id && (
                        <span className="text-xs text-muted-foreground">
                          ID: {log.entity_id.substring(0, 8)}...
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-[150px]">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Performance metrics component
 */
const PerformanceMetrics = ({
  metrics,
  isLoading,
  onRefresh
}: {
  metrics: any[];
  isLoading: boolean;
  onRefresh: () => void;
}) => {
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
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Operation</th>
                  <th className="text-right py-2 font-medium">Avg Duration</th>
                  <th className="text-right py-2 font-medium">Max</th>
                  <th className="text-right py-2 font-medium">Count</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((metric, index) => (
                  <tr key={index} className="border-b border-muted">
                    <td className="py-2">{metric.operation}</td>
                    <td className="py-2 text-right">
                      {metric.avg_duration_ms}ms
                    </td>
                    <td className="py-2 text-right">
                      {metric.max_duration_ms}ms
                    </td>
                    <td className="py-2 text-right">{metric.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Main System Monitor component
 */
const SystemMonitor = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalConversions: 0,
    completedConversions: 0,
    cachedItems: 0,
    avgProcessingTime: 0,
  });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [errorLogs, setErrorLogs] = useState<LogEntry[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<any[]>([]);

  // Load system stats
  const loadStats = async () => {
    setIsLoading(true);
    try {
      // Get total conversions
      const { data: conversionsData, error: conversionsError } = await supabase
        .from('text_conversions')
        .select('status', { count: 'exact' });
      
      if (conversionsError) throw conversionsError;
      
      // Get completed conversions
      const { count: completedCount, error: completedError } = await supabase
        .from('text_conversions')
        .select('id', { count: 'exact' })
        .eq('status', 'completed');
      
      if (completedError) throw completedError;
      
      // Get cached items
      const { count: cachedCount, error: cachedError } = await supabase
        .from('text_conversions')
        .select('id', { count: 'exact' })
        .eq('is_cached', true);
      
      if (cachedError) throw cachedError;
      
      // Get average processing time
      const { data: avgTimeData, error: avgTimeError } = await supabase
        .from('system_logs')
        .select('details')
        .eq('event_type', 'performance')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (avgTimeError) throw avgTimeError;
      
      // Calculate average processing time
      let totalDuration = 0;
      let count = 0;
      
      avgTimeData?.forEach(log => {
        if (log.details && log.details.duration_ms) {
          totalDuration += log.details.duration_ms;
          count++;
        }
      });
      
      const avgProcessingTime = count > 0 ? (totalDuration / count / 1000).toFixed(1) : 0;
      
      setStats({
        totalConversions: conversionsData?.length || 0,
        completedConversions: completedCount || 0,
        cachedItems: cachedCount || 0,
        avgProcessingTime: avgProcessingTime,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load system logs
  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      setLogs(data || []);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load error logs
  const loadErrorLogs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_logs')
        .select('*')
        .eq('status', 'error')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      setErrorLogs(data || []);
    } catch (error) {
      console.error('Error loading error logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load performance metrics
  const loadPerformanceMetrics = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_performance_metrics')
        .limit(20);
      
      if (error) {
        console.error('Error calling get_performance_metrics RPC:', error);
        // Fallback to basic query
        const { data: logsData, error: logsError } = await supabase
          .from('system_logs')
          .select('*')
          .eq('event_type', 'performance')
          .order('created_at', { ascending: false })
          .limit(100);
        
        if (logsError) throw logsError;
        
        // Process the logs to get metrics
        const metricsMap = new Map();
        
        logsData?.forEach(log => {
          if (log.details && log.details.operation && log.details.duration_ms) {
            const operation = log.details.operation;
            if (!metricsMap.has(operation)) {
              metricsMap.set(operation, {
                operation,
                total_duration_ms: 0,
                max_duration_ms: 0,
                count: 0
              });
            }
            
            const metric = metricsMap.get(operation);
            metric.total_duration_ms += log.details.duration_ms;
            metric.max_duration_ms = Math.max(metric.max_duration_ms, log.details.duration_ms);
            metric.count += 1;
          }
        });
        
        // Calculate averages
        const metrics = Array.from(metricsMap.values()).map(metric => ({
          operation: metric.operation,
          avg_duration_ms: Math.round(metric.total_duration_ms / metric.count),
          max_duration_ms: metric.max_duration_ms,
          count: metric.count
        }));
        
        setPerformanceMetrics(metrics);
      } else {
        setPerformanceMetrics(data || []);
      }
    } catch (error) {
      console.error('Error loading performance metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data based on active tab
  const loadTabData = () => {
    switch (activeTab) {
      case "overview":
        loadStats();
        loadLogs();
        break;
      case "logs":
        loadLogs();
        break;
      case "errors":
        loadErrorLogs();
        break;
      case "performance":
        loadPerformanceMetrics();
        break;
    }
  };

  // Clear logs (for development purposes)
  const clearLogs = async () => {
    if (!window.confirm('Are you sure you want to clear all logs?')) return;
    
    try {
      const { error } = await supabase
        .from('system_logs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Dummy condition to delete all
      
      if (error) throw error;
      
      // Reload logs
      loadLogs();
    } catch (error) {
      console.error('Error clearing logs:', error);
    }
  };

  // Initial data load
  useEffect(() => {
    loadTabData();
  }, [activeTab]);

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">System Monitoring</h1>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="logs">System Logs</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <SystemStats 
            stats={stats} 
            isLoading={isLoading} 
            onRefresh={loadStats} 
          />
          <RecentLogs 
            logs={logs} 
            isLoading={isLoading} 
            onRefresh={loadLogs} 
            onClearLogs={clearLogs} 
          />
        </TabsContent>
        
        <TabsContent value="logs">
          <RecentLogs 
            logs={logs} 
            isLoading={isLoading} 
            onRefresh={loadLogs} 
            onClearLogs={clearLogs} 
          />
        </TabsContent>
        
        <TabsContent value="errors">
          <ErrorLogs 
            logs={errorLogs} 
            isLoading={isLoading} 
            onRefresh={loadErrorLogs} 
          />
        </TabsContent>
        
        <TabsContent value="performance">
          <PerformanceMetrics 
            metrics={performanceMetrics} 
            isLoading={isLoading} 
            onRefresh={loadPerformanceMetrics} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemMonitor;
