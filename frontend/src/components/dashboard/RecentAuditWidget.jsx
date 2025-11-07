import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { Clock, User, ArrowRight, FileText, Loader } from 'lucide-react';

const RecentAuditWidget = () => {
  const [recentChanges, setRecentChanges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentChanges();
  }, []);

  const fetchRecentChanges = async () => {
    try {
      const data = await apiService.getRecentAudits(10);
      setRecentChanges(data.changes || []);
    } catch (error) {
      console.error('Error fetching recent audits:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-8">
          <Loader className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Recent Asset Changes</h3>
        <FileText className="w-5 h-5 text-gray-400" />
      </div>

      {recentChanges.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No recent changes</p>
      ) : (
        <div className="space-y-3">
          {recentChanges.map((change, index) => (
            <div 
              key={change.id || index}
              className="border-l-2 border-blue-500 pl-3 py-2 hover:bg-gray-50 rounded"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-800">
                  {change.asset_name || 'Unknown Asset'}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(change.timestamp).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                <span>{change.old_value || '(Unassigned)'}</span>
                <ArrowRight className="w-3 h-3" />
                <span className="font-medium text-blue-600">{change.new_value}</span>
              </div>
              
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <User className="w-3 h-3" />
                <span>{change.changed_by_email}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentAuditWidget;