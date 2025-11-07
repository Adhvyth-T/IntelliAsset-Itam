import React from 'react';
import ComplianceMetrics from './ComplianceMetrics';
import ComplianceTable from './ComplianceTable';

const Compliance = ({ assets }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Compliance Management</h2>
      </div>

      <ComplianceMetrics assets={assets} />
      <ComplianceTable assets={assets} />
    </div>
  );
};

export default Compliance;