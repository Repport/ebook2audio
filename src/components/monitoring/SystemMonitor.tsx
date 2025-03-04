import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SystemStats from './dashboard/SystemStats';
import RecentLogs from './logs/RecentLogs';
import ErrorLogs from './logs/ErrorLogs';
import PerformanceMetrics from './performance/PerformanceMetrics';
import { useMonitoringData } from './hooks/useMonitoringData';

/**
 * Main System Monitor component
 */
const SystemMonitor = () => {
  const {
    activeTab,
    setActiveTab,
    isLoading,
    stats,
    logs,
    errorLogs,
    performanceMetrics,
    loadStats,
    loadLogs,
    loadErrorLogs,
    loadPerformanceMetrics,
    clearLogs
  } = useMonitoringData();

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
