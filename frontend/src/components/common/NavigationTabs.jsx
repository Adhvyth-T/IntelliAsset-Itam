import React from 'react';
import { BarChart3, Computer, Users, FileText, Shield, Camera,ShoppingCart } from 'lucide-react';
const NavigationTabs = ({ activeTab, onTabChange }) => {
const tabs = [
  { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
  { id: 'assets', name: 'Assets', icon: Computer },
  { id: 'scanner', name: 'Scanner', icon: Camera },  
   { id: 'procurement', name: 'Procurement', icon: ShoppingCart },
  { id: 'users', name: 'Users', icon: Users },
  { id: 'reports', name: 'Reports', icon: FileText },
  { id: 'compliance', name: 'Compliance', icon: Shield }
];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default NavigationTabs;