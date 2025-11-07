// components/assets/AssetManagement.jsx - Complete update with Edit functionality
import React, { useState } from 'react';
import AssetFilters from './AssetFilters';
import AssetTable from './AssetTable';
import AddAssetModal from './AddAssetModal';
import AssetDetailModal from './AssetDetailModal';
import LiveMetricsModal from './LiveMetricsModal';
import EditAssetModal from './EditAssetModal';  // ADD THIS IMPORT
import { Plus } from 'lucide-react';

const AssetManagement = ({ 
  assets, 
  onAddAsset, 
  onUpdateAsset, 
  onDeleteAsset, 
  setError 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showMetrics, setShowMetrics] = useState(false);
  const [metricsAsset, setMetricsAsset] = useState(null);
  const [editAsset, setEditAsset] = useState(null);  // ADD THIS STATE

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.assignedTo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.department?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || asset.status === filterStatus;
    const matchesCategory = filterCategory === 'All' || asset.category === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleAddAsset = async (assetData) => {
    const result = await onAddAsset(assetData);
    if (result.success) {
      setShowAddAsset(false);
    } else {
      setError(result.error);
    }
  };

  // ADD THIS HANDLER
  const handleEditAsset = async (id, updates) => {
    const result = await onUpdateAsset(id, updates);
    if (result.success) {
      setEditAsset(null);
    } else {
      setError(result.error);
    }
  };

  const handleViewMetrics = (asset) => {
    setMetricsAsset(asset);
    setShowMetrics(true);
  };

  const handleCloseMetrics = () => {
    setShowMetrics(false);
    setMetricsAsset(null);
  };

  return (
    <div className="space-y-6">
      <AssetFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterStatus={filterStatus}
        onStatusChange={setFilterStatus}
        filterCategory={filterCategory}
        onCategoryChange={setFilterCategory}
        onAddAsset={() => setShowAddAsset(true)}
      />

      <AssetTable
        assets={filteredAssets}
        onViewAsset={setSelectedAsset}
        onEditAsset={setEditAsset}      // ADD THIS PROP
        onUpdateAsset={onUpdateAsset}
        onDeleteAsset={onDeleteAsset}
        onViewMetrics={handleViewMetrics}
      />

      {showAddAsset && (
        <AddAssetModal
          onClose={() => setShowAddAsset(false)}
          onSubmit={handleAddAsset}
        />
      )}

      {selectedAsset && (
        <AssetDetailModal
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
        />
      )}

      {showMetrics && (
        <LiveMetricsModal
          isOpen={showMetrics}
          onClose={handleCloseMetrics}
          asset={metricsAsset}
        />
      )}

      {/* ADD EDIT MODAL */}
      {editAsset && (
        <EditAssetModal
          asset={editAsset}
          onClose={() => setEditAsset(null)}
          onSubmit={handleEditAsset}
        />
      )}
    </div>
  );
};

export default AssetManagement;