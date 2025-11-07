// components/common/Header.jsx
import React from 'react';
import { RefreshCw } from 'lucide-react';
import UserMenu from './UserMenu'; // Add this import

const Header = ({ loading, onRefresh }) => (
  <header className="bg-white shadow-sm border-b">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-16">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-gray-900">ITAM System</h1>
          {loading && <RefreshCw className="ml-3 w-4 h-4 animate-spin text-blue-500" />}
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={onRefresh}
            className="p-2 text-gray-400 hover:text-gray-600"
            title="Refresh Data"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <UserMenu /> {/* Add this line */}
        </div>
      </div>
    </div>
  </header>
);

export default Header;