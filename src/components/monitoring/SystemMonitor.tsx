
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RecentLogs, ErrorLogs, LogsList } from './logs';
import { useSystemMonitoring } from '@/hooks/useSystemMonitoring';

const SystemMonitor: React.FC = () => {
  const { logs, isLoading, error } = useSystemMonitoring();
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">System Monitoring</h1>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="all">All Logs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <RecentLogs logs={logs} title="Recent Activity" limit={10} />
        </TabsContent>
        
        <TabsContent value="errors">
          <ErrorLogs logs={logs} />
        </TabsContent>
        
        <TabsContent value="all">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">All System Logs</h2>
            <LogsList logs={logs} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemMonitor;
