
import React, { useState, useEffect } from 'react';
import { useConversionStore } from '@/store/conversionStore';

interface DebugLog {
  timestamp: string;
  progress: number;
  processedChunks: number;
  totalChunks: number;
  processedCharacters: number;
  totalCharacters: number;
}

const ConversionDebugPanel: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [expanded, setExpanded] = useState(false);
  
  // Get store data
  const storeState = useConversionStore();
  
  // Load logs from localStorage
  useEffect(() => {
    try {
      const storedLogs = localStorage.getItem('conversionProgressLogs');
      if (storedLogs) {
        setLogs(JSON.parse(storedLogs).map((log: any) => ({
          timestamp: new Date(log.timestamp).toLocaleTimeString(),
          progress: log.progress,
          processedChunks: log.processedChunks,
          totalChunks: log.totalChunks,
          processedCharacters: log.processedCharacters,
          totalCharacters: log.totalCharacters
        })));
      }
    } catch (e) {
      console.error('Error loading debug logs:', e);
    }
    
    // Show debug panel with Alt+D
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'd') {
        setIsVisible(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  // Auto-update logs periodically
  useEffect(() => {
    if (!isVisible) return;
    
    const interval = setInterval(() => {
      try {
        const storedLogs = localStorage.getItem('conversionProgressLogs');
        if (storedLogs) {
          setLogs(JSON.parse(storedLogs).map((log: any) => ({
            timestamp: new Date(log.timestamp).toLocaleTimeString(),
            progress: log.progress,
            processedChunks: log.processedChunks,
            totalChunks: log.totalChunks,
            processedCharacters: log.processedCharacters,
            totalCharacters: log.totalCharacters
          })));
        }
      } catch (e) {
        console.error('Error updating debug logs:', e);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isVisible]);
  
  if (!isVisible) return null;
  
  return (
    <div 
      className="fixed bottom-0 right-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 shadow-lg rounded-tl-lg z-50"
      style={{ 
        width: expanded ? '600px' : '300px',
        maxWidth: '100vw'
      }}
    >
      <div className="flex items-center justify-between p-2 border-b border-gray-300 dark:border-gray-700">
        <h3 className="text-sm font-medium">Conversion Debug Panel</h3>
        <div className="flex gap-2">
          <button 
            onClick={() => setExpanded(prev => !prev)}
            className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded"
          >
            {expanded ? 'Reduce' : 'Expand'}
          </button>
          <button 
            onClick={() => setIsVisible(false)}
            className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded"
          >
            Close
          </button>
        </div>
      </div>
      
      <div className="p-2 text-xs overflow-auto" style={{ maxHeight: '400px' }}>
        <div className="mb-3">
          <h4 className="font-medium mb-1">Current State:</h4>
          <div className="grid grid-cols-2 gap-1">
            <div><strong>Status:</strong> {storeState.status}</div>
            <div><strong>Progress:</strong> {storeState.progress}%</div>
            <div><strong>Chunks:</strong> {storeState.chunks.processed}/{storeState.chunks.total}</div>
            <div><strong>Chars:</strong> {storeState.chunks.processedCharacters}/{storeState.chunks.totalCharacters}</div>
            <div><strong>Time elapsed:</strong> {storeState.time.elapsed}s</div>
            <div><strong>Time remaining:</strong> {storeState.time.remaining ?? 'N/A'}s</div>
          </div>
          
          {storeState.errors.length > 0 && (
            <div className="mt-1">
              <strong>Errors:</strong>
              <ul className="list-disc pl-4">
                {storeState.errors.map((error, i) => (
                  <li key={i} className="text-red-600 dark:text-red-400">{error}</li>
                ))}
              </ul>
            </div>
          )}
          
          {storeState.warnings.length > 0 && (
            <div className="mt-1">
              <strong>Warnings:</strong>
              <ul className="list-disc pl-4">
                {storeState.warnings.map((warning, i) => (
                  <li key={i} className="text-yellow-600 dark:text-yellow-400">{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <h4 className="font-medium mb-1">Progress History:</h4>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="p-1 border border-gray-300 dark:border-gray-600 text-left">Time</th>
                <th className="p-1 border border-gray-300 dark:border-gray-600 text-left">Progress</th>
                <th className="p-1 border border-gray-300 dark:border-gray-600 text-left">Chunks</th>
                <th className="p-1 border border-gray-300 dark:border-gray-600 text-left">Characters</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-1 border border-gray-300 dark:border-gray-600 text-center">
                    No logs available
                  </td>
                </tr>
              ) : (
                logs.map((log, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800' : ''}>
                    <td className="p-1 border border-gray-300 dark:border-gray-600">{log.timestamp}</td>
                    <td className="p-1 border border-gray-300 dark:border-gray-600">{log.progress}%</td>
                    <td className="p-1 border border-gray-300 dark:border-gray-600">
                      {log.processedChunks}/{log.totalChunks}
                    </td>
                    <td className="p-1 border border-gray-300 dark:border-gray-600">
                      {log.processedCharacters}/{log.totalCharacters}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="mt-3 text-center">
          <p className="text-gray-500 dark:text-gray-400">Press Alt+D to toggle this panel</p>
        </div>
      </div>
    </div>
  );
};

export default ConversionDebugPanel;
