// components/dashboard/Dashboard.jsx
import React from 'react';
import MetricsCard from './MetricsCard';
import DepartmentChart from './DepartmentChart';
import CategoryChart from './CategoryChart';
import RecentAuditWidget from './RecentAuditWidget';
import { calculateMetrics } from '../../utils/helpers';

const Dashboard = ({ assets, users }) => {
  const metrics = calculateMetrics(assets);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricsCard
          title="Total Assets"
          value={metrics.totalAssets}
          icon="Computer"
          color="blue"
        />
        <MetricsCard
          title="Active Assets"
          value={metrics.activeAssets}
          icon="CheckCircle"
          color="green"
        />
        <MetricsCard
          title="In Maintenance"
          value={metrics.maintenanceAssets}
          icon="Wrench"
          color="yellow"
        />
        <MetricsCard
          title="Total Value"
          value={`$${metrics.totalValue.toLocaleString()}`}
          icon="TrendingUp"
          color="purple"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DepartmentChart assets={assets} />
        <CategoryChart assets={assets} />
      </div>

      {/* Recent Audit Changes Widget - Full Width */}
      <div className="grid grid-cols-1 gap-6">
        <RecentAuditWidget />
      </div>
    </div>
  );
};

export default Dashboard;