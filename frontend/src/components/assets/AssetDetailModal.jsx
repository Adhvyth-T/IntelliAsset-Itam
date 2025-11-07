// components/assets/AssetDetailModal.jsx
import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import AuditTrail from './AuditTrail';
import { getStatusColor, formatDate } from '../../utils/helpers';

const AssetDetailModal = ({ asset, onClose, onEdit }) => {
  const [activeTab, setActiveTab] = useState('details');

  if (!asset) return null;

  const handleEdit = () => {
    if (onEdit) {
      onEdit(asset);
    } else {
      console.log('Edit functionality not implemented yet');
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Asset Details" size="large">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('details')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'details'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'audit'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Audit Trail
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 border-b pb-2">Basic Information</h4>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Name:</span>
                    <div className="text-sm text-gray-900 mt-1">{asset.name}</div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Type:</span>
                    <div className="text-sm text-gray-900 mt-1">{asset.type}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Category:</span>
                    <div className="text-sm text-gray-900 mt-1">{asset.category}</div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Status:</span>
                    <div className="mt-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(asset.status)}`}>
                        {asset.status}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Serial Number:</span>
                    <div className="text-sm text-gray-900 mt-1">{asset.serialNumber || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Vendor:</span>
                    <div className="text-sm text-gray-900 mt-1">{asset.vendor || 'N/A'}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 border-b pb-2">Assignment & Location</h4>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Assigned To:</span>
                    <div className="text-sm text-gray-900 mt-1">{asset.assignedTo || 'Unassigned'}</div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Department:</span>
                    <div className="text-sm text-gray-900 mt-1">{asset.department || 'N/A'}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Location:</span>
                    <div className="text-sm text-gray-900 mt-1">{asset.location || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Purchase Date:</span>
                    <div className="text-sm text-gray-900 mt-1">{formatDate(asset.purchaseDate)}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Cost:</span>
                    <div className="text-sm text-gray-900 mt-1 font-semibold">
                      ${asset.cost?.toLocaleString() || '0'}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Warranty Expires:</span>
                    <div className="text-sm text-gray-900 mt-1">{formatDate(asset.warranty)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Additional Information Section */}
          <div className="mt-6 space-y-4">
            {/* Lifecycle and Compliance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 border-b pb-2 mb-3">Lifecycle & Compliance</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Lifecycle Stage:</span>
                    <span className="text-sm text-gray-900">{asset.lifecycle || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Compliance Status:</span>
                    <span className={`text-sm font-medium ${
                      (asset.complianceStatus || 'Compliant') === 'Compliant' ? 'text-green-600' :
                      asset.complianceStatus === 'Expiring Soon' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {asset.complianceStatus || 'Compliant'}
                    </span>
                  </div>
                  {asset.maintenanceSchedule && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Next Maintenance:</span>
                      <span className="text-sm text-gray-900">{formatDate(asset.maintenanceSchedule)}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Asset Metrics */}
              <div>
                <h4 className="font-medium text-gray-900 border-b pb-2 mb-3">Asset Metrics</h4>
                <div className="space-y-2">
                  {asset.purchaseDate && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Age:</span>
                      <span className="text-sm text-gray-900">
                        {((new Date() - new Date(asset.purchaseDate)) / (1000 * 60 * 60 * 24 * 365)).toFixed(1)} years
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Asset ID:</span>
                    <span className="text-sm text-gray-900 font-mono">{asset._id || asset.id || 'N/A'}</span>
                  </div>
                  {asset.utilization && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Utilization:</span>
                      <span className="text-sm text-gray-900">{asset.utilization}%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Tags Section */}
            {asset.tags && asset.tags.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 border-b pb-2 mb-3">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {asset.tags.map((tag, index) => (
                    <span 
                      key={index} 
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full border"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Notes Section */}
            {asset.notes && (
              <div>
                <h4 className="font-medium text-gray-900 border-b pb-2 mb-3">Notes</h4>
                <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                  {asset.notes}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Audit Trail Tab */}
      {activeTab === 'audit' && (
        <div className="max-h-[600px] overflow-y-auto">
          <AuditTrail asset={asset} />
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
        <Button
          onClick={onClose}
          variant="secondary"
        >
          Close
        </Button>
        {activeTab === 'details' && (
          <Button
            onClick={handleEdit}
            variant="primary"
          >
            Edit Asset
          </Button>
        )}
      </div>
    </Modal>
  );
};

export default AssetDetailModal;