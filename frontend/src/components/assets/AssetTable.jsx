// components/assets/AssetTable.jsx - Updated to include onEditAsset prop
import React from 'react';
import AssetRow from './AssetRow';

const AssetTable = ({ 
  assets, 
  onViewAsset, 
  onEditAsset,      // ADD THIS
  onUpdateAsset, 
  onDeleteAsset, 
  onViewMetrics 
}) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Asset
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Assigned To
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Department
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Value
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {assets.length === 0 ? (
            <tr>
              <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                No assets found
              </td>
            </tr>
          ) : (
            assets.map((asset) => (
              <AssetRow
                key={asset._id || asset.id}
                asset={asset}
                onView={onViewAsset}
                onEdit={onEditAsset}        // ADD THIS
                onUpdate={onUpdateAsset}
                onDelete={onDeleteAsset}
                onViewMetrics={onViewMetrics}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AssetTable;