import React from 'react';
import { Computer, Smartphone, Monitor, Server, Eye, Edit, Trash2, Activity } from 'lucide-react';
import { getStatusColor } from '../../utils/helpers';

const AssetRow = ({ asset, onView,onEdit, onUpdate, onDelete, onViewMetrics }) => {
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

  const handleStatusToggle = async () => {
    const newStatus = asset.status === 'Active' ? 'Maintenance' : 'Active';
    await onUpdate(asset._id || asset.id, { status: newStatus });
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      await onDelete(asset._id || asset.id);
    }
  };

  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          {getAssetIcon(asset.type)}
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{asset.name}</div>
            <div className="text-sm text-gray-500">
              {asset.type} • {asset.serialNumber || 'N/A'}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(asset.status)}`}>
          {asset.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {asset.assignedTo || 'Unassigned'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {asset.department || 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        ${asset.cost?.toLocaleString() || '0'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex items-center space-x-2">
          {/* Live Metrics Button - only show if asset has serial number */}
          {asset.serialNumber && asset.serialNumber !== 'N/A' && onViewMetrics && (
            <button
              onClick={() => onViewMetrics(asset)}
              className="text-green-600 hover:text-green-900"
              title="Live Metrics"
            >
              <Activity className="w-4 h-4" />
            </button>
          )}
          
          <button
            onClick={() => onView(asset)}
            className="text-blue-600 hover:text-blue-900"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={handleStatusToggle}
            className="text-yellow-600 hover:text-yellow-900"
            title="Toggle Status"
          >
            <Edit className="w-4 h-4" />
          </button>
          {/* Edit Button - NEW */}
          <button
            onClick={() => onEdit(asset)}
            className="text-yellow-600 hover:text-yellow-900 transition-colors"
            title="Edit Asset"
          >
            <Edit className="w-5 h-5" />
          </button>
          <button
            onClick={handleDelete}
            className="text-red-600 hover:text-red-900"
            title="Delete Asset"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default AssetRow;