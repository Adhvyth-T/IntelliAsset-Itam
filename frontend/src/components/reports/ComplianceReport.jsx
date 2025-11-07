import React from 'react';

const ComplianceReport = ({ assets }) => {
  const compliantAssets = assets.filter(a => (a.complianceStatus || 'Compliant') === 'Compliant').length;
  const expiringAssets = assets.filter(a => a.complianceStatus === 'Expiring Soon').length;
  const nonCompliantAssets = assets.filter(a => a.complianceStatus === 'Non-Compliant').length;
  const totalAssets = assets.length;

  const upcomingExpirations = assets
    .filter(a => a.warranty && new Date(a.warranty) > new Date())
    .sort((a, b) => new Date(a.warranty) - new Date(b.warranty))
    .slice(0, 5);

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Compliance Status Report</h3>
      
      <div className="grid grid-cols-3 gap-4 text-center mb-6">
        <div className="p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{compliantAssets}</div>
          <div className="text-sm text-gray-600">Compliant Assets</div>
          <div className="text-xs text-gray-500 mt-1">
            {totalAssets > 0 ? ((compliantAssets / totalAssets) * 100).toFixed(1) : 0}%
          </div>
        </div>
        
        <div className="p-4 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{expiringAssets}</div>
          <div className="text-sm text-gray-600">Expiring Soon</div>
          <div className="text-xs text-gray-500 mt-1">
            Requires attention
          </div>
        </div>
        
        <div className="p-4 bg-red-50 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{nonCompliantAssets}</div>
          <div className="text-sm text-gray-600">Non-Compliant</div>
          <div className="text-xs text-gray-500 mt-1">
            Immediate action needed
          </div>
        </div>
      </div>
      
      {upcomingExpirations.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Upcoming Warranty Expirations</h4>
          <div className="space-y-2">
            {upcomingExpirations.map(asset => (
              <div key={asset._id || asset.id} className="flex justify-between items-center p-3 bg-yellow-50 rounded">
                <div>
                  <div className="font-medium">{asset.name}</div>
                  <div className="text-sm text-gray-600">{asset.type}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-yellow-800">
                    {new Date(asset.warranty).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-600">
                    {Math.ceil((new Date(asset.warranty) - new Date()) / (1000 * 60 * 60 * 24))} days
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceReport;