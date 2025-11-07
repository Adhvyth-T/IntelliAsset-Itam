export const calculateMetrics = (assets) => {
  const totalAssets = assets.length;
  const totalValue = assets.reduce((sum, asset) => sum + (asset.cost || 0), 0);
  const activeAssets = assets.filter(a => a.status === 'Active').length;
  const maintenanceAssets = assets.filter(a => a.status === 'Maintenance').length;

  return {
    totalAssets,
    totalValue,
    activeAssets,
    maintenanceAssets
  };
};

export const getAssetIcon = (type) => {
  switch (type?.toLowerCase()) {
    case 'laptop': return 'Computer';
    case 'mobile device':
    case 'phone': return 'Smartphone';
    case 'monitor': return 'Monitor';
    case 'server': return 'Server';
    default: return 'Computer';
  }
};

export const getStatusColor = (status) => {
  switch (status) {
    case 'Active': return 'bg-green-100 text-green-800';
    case 'Inactive': return 'bg-red-100 text-red-800';
    case 'Maintenance': return 'bg-yellow-100 text-yellow-800';
    case 'Disposed': return 'bg-gray-100 text-gray-800';
    default: return 'bg-blue-100 text-blue-800';
  }
};

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
};