import { useState, useEffect } from 'react';
import { apiService } from '../services/api';

export const useAssets = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const data = await apiService.getAssets();
      setAssets(data);
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const addAsset = async (assetData) => {
    try {
      await apiService.createAsset(assetData);
      await fetchAssets();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const updateAsset = async (id, updates) => {
    try {
      await apiService.updateAsset(id, updates);
      await fetchAssets();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const deleteAsset = async (id) => {
    try {
      await apiService.deleteAsset(id);
      await fetchAssets();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  return {
    assets,
    loading,
    addAsset,
    updateAsset,
    deleteAsset,
    refreshAssets: fetchAssets
  };
};