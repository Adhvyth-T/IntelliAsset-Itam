import React from 'react';
import { Computer, Smartphone, Monitor, Server } from 'lucide-react';
import { formatDate } from '../../utils/helpers';

const ComplianceTable = ({ assets }) => {
  const getAssetIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'laptop': return <Computer className="w-5 h-5" />;
      case 'mobile device':
      case 'phone': return <Smartphone className="w-5 h-5" />;
      case 'monitor': return <Monitor className="w-5 h-5" />;
      case 'server': return <Server className="w-5 h-5" />;
      default: return <Computer className="w-5 h-5" />;
    }
  };

  const handleUpdateStatus = (assetId) => {
    // TODO: Implement status update
    console.log('Update compliance status for asset:', assetId);
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Compliance Status by Asset</h3>
      </div>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Asset
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Compliance Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Warranty Expiry
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {assets.length === 0 ? (
            <tr>
              <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                No assets found
              </td>
            </tr>
          ) : (
            assets.map((asset) => (
              <tr key={asset._id || asset.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getAssetIcon(asset.type)}
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{asset.name}</div>
                      <div className="text-sm text-gray-500">{asset.type}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    (asset.complianceStatus || 'Compliant') === 'Compliant' 
                      ? 'bg-green-100 text-green-800'
                      : asset.complianceStatus === 'Expiring Soon'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {asset.complianceStatus || 'Compliant'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(asset.warranty)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button 
                    onClick={() => handleUpdateStatus(asset._id || asset.id)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Update Status
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ComplianceTable;
