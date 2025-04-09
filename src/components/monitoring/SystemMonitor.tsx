
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { LogsList, RecentLogs, ErrorLogs } from './logs';
import { useMonitoringData } from './hooks/useMonitoringData';
import SystemStats from './dashboard/SystemStats';
import PerformanceMetrics from './performance/PerformanceMetrics';

const SystemMonitor: React.FC = () => {
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
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">System Monitoring</h1>
      
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="logs">System Logs</TabsTrigger>
          <TabsTrigger value="errors">Error Logs</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6 space-y-6">
          <SystemStats
            stats={stats}
            isLoading={isLoading}
            onRefresh={loadStats}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RecentLogs logs={logs} title="Recent System Activity" limit={5} />
            <ErrorLogs logs={errorLogs} />
          </div>
        </TabsContent>
        
        <TabsContent value="logs" className="mt-6">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">System Logs</h2>
              <div className="flex space-x-2">
                <button 
                  onClick={loadLogs}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:hover:bg-blue-800"
                >
                  Refresh
                </button>
                <button 
                  onClick={clearLogs}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 dark:bg-red-900 dark:text-red-100 dark:hover:bg-red-800"
                >
                  Clear Logs
                </button>
              </div>
            </div>
            
            <LogsList logs={logs} isLoading={isLoading} />
          </Card>
        </TabsContent>
        
        <TabsContent value="errors" className="mt-6">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-red-600 dark:text-red-400">Error Logs</h2>
              <button 
                onClick={loadErrorLogs}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:hover:bg-blue-800"
              >
                Refresh
              </button>
            </div>
            
            <LogsList logs={errorLogs} isLoading={isLoading} />
          </Card>
        </TabsContent>
        
        <TabsContent value="performance" className="mt-6">
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
