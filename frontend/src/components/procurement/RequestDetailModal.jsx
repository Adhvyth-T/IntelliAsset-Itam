import React, { useState } from 'react';
import { X, Edit, Trash2, Loader } from 'lucide-react';
import { apiService } from '../../services/api';

const RequestDetailModal = ({ request, onClose, onUpdate, setError, currentUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    asset_name: request.asset_name,
    asset_type: request.asset_type,
    category: request.category,
    quantity: request.quantity,
    estimated_cost: request.estimated_cost || '',
    priority: request.priority,
    justification: request.justification,
    specifications: request.specifications || '',
    department: request.department || '',
    required_by_date: request.required_by_date || '',
    vendor_preference: request.vendor_preference || ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canEdit = currentUser?.id === request.requestor_id && request.status === 'Pending';
  const canDelete = (currentUser?.id === request.requestor_id || currentUser?.role === 'Admin') && request.status === 'Pending';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const updateData = {
        ...formData,
        estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : null
      };
      await apiService.updateProcurementRequest(request.id, updateData);
      onUpdate();
    } catch (error) {
      setError(error.message || 'Failed to update request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this request?')) {
      return;
    }

    setDeleting(true);
    try {
      await apiService.deleteProcurementRequest(request.id);
      onUpdate();
    } catch (error) {
      setError(error.message || 'Failed to delete request');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'text-yellow-600',
      'Approved': 'text-green-600',
      'Rejected': 'text-red-600',
      'Ordered': 'text-blue-600',
      'Fulfilled': 'text-purple-600',
      'Cancelled': 'text-gray-600'
    };
    return colors[status] || 'text-gray-600';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Request Details</h2>
            <p className="text-sm text-gray-500 mt-1">Request ID: {request.id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status and Priority */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-gray-500">Status: </span>
              <span className={`text-lg font-semibold ${getStatusColor(request.status)}`}>
                {request.status}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-500">Priority: </span>
              <span className="text-lg font-semibold text-gray-900">{request.priority}</span>
            </div>
          </div>

          {/* Requestor Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Requestor Information</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Name:</span>
                <span className="ml-2 text-gray-900">{request.requestor_name}</span>
              </div>
              <div>
                <span className="text-gray-500">Email:</span>
                <span className="ml-2 text-gray-900">{request.requestor_email}</span>
              </div>
              <div>
                <span className="text-gray-500">Department:</span>
                <span className="ml-2 text-gray-900">{request.department || '-'}</span>
              </div>
              <div>
                <span className="text-gray-500">Requested:</span>
                <span className="ml-2 text-gray-900">{formatDate(request.requested_date)}</span>
              </div>
            </div>
          </div>

          {/* Asset Information */}
          {isEditing ? (
            <form onSubmit={handleUpdate} className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Edit Request</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Asset Name *</label>
                  <input
                    type="text"
                    name="asset_name"
                    value={formData.asset_name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Asset Type *</label>
                  <input
                    type="text"
                    name="asset_type"
                    value={formData.asset_type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    min="1"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Est. Cost ($)</label>
                  <input
                    type="number"
                    name="estimated_cost"
                    value={formData.estimated_cost}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Required By</label>
                  <input
                    type="date"
                    name="required_by_date"
                    value={formData.required_by_date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Justification *</label>
                <textarea
                  name="justification"
                  value={formData.justification}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specifications</label>
                <textarea
                  name="specifications"
                  value={formData.specifications}
                  onChange={handleChange}
                  rows="2"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center space-x-2"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Asset Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Asset Name:</span>
                    <p className="text-gray-900 font-medium mt-1">{request.asset_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Type:</span>
                    <p className="text-gray-900 font-medium mt-1">{request.asset_type}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Category:</span>
                    <p className="text-gray-900 font-medium mt-1">{request.category}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Quantity:</span>
                    <p className="text-gray-900 font-medium mt-1">{request.quantity}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Estimated Cost:</span>
                    <p className="text-gray-900 font-medium mt-1">
                      {request.estimated_cost ? `$${request.estimated_cost.toLocaleString()}` : '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Required By:</span>
                    <p className="text-gray-900 font-medium mt-1">
                      {request.required_by_date || '-'}
                    </p>
                  </div>
                  {request.vendor_preference && (
                    <div className="col-span-2">
                      <span className="text-gray-500">Preferred Vendor:</span>
                      <p className="text-gray-900 font-medium mt-1">{request.vendor_preference}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Business Justification</h3>
                <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">
                  {request.justification}
                </p>
              </div>

              {request.specifications && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Technical Specifications</h3>
                  <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">
                    {request.specifications}
                  </p>
                </div>
              )}

              {/* Approval Info */}
              {(request.approver_name || request.rejection_comments) && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Approval Information</h3>
                  <div className="space-y-2 text-sm">
                    {request.approver_name && (
                      <div>
                        <span className="text-gray-500">Approver:</span>
                        <span className="ml-2 text-gray-900">{request.approver_name}</span>
                      </div>
                    )}
                    {request.approval_date && (
                      <div>
                        <span className="text-gray-500">Approval Date:</span>
                        <span className="ml-2 text-gray-900">{formatDate(request.approval_date)}</span>
                      </div>
                    )}
                    {request.approval_comments && (
                      <div>
                        <span className="text-gray-500">Comments:</span>
                        <p className="text-gray-900 mt-1">{request.approval_comments}</p>
                      </div>
                    )}
                    {request.rejection_comments && (
                      <div>
                        <span className="text-gray-500">Rejection Reason:</span>
                        <p className="text-gray-900 mt-1">{request.rejection_comments}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Actions */}
          {!isEditing && (
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="flex space-x-3">
                {canDelete && (
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center space-x-2"
                    disabled={deleting}
                  >
                    {deleting ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              <div className="flex space-x-3">
                {canEdit && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestDetailModal;