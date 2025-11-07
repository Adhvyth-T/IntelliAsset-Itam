import React, { useState } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { ASSET_CATEGORIES } from '../../utils/constants';

const AddAssetModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    category: 'Hardware',
    assignedTo: '',
    department: '',
    location: '',
    cost: '',
    serialNumber: '',
    vendor: '',
    warranty: '',
    tags: '',
    status: 'Active',
    lifecycle: 'Procurement'
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.type.trim()) newErrors.type = 'Type is required';
    if (formData.cost && isNaN(formData.cost)) newErrors.cost = 'Cost must be a number';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    const assetData = {
      ...formData,
      cost: parseFloat(formData.cost) || 0,
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
      purchaseDate: new Date().toISOString().split('T')[0],
      complianceStatus: 'Compliant',
      maintenanceSchedule: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };

    try {
      await onSubmit(assetData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Add New Asset" size="medium">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          <Input
            label="Asset Name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={errors.name}
            required
          />
          <Input
            label="Type"
            value={formData.type}
            onChange={(e) => handleChange('type', e.target.value)}
            error={errors.type}
            required
          />
          <Select
            label="Category"
            value={formData.category}
            onChange={(e) => handleChange('category', e.target.value)}
            options={ASSET_CATEGORIES.slice(1)} // Remove 'All' option
          />
          <Input
            label="Assigned To"
            value={formData.assignedTo}
            onChange={(e) => handleChange('assignedTo', e.target.value)}
          />
          <Input
            label="Department"
            value={formData.department}
            onChange={(e) => handleChange('department', e.target.value)}
          />
          <Input
            label="Location"
            value={formData.location}
            onChange={(e) => handleChange('location', e.target.value)}
          />
          <Input
            label="Cost ($)"
            type="number"
            value={formData.cost}
            onChange={(e) => handleChange('cost', e.target.value)}
            error={errors.cost}
          />
          <Input
            label="Serial Number"
            value={formData.serialNumber}
            onChange={(e) => handleChange('serialNumber', e.target.value)}
          />
          <Input
            label="Vendor"
            value={formData.vendor}
            onChange={(e) => handleChange('vendor', e.target.value)}
          />
          <Input
            label="Warranty Expiry"
            type="date"
            value={formData.warranty}
            onChange={(e) => handleChange('warranty', e.target.value)}
          />
          <Input
            label="Tags (comma separated)"
            value={formData.tags}
            onChange={(e) => handleChange('tags', e.target.value)}
            placeholder="urgent, laptop, development"
          />
        </div>
        
        <div className="flex items-center justify-end space-x-2 mt-6 pt-4 border-t">
          <Button
            type="button"
            onClick={onClose}
            variant="secondary"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Adding...' : 'Add Asset'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddAssetModal;