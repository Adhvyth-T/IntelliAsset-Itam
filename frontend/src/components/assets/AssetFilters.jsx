import React from 'react';
import { Search, Plus } from 'lucide-react';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { ASSET_STATUSES, ASSET_CATEGORIES } from '../../utils/constants';

const AssetFilters = ({ 
  searchTerm, 
  onSearchChange, 
  filterStatus, 
  onStatusChange, 
  filterCategory, 
  onCategoryChange, 
  onAddAsset 
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
      <div className="flex flex-1 gap-4 w-full sm:w-auto">
        <Input
          type="text"
          placeholder="Search assets..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          icon={Search}
          className="flex-1 max-w-md"
        />
        <Select
          value={filterStatus}
          onChange={(e) => onStatusChange(e.target.value)}
          options={ASSET_STATUSES}
          className="min-w-[150px]"
        />
        <Select
          value={filterCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          options={ASSET_CATEGORIES}
          className="min-w-[150px]"
        />
      </div>
      <Button
        onClick={onAddAsset}
        icon={Plus}
        variant="primary"
      >
        Add Asset
      </Button>
    </div>
  );
};

export default AssetFilters;