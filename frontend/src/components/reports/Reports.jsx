import React, { useState } from 'react';
import Select from '../common/Select';
import UtilizationReport from './UtilizationReport';
import CostReport from './CostReport';
import ComplianceReport from './ComplianceReport';
import AgingReport from './AgingReport';
import { REPORT_TYPES } from '../../utils/constants';

const Reports = ({ assets }) => {
  const [reportType, setReportType] = useState('utilization');

  const renderReport = () => {
    switch (reportType) {
      case 'utilization':
        return <UtilizationReport assets={assets} />;
      case 'cost':
        return <CostReport assets={assets} />;
      case 'compliance':
        return <ComplianceReport assets={assets} />;
      case 'aging':
        return <AgingReport assets={assets} />;
      default:
        return <UtilizationReport assets={assets} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Reports & Analytics</h2>
        <Select
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
          options={REPORT_TYPES}
          className="min-w-[200px]"
        />
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        {renderReport()}
      </div>
    </div>
  );
};

export default Reports;