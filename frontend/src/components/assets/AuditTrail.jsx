import React from 'react';
import { useAuditChain } from '../../hooks/useAuditChain';
import { Shield, ShieldAlert, ShieldOff, Clock, User, Hash, ArrowRight, Loader, AlertTriangle, XCircle } from 'lucide-react';

const AuditTrail = ({ asset }) => {
  const { auditData, verification, loading, error } = useAuditChain(asset.id);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-3 text-gray-600">Loading audit trail...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading audit trail: {error}</p>
      </div>
    );
  }

  if (!auditData || auditData.total_changes === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No audit trail yet</p>
        <p className="text-sm text-gray-500 mt-1">
          Changes to this assets assignment will be tracked here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* PROMINENT Verification Status - ALWAYS VISIBLE */}
      <div className={`rounded-lg p-6 border-4 shadow-lg ${
        verification?.is_valid 
          ? 'bg-green-50 border-green-500' 
          : 'bg-red-100 border-red-600 animate-pulse'
      }`}>
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            {verification?.is_valid ? (
              <Shield className="w-10 h-10 text-green-600" />
            ) : (
              <ShieldAlert className="w-10 h-10 text-red-700" />
            )}
          </div>
          <div className="flex-1">
            <h3 className={`text-xl font-bold mb-2 ${
              verification?.is_valid ? 'text-green-800' : 'text-red-800'
            }`}>
              {verification?.is_valid 
                ? '✓ CHAIN VERIFIED - Integrity Intact' 
                : '⚠️ TAMPERING DETECTED - Chain Compromised!'}
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Total Records</p>
                <p className="text-2xl font-bold text-gray-800">{verification?.total_records}</p>
              </div>
              <div>
                <p className="text-gray-600">Verified Records</p>
                <p className="text-2xl font-bold text-gray-800">{verification?.verified_records}</p>
              </div>
            </div>
            
            {!verification?.is_valid && (
              <div className="mt-4 p-4 bg-red-200 rounded-lg border-2 border-red-700">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-800 mt-0.5" />
                  <div>
                    <p className="font-bold text-red-900">Security Alert</p>
                    <p className="text-red-800 mt-1">
                      Chain broken at record #{verification?.broken_at_index}
                    </p>
                    <p className="text-sm text-red-700 mt-2 font-mono">
                      {verification?.error_message}
                    </p>
                    <p className="text-xs text-red-600 mt-2">
                      This indicates unauthorized modification of audit records.
                      Contact your security team immediately.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Audit Records Timeline */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Change History ({auditData.total_changes} changes)
        </h3>
        
        <div className="space-y-4">
          {auditData.records.map((record, index) => {
            // Highlight tampered record if verification failed
            const isTamperedRecord = !verification?.is_valid && 
                                     index === verification?.broken_at_index;
            
            return (
              <div 
                key={record.id}
                className={`relative pl-8 pb-4 border-l-2 ${
                  isTamperedRecord 
                    ? 'border-red-600 bg-red-50' 
                    : 'border-gray-200'
                } last:border-l-0 last:pb-0`}
              >
                {/* Timeline dot */}
                <div className={`absolute left-0 top-1 -ml-2 w-4 h-4 rounded-full border-2 border-white ${
                  isTamperedRecord ? 'bg-red-600' : 'bg-blue-500'
                }`} />
                
                <div className={`rounded-lg p-4 space-y-2 ${
                  isTamperedRecord ? 'bg-red-100 border-2 border-red-500' : 'bg-gray-50'
                }`}>
                  {isTamperedRecord && (
                    <div className="flex items-center space-x-2 text-red-800 font-bold mb-2">
                      <XCircle className="w-5 h-5" />
                      <span>⚠️ TAMPERED RECORD</span>
                    </div>
                  )}
                  
                  {/* Timestamp and Chain Index */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(record.timestamp).toLocaleString()}</span>
                    </div>
                    <span className="text-xs font-mono bg-gray-200 px-2 py-1 rounded">
                      #{record.chain_index}
                    </span>
                  </div>

                  {/* Change Details */}
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-700 font-medium">
                      {record.old_value || '(Unassigned)'}
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <span className="text-blue-600 font-semibold">
                      {record.new_value}
                    </span>
                  </div>

                  {/* User Info */}
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <User className="w-4 h-4" />
                    <span>Changed by: <span className="font-medium">{record.changed_by_email}</span></span>
                  </div>

                  {/* Cryptographic Hash */}
                  <div className="flex items-center space-x-2 text-xs text-gray-500 font-mono">
                    <Hash className="w-3 h-3" />
                    <span title={record.current_hash}>
                      Hash: {record.current_hash.substring(0, 16)}...
                    </span>
                  </div>

                  {/* Chain Link */}
                  {record.previous_hash && (
                    <div className="text-xs text-gray-400 font-mono">
                      ↳ Links to: {record.previous_hash.substring(0, 16)}...
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AuditTrail;