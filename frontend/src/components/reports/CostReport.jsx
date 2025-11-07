import React from 'react';
import { calculateMetrics } from '../../utils/helpers';

const CostReport = ({ assets }) => {
  const { totalAssets, totalValue } = calculateMetrics(assets);
  
  const averageValue = totalAssets > 0 ? totalValue / totalAssets : 0;
  
  const categoryBreakdown = assets.reduce((acc, asset) => {
    const category = asset.category || 'Other';
    if (!acc[category]) {
      acc[category] = { count: 0, value: 0 };
    }
    acc[category].count += 1;
    acc[category].value += asset.cost || 0;
    return acc;
  }, {});

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Cost Analysis Report</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            ${totalValue.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Total Asset Value</div>
          <div className="text-xs text-gray-500 mt-1">
            Across {totalAssets} assets
          </div>
        </div>
        
        <div className="p-4 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            ${averageValue.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Average Asset Value</div>
          <div className="text-xs text-gray-500 mt-1">
            Per asset calculation
          </div>
        </div>
      </div>
      
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Cost Breakdown by Category</h4>
        <div className="space-y-2">
          {Object.entries(categoryBreakdown).map(([category, data]) => (
            <div key={category} className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <div className="font-medium">{category}</div>
                <div className="text-sm text-gray-600">{data.count} assets</div>
              </div>
              <div className="text-right">
                <div className="font-semibold">${data.value.toLocaleString()}</div>
                <div className="text-sm text-gray-600">
                  {totalValue > 0 ? ((data.value / totalValue) * 100).toFixed(1) : 0}% of total
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CostReport;