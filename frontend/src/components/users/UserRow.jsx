import React from 'react';
import { Users, Edit, Trash2 } from 'lucide-react';

const UserRow = ({ user }) => {
  const handleEdit = () => {
    // TODO: Implement edit functionality
    console.log('Edit user:', user);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      // TODO: Implement delete functionality
      console.log('Delete user:', user);
    }
  };

  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{user.name}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {user.role || 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {user.department || 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {user.assetsCount || 0}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleEdit}
            className="text-blue-600 hover:text-blue-900"
            title="Edit User"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button 
            onClick={handleDelete}
            className="text-red-600 hover:text-red-900"
            title="Delete User"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default UserRow;
