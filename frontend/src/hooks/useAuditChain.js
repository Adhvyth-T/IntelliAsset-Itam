import { useState, useEffect } from 'react';
import { apiService } from '../services/api';

export const useAuditChain = (assetId) => {
  const [auditData, setAuditData] = useState(null);
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAuditChain = async () => {
    if (!assetId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [auditResponse, verifyResponse] = await Promise.all([
        apiService.getAuditChain(assetId),
        apiService.verifyAuditChain(assetId)
      ]);
      
      setAuditData(auditResponse);
      setVerification(verifyResponse);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching audit chain:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditChain();
  }, [assetId]);

  return {
    auditData,
    verification,
    loading,
    error,
    refresh: fetchAuditChain
  };
};