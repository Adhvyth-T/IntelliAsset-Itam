import React from 'react';
import { calculateMetrics } from '../../utils/helpers';

const UtilizationReport = ({ assets }) => {
  const { totalAssets, activeAssets, maintenanceAssets } = calculateMetrics(assets);
  
  const inactiveDisposedAssets = totalAssets - activeAssets - maintenanceAssets;

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Asset Utilization Report</h3>
      
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {totalAssets > 0 ? ((activeAssets/totalAssets)*100).toFixed(1) : 0}%
          </div>
          <div className="text-sm text-gray-600">Active Utilization</div>
          <div className="text-xs text-gray-500 mt-1">
            {activeAssets} of {totalAssets} assets
          </div>
        </div>
        
        <div className="p-4 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">
            {totalAssets > 0 ? ((maintenanceAssets/totalAssets)*100).toFixed(1) : 0}%
          </div>
          <div className="text-sm text-gray-600">In Maintenance</div>
          <div className="text-xs text-gray-500 mt-1">
            {maintenanceAssets} assets
          </div>
        </div>
        
        <div className="p-4 bg-red-50 rounded-lg">
          <div className="text-2xl font-bold text-red-600">
            {totalAssets > 0 ? ((inactiveDisposedAssets/totalAssets)*100).toFixed(1) : 0}%
          </div>
          <div className="text-sm text-gray-600">Inactive/Disposed</div>
          <div className="text-xs text-gray-500 mt-1">
            {inactiveDisposedAssets} assets
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <h4 className="font-medium text-gray-900 mb-3">Utilization Trends</h4>
        <div className="text-sm text-gray-600">
          <p>• Active assets represent the primary operational capacity</p>
          <p>• Maintenance assets indicate ongoing support requirements</p>
          <p>• Inactive/Disposed assets may represent optimization opportunities</p>
        </div>
      </div>
    </div>
  );
};

export default UtilizationReport;