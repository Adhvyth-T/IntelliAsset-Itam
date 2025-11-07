import React, { useState } from 'react';
import { X, CheckCircle, XCircle, Loader } from 'lucide-react';
import { apiService } from '../../services/api';

const ApprovalModal = ({ request, onClose, onSuccess, setError }) => {
  const [action, setAction] = useState('approve'); // 'approve' or 'reject'
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      if (action === 'approve') {
        await apiService.approveProcurementRequest(request.id, comments);
      } else {
        await apiService.rejectProcurementRequest(request.id, comments);
      }
      onSuccess();
    } catch (error) {
      setError(error.message || `Failed to ${action} request`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Review Procurement Request</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Request Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Request Summary</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Asset:</span>
                <p className="text-gray-900 font-medium mt-1">{request.asset_name}</p>
              </div>
              <div>
                <span className="text-gray-500">Type:</span>
                <p className="text-gray-900 font-medium mt-1">{request.asset_type}</p>
              </div>
              <div>
                <span className="text-gray-500">Requestor:</span>
                <p className="text-gray-900 font-medium mt-1">{request.requestor_name}</p>
              </div>
              <div>
                <span className="text-gray-500">Department:</span>
                <p className="text-gray-900 font-medium mt-1">{request.department || '-'}</p>
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
              <div className="col-span-2">
                <span className="text-gray-500">Priority:</span>
                <span className={`ml-2 px-2.5 py-1 rounded-full text-xs font-medium ${
                  request.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                  request.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                  request.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {request.priority}
                </span>
              </div>
            </div>
          </div>

          {/* Justification */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Business Justification</h3>
            <p className="text-sm text-gray-900 bg-blue-50 rounded-lg p-3">
              {request.justification}
            </p>
          </div>

          {/* Specifications */}
          {request.specifications && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Technical Specifications</h3>
              <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">
                {request.specifications}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Action Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Decision</label>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setAction('approve')}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 flex items-center justify-center space-x-2 transition-colors ${
                    action === 'approve'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Approve</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAction('reject')}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 flex items-center justify-center space-x-2 transition-colors ${
                    action === 'reject'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <XCircle className="w-5 h-5" />
                  <span className="font-medium">Reject</span>
                </button>
              </div>
            </div>

            {/* Comments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {action === 'approve' ? 'Approval Comments' : 'Rejection Reason'} (Optional)
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows="4"
                placeholder={
                  action === 'approve'
                    ? 'Add any comments or conditions for approval...'
                    : 'Explain why this request is being rejected...'
                }
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Info Box */}
            <div className={`rounded-lg p-4 flex items-start space-x-3 ${
              action === 'approve' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              {action === 'approve' ? (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
              )}
              <div className={`text-sm ${action === 'approve' ? 'text-green-800' : 'text-red-800'}`}>
                <p className="font-medium">
                  {action === 'approve' ? 'Approving this request' : 'Rejecting this request'}
                </p>
                <p className="mt-1">
                  {action === 'approve'
                    ? 'The requestor will be notified and the request can proceed to ordering.'
                    : 'The requestor will be notified of the rejection and can resubmit if needed.'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-6 py-2 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 ${
                  action === 'approve'
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-red-500 hover:bg-red-600'
                }`}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>{action === 'approve' ? 'Approve Request' : 'Reject Request'}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ApprovalModal;