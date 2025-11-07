import React from 'react';

const DepartmentChart = ({ assets }) => {
  const departmentStats = assets.reduce((acc, asset) => {
    const dept = asset.department || 'Unassigned';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});

  const totalAssets = assets.length;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Assets by Department</h3>
      <div className="space-y-3">
        {Object.entries(departmentStats).map(([dept, count]) => (
          <div key={dept} className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{dept}</span>
            <div className="flex items-center">
              <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
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
        {Object.keys(departmentStats).length === 0 && (
          <div className="text-center text-gray-500 py-4">
            No assets found
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartmentChart;