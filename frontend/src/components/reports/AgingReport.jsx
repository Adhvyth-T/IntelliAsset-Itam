import React from 'react';
import { formatDate } from '../../utils/helpers';

const AgingReport = ({ assets }) => {
  const assetsWithAge = assets
    .map(asset => {
      const ageInYears = asset.purchaseDate ? 
        ((new Date() - new Date(asset.purchaseDate)) / (1000 * 60 * 60 * 24 * 365)).toFixed(1) : 0;
      return { ...asset, ageInYears: parseFloat(ageInYears) };
    })
    .sort((a, b) => b.ageInYears - a.ageInYears);

  const ageGroups = {
    'New (0-1 years)': assetsWithAge.filter(a => a.ageInYears <= 1).length,
    'Recent (1-3 years)': assetsWithAge.filter(a => a.ageInYears > 1 && a.ageInYears <= 3).length,
    'Mature (3-5 years)': assetsWithAge.filter(a => a.ageInYears > 3 && a.ageInYears <= 5).length,
    'Legacy (5+ years)': assetsWithAge.filter(a => a.ageInYears > 5).length
  };

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Asset Aging Report</h3>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Object.entries(ageGroups).map(([group, count]) => (
          <div key={group} className="p-3 bg-gray-50 rounded-lg text-center">
            <div className="text-xl font-bold text-gray-900">{count}</div>
            <div className="text-sm text-gray-600">{group}</div>
          </div>
        ))}
      </div>
      
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Asset Age Details</h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {assetsWithAge.slice(0, 10).map(asset => (
            <div key={asset._id || asset.id} className="flex justify-between items-center py-2 border-b border-gray-200">
              <div>
                <div className="font-medium">{asset.name}</div>
                <div className="text-sm text-gray-500">{asset.type}</div>
              </div>
              <div className="text-right">
                <div className="font-medium">
                  {asset.ageInYears > 0 ? `${asset.ageInYears} years` : 'New'}
                </div>
                <div className="text-sm text-gray-500">
                  {formatDate(asset.purchaseDate)}
                </div>
              </div>
            </div>
          ))}
          {assetsWithAge.length > 10 && (
            <div className="text-center py-2 text-sm text-gray-500">
              ... and {assetsWithAge.length - 10} more assets
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgingReport;