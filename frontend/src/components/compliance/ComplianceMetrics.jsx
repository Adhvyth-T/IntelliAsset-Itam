import React from 'react';
import { CheckCircle, Clock, XCircle } from 'lucide-react';

const ComplianceMetrics = ({ assets }) => {
  const compliantAssets = assets.filter(a => (a.complianceStatus || 'Compliant') === 'Compliant').length;
  const expiringAssets = assets.filter(a => a.complianceStatus === 'Expiring Soon').length;
  const nonCompliantAssets = assets.filter(a => a.complianceStatus === 'Non-Compliant').length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center">
          <CheckCircle className="w-8 h-8 text-green-600" />
          <div className="ml-4">
            <p className="text-2xl font-bold text-gray-900">{compliantAssets}</p>
            <p className="text-sm text-gray-600">Compliant Assets</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center">
          <Clock className="w-8 h-8 text-yellow-600" />
          <div className="ml-4">
            <p className="text-2xl font-bold text-gray-900">{expiringAssets}</p>
            <p className="text-sm text-gray-600">Expiring Soon</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center">
          <XCircle className="w-8 h-8 text-red-600" />
          <div className="ml-4">
            <p className="text-2xl font-bold text-gray-900">{nonCompliantAssets}</p>
            <p className="text-sm text-gray-600">Non-Compliant</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceMetrics;