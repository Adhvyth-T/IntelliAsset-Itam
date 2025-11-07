// ProcurementManagement.jsx
import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { 
  Plus, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock,
  Package,
  ShoppingCart,
  AlertCircle
} from 'lucide-react';
import CreateRequestModal from './CreateRequestModal';
import RequestDetailModal from './RequestDetailModal';
import ApprovalModal from './ApprovalModal';
import FulfillmentModal from './FulfillmentModal';

const ProcurementManagement = ({ setError }) => {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showFulfillmentModal, setShowFulfillmentModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [statistics, setStatistics] = useState(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [viewMode, setViewMode] = useState('my'); // 'my', 'all', 'pending'
  
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isManagerOrAdmin = ['Admin', 'Manager'].includes(currentUser.role);
  const isITSupport = ['Admin', 'IT Support'].includes(currentUser.role);

  useEffect(() => {
    fetchRequests();
    fetchStatistics();
  }, [viewMode]);

  useEffect(() => {
    applyFilters();
  }, [requests, statusFilter, priorityFilter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      let data;
      if (viewMode === 'my') {
        data = await apiService.getMyProcurementRequests();
      } else if (viewMode === 'pending' && isManagerOrAdmin) {
        data = await apiService.getPendingApprovalRequests();
      } else {
        data = await apiService.getProcurementRequests();
      }
      setRequests(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const stats = await apiService.getProcurementStatistics();
      setStatistics(stats);
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
    }
  };

  const applyFilters = () => {
    let filtered = [...requests];
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }
    
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(req => req.priority === priorityFilter);
    }
    
    setFilteredRequests(filtered);
  };

  const handleCreateRequest = () => {
    setShowCreateModal(true);
  };

  const handleRequestCreated = () => {
    setShowCreateModal(false);
    fetchRequests();
    fetchStatistics();
  };

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  const handleApprove = (request) => {
    setSelectedRequest(request);
    setShowApprovalModal(true);
  };

  const handleFulfill = (request) => {
    setSelectedRequest(request);
    setShowFulfillmentModal(true);
  };

  const handleActionComplete = () => {
    setShowDetailModal(false);
    setShowApprovalModal(false);
    setShowFulfillmentModal(false);
    fetchRequests();
    fetchStatistics();
  };

  const getStatusColor = (status) => {
    const colors = {
      Pending: 'bg-yellow-100 text-yellow-800',
      Approved: 'bg-green-100 text-green-800',
      Rejected: 'bg-red-100 text-red-800',
      Ordered: 'bg-blue-100 text-blue-800',
      Fulfilled: 'bg-purple-100 text-purple-800',
      Cancelled: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      Critical: 'text-red-600',
      High: 'text-orange-600',
      Medium: 'text-yellow-600',
      Low: 'text-green-600'
    };
    return colors[priority] || 'text-gray-600';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending':
        return <Clock className="w-4 h-4" />;
      case 'Approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'Rejected':
        return <XCircle className="w-4 h-4" />;
      case 'Ordered':
        return <ShoppingCart className="w-4 h-4" />;
      case 'Fulfilled':
        return <Package className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Procurement Requests</h1>
          <p className="text-gray-600">Manage asset procurement requests and approvals</p>
        </div>
        <button
          onClick={handleCreateRequest}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>New Request</span>
        </button>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Requests</div>
            <div className="text-2xl font-bold">{statistics.total_requests}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Pending</div>
            <div className="text-2xl font-bold text-yellow-600">
              {statistics.by_status?.find(s => s._id === 'Pending')?.count || 0}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Approved</div>
            <div className="text-2xl font-bold text-green-600">
              {statistics.by_status?.find(s => s._id === 'Approved')?.count || 0}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Estimated Cost</div>
            <div className="text-2xl font-bold text-blue-600">
              ${statistics.total_estimated_cost?.toLocaleString() || 0}
            </div>
          </div>
        </div>
      )}

      {/* View Mode Tabs */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex space-x-4 mb-4">
          <button
            onClick={() => setViewMode('my')}
            className={`px-4 py-2 rounded-lg ${
              viewMode === 'my'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            My Requests
          </button>
          {isManagerOrAdmin && (
            <>
              <button
                onClick={() => setViewMode('pending')}
                className={`px-4 py-2 rounded-lg ${
                  viewMode === 'pending'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pending Approval
              </button>
              <button
                onClick={() => setViewMode('all')}
                className={`px-4 py-2 rounded-lg ${
                  viewMode === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Requests
              </button>
            </>
          )}
        </div>

        {/* Filters */}
        <div className="flex space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Ordered">Ordered</option>
              <option value="Fulfilled">Fulfilled</option>
            </select>
          </div>
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Priority</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-600">Loading requests...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-8 text-center text-gray-600">No procurement requests found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Asset
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Requestor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{request.asset_name}</div>
                      <div className="text-sm text-gray-500">
                        {request.asset_type} × {request.quantity}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{request.requestor_name}</div>
                      <div className="text-sm text-gray-500">{request.department}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-medium ${getPriorityColor(request.priority)}`}>
                        {request.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        <span>{request.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {request.estimated_cost ? `$${request.estimated_cost.toLocaleString()}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(request.requested_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <button
                        onClick={() => handleViewRequest(request)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View
                      </button>
                      {isManagerOrAdmin && request.status === 'Pending' && (
                        <button
                          onClick={() => handleApprove(request)}
                          className="text-green-600 hover:text-green-800"
                        >
                          Approve
                        </button>
                      )}
                      {isITSupport && ['Approved', 'Ordered'].includes(request.status) && (
                        <button
                          onClick={() => handleFulfill(request)}
                          className="text-purple-600 hover:text-purple-800"
                        >
                          Fulfill
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateRequestModal
          onClose={() => setShowCreateModal(false)}
          onRequestCreated={handleRequestCreated}
          setError={setError}
        />
      )}

      {showDetailModal && selectedRequest && (
        <RequestDetailModal
          request={selectedRequest}
          onClose={() => setShowDetailModal(false)}
          onUpdate={handleActionComplete}
          setError={setError}
        />
      )}

      {showApprovalModal && selectedRequest && (
        <ApprovalModal
          request={selectedRequest}
          onClose={() => setShowApprovalModal(false)}
          onApprovalComplete={handleActionComplete}
          setError={setError}
        />
      )}

      {showFulfillmentModal && selectedRequest && (
        <FulfillmentModal
          request={selectedRequest}
          onClose={() => setShowFulfillmentModal(false)}
          onFulfillmentComplete={handleActionComplete}
          setError={setError}
        />
      )}
    </div>
  );
};

export default ProcurementManagement;