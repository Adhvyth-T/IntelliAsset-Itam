import React, { useState } from 'react';
import UserTable from './UserTable';
import AddUserModal from './AddUserModal';
import Button from '../common/Button';
import { Plus } from 'lucide-react';

const UserManagement = ({ users, onAddUser, setError }) => {
  const [showAddUser, setShowAddUser] = useState(false);

  const handleAddUser = async (userData) => {
    const result = await onAddUser(userData);
    if (result.success) {
      setShowAddUser(false);
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">User Management</h2>
        <Button
          onClick={() => setShowAddUser(true)}
          icon={Plus}
          variant="primary"
        >
          Add User
        </Button>
      </div>

      <UserTable users={users} />

      {showAddUser && (
        <AddUserModal
          onClose={() => setShowAddUser(false)}
          onSubmit={handleAddUser}
        />
      )}
    </div>
  );
};

export default UserManagement;