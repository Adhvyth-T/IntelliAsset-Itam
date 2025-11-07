import React from 'react';
import { 
  Computer, CheckCircle, Wrench, TrendingUp, Users, AlertTriangle 
} from 'lucide-react';

const MetricsCard = ({ title, value, icon, color }) => {
  const icons = {
    Computer,
    CheckCircle,
    Wrench,
    TrendingUp,
    Users,
    AlertTriangle
  };

  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600',
    gray: 'bg-gray-100 text-gray-600'
  };

  const Icon = icons[icon] || Computer;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center">
        <div className={`p-2 rounded-lg ${colors[color] || colors.blue}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default MetricsCard;