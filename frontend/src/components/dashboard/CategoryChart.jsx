import React from 'react';

const CategoryChart = ({ assets }) => {
  const categoryStats = assets.reduce((acc, asset) => {
    const category = asset.category || 'Other';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  const totalAssets = assets.length;

  const colors = {
    'Hardware': 'bg-green-600',
    'Software': 'bg-blue-600',
    'License': 'bg-purple-600',
    'Other': 'bg-gray-600'
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Assets by Category</h3>
      <div className="space-y-3">
        {Object.entries(categoryStats).map(([category, count]) => (
          <div key={category} className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{category}</span>
            <div className="flex items-center">
              <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                <div 
                  className={`h-2 rounded-full ${colors[category] || 'bg-gray-600'}`}
                  style={{ 
                    width: `${totalAssets > 0 ? (count / totalAssets) * 100 : 0}%` 
                  }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900 w-8 text-right">
                {count}
              </span>
            </div>
          </div>
        ))}
        {Object.keys(categoryStats).length === 0 && (
          <div className="text-center text-gray-500 py-4">
            No assets found
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryChart;