// components/assets/LiveMetricsModal.jsx
import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { Activity, Cpu, HardDrive, Wifi, Clock, Server } from 'lucide-react';

const LiveMetricsModal = ({ isOpen, onClose, asset }) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [agentStatus, setAgentStatus] = useState(null);

  const fetchMetrics = async () => {
    if (!asset || !asset.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/assets/${asset.id}/agent-status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
        
      }
      
      const data = await response.json();
      console.log('Received data:', data);
      console.log('Metrics:', data.metrics);
      setAgentStatus(data);
      setMetrics(data.metrics);
      
      if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      setError(`Failed to fetch metrics: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && asset) {
      fetchMetrics();
      // Auto-refresh every 30 seconds when modal is open
      const interval = setInterval(fetchMetrics, 30000);
      return () => clearInterval(interval);
    }
  }, [isOpen, asset]);

  const formatUptime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const now = Date.now() / 1000;
    const uptime = now - timestamp;
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getPerformanceColor = (percentage) => {
    if (percentage > 80) return 'text-red-600';
    if (percentage > 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (!asset) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Live Device Metrics" size="large">
      <div className="space-y-6">
        {/* Asset Info Header */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900">{asset.name}</h3>
          <p className="text-sm text-gray-600">Serial: {asset.serialNumber || 'N/A'}</p>
          <p className="text-sm text-gray-600">Type: {asset.type} | Category: {asset.category}</p>
        </div>

        {/* Agent Status */}
        <div className="flex items-center justify-between p-4 bg-white border rounded-lg">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${agentStatus?.is_online ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="font-medium">
              Agent Status: {agentStatus?.is_online ? 'Online' : 'Offline'}
            </span>
          </div>
          <Button
            onClick={fetchMetrics}
            disabled={loading}
            size="small"
            icon={Activity}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-gray-600">Loading metrics...</p>
          </div>
        )}

        {/* Live Metrics */}
        {metrics && (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center">
              <Server className="w-5 h-5 mr-2" />
              Live Metrics
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* System Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h5 className="font-semibold text-blue-900 mb-3 flex items-center">
                  <Cpu className="w-4 h-4 mr-2" />
                  System Information
                </h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hostname:</span>
                    <span className="font-medium">{metrics.hostname}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Platform:</span>
                    <span className="font-medium">{metrics.platform}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Device Type:</span>
                    <span className="font-medium">{metrics.device_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">CPU Model:</span>
                    <span className="font-medium text-xs">{metrics.cpu_model}</span>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h5 className="font-semibold text-green-900 mb-3 flex items-center">
                  <Activity className="w-4 h-4 mr-2" />
                  Performance
                </h5>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">CPU Usage:</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${(metrics.cpu_usage || 0) > 80 ? 'bg-red-500' : (metrics.cpu_usage || 0) > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${metrics.cpu_usage || 0}%` }}
                        ></div>
                      </div>
                      <span className={`font-semibold ${getPerformanceColor(metrics.cpu_usage || 0)}`}>
                        {metrics.cpu_usage !== undefined ? `${Math.round(metrics.cpu_usage)}%` : 'N/A'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Memory Usage:</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${(metrics.memory_usage || 0) > 80 ? 'bg-red-500' : (metrics.memory_usage || 0) > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${metrics.memory_usage || 0}%` }}
                        ></div>
                      </div>
                      <span className={`font-semibold ${getPerformanceColor(metrics.memory_usage || 0)}`}>
                        {metrics.memory_usage !== undefined ? `${Math.round(metrics.memory_usage)}%` : 'N/A'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Disk Usage:</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${(metrics.disk_usage || 0) > 80 ? 'bg-red-500' : (metrics.disk_usage || 0) > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${metrics.disk_usage || 0}%` }}
                        ></div>
                      </div>
                      <span className={`font-semibold ${getPerformanceColor(metrics.disk_usage || 0)}`}>
                        {metrics.disk_usage !== undefined ? `${Math.round(metrics.disk_usage)}%` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Network Info */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h5 className="font-semibold text-yellow-900 mb-3 flex items-center">
                  <Wifi className="w-4 h-4 mr-2" />
                  Network
                </h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">IP Address:</span>
                    <span className="font-medium">{metrics.ip_address || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Serial Number:</span>
                    <span className="font-medium font-mono text-xs">{metrics.serial_number || asset.serialNumber || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Timestamp & Uptime */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  System Status
                </h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="font-medium">{new Date().toLocaleTimeString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Uptime:</span>
                    <span className="font-medium">{formatUptime(metrics.uptime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="text-green-600 font-semibold">Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && !metrics && agentStatus && !agentStatus.is_online && (
          <div className="text-center py-8">
            <HardDrive className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Agent Offline</h3>
            <p className="mt-1 text-sm text-gray-500">
              The device agent is not currently running or reachable.
            </p>
            <p className="mt-2 text-xs text-gray-400">
              Make sure the agent is running on the device and can communicate with the server.
            </p>
          </div>
        )}

        {/* Auto-refresh indicator */}
        {agentStatus?.is_online && (
          <div className="text-center text-xs text-gray-500">
            Auto-refreshing every 30 seconds
          </div>
        )}

        {/* Close Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default LiveMetricsModal;