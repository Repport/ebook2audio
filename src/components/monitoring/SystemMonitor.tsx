
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogsList, RecentLogs, ErrorLogs } from './logs';
import { useSystemMonitoring } from '@/hooks/useSystemMonitoring';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSystemLogs } from './hooks/useSystemLogs';

const SystemMonitor: React.FC = () => {
  const { logs, isLoading, error } = useSystemMonitoring();
  const { getLogLevel } = useSystemLogs();
  
  const warningLogs = logs.filter(log => getLogLevel(log) === 'warn');
  const infoLogs = logs.filter(log => getLogLevel(log) === 'info' || getLogLevel(log) === 'debug');
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">System Monitoring</h2>
      
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Logs</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="warnings">Warnings</TabsTrigger>
          <TabsTrigger value="info">Info</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4">
          <RecentLogs />
        </TabsContent>
        
        <TabsContent value="errors" className="mt-4">
          <ErrorLogs />
        </TabsContent>
        
        <TabsContent value="warnings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Warning Logs</CardTitle>
              <CardDescription>System warnings and potential issues</CardDescription>
            </CardHeader>
            <CardContent>
              <LogsList logs={warningLogs} isLoading={isLoading} error={error} />
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
              <LogsList logs={infoLogs} isLoading={isLoading} error={error} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemMonitor;
