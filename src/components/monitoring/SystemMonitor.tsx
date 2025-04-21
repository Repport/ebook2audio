
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogsList, RecentLogs, ErrorLogs } from './logs';
import { useMonitoringData } from './hooks/useMonitoringData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSystemLogs } from './hooks/useSystemLogs';

const SystemMonitor = () => {
  const { 
    activeTab, 
    setActiveTab, 
    isLoading, 
    logs, 
    errorLogs 
  } = useMonitoringData();
  
  const { getLogLevel } = useSystemLogs();

  // Filter logs by type
  const warningLogs = logs.filter(log => getLogLevel(log) === 'warning');
  const infoLogs = logs.filter(log => getLogLevel(log) === 'info' || getLogLevel(log) === 'debug');

  // Create proper error object
  const error = null; // We'll just use null for now since we're handling errors in useMonitoringData

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">System Monitoring</h2>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">All Logs</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="warnings">Warnings</TabsTrigger>
          <TabsTrigger value="info">Info</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-4">
          <RecentLogs 
            logs={logs} 
            isLoading={isLoading} 
            error={error}
          />
        </TabsContent>
        
        <TabsContent value="errors" className="mt-4">
          <ErrorLogs 
            logs={errorLogs} 
            isLoading={isLoading} 
            error={error}
          />
        </TabsContent>
        
        <TabsContent value="warnings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Warning Logs</CardTitle>
              <CardDescription>System warnings and potential issues</CardDescription>
            </CardHeader>
            <CardContent>
              <LogsList 
                logs={warningLogs} 
                isLoading={isLoading} 
                error={error}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="info" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Info Logs</CardTitle>
              <CardDescription>General system information and debug messages</CardDescription>
            </CardHeader>
            <CardContent>
              <LogsList 
                logs={infoLogs} 
                isLoading={isLoading} 
                error={error}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemMonitor;
