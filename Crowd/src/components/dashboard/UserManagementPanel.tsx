import React, { useState } from 'react';
import { UserPlus, Edit, Trash2, Shield, Eye, EyeOff, Users, Search, Filter } from 'lucide-react';
import { User, UserPermissions } from '../../types';
import { authService } from '../../services/authService';

interface UserManagementPanelProps {
  currentUser: User;
}

export const UserManagementPanel: React.FC<UserManagementPanelProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'police' | 'volunteer'>('all');
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Mock users for demo
  React.useEffect(() => {
    const demoUsers = authService.getDemoUsers().map((user, index) => ({
      id: `user-${index}`,
      email: user.email,
      role: user.role,
      assigned_zones: user.role === 'admin' ? ['ram-ghat', 'mahakal-ghat', 'bhairav-ghat', 'narsingh-ghat', 'kshipra-ghat'] :
                     user.role === 'police' ? ['ram-ghat', 'mahakal-ghat', 'bhairav-ghat'] :
                     ['narsingh-ghat', 'kshipra-ghat'],
      permissions: getDefaultPermissions(user.role),
      profile: user.profile
    }));
    setUsers(demoUsers);
  }, []);

  const getDefaultPermissions = (role: string): UserPermissions => {
    switch (role) {
      case 'admin':
        return {
          canViewAllZones: true,
          canManageDetection: true,
          canAcknowledgeAlerts: true,
          canExportData: true,
          canManageUsers: true,
          canAccessPredictions: true,
          canControlEvacuation: true,
        };
      case 'police':
        return {
          canViewAllZones: true,
          canManageDetection: false,
          canAcknowledgeAlerts: true,
          canExportData: true,
          canManageUsers: false,
          canAccessPredictions: true,
          canControlEvacuation: true,
        };
      default:
        return {
          canViewAllZones: false,
          canManageDetection: false,
          canAcknowledgeAlerts: false,
          canExportData: false,
          canManageUsers: false,
          canAccessPredictions: false,
          canControlEvacuation: false,
        };
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'police': return 'bg-blue-100 text-blue-800';
      case 'volunteer': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4" />;
      case 'police': return <Shield className="w-4 h-4" />;
      case 'volunteer': return <Users className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
            <p className="text-sm text-gray-600">Manage system users, roles, and permissions</p>
          </div>
          <button
            onClick={() => setShowAddUser(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="police">Police</option>
            <option value="volunteer">Volunteer</option>
          </select>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">User</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Role</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Department</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Assigned Zones</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium text-gray-900">{user.profile.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      <div className="text-xs text-gray-400">{user.profile.badgeNumber}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                      {getRoleIcon(user.role)}
                      <span className="capitalize">{user.role}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-gray-900">{user.profile.department}</div>
                    <div className="text-xs text-gray-500">{user.profile.shift}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-gray-900">{user.assigned_zones.length} zones</div>
                    <div className="text-xs text-gray-500">
                      {user.assigned_zones.slice(0, 2).join(', ')}
                      {user.assigned_zones.length > 2 && '...'}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span>Active</span>
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit user"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
            <div className="bg-gray-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Admins</p>
              <p className="text-2xl font-bold text-red-600">
                {users.filter(u => u.role === 'admin').length}
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Police</p>
              <p className="text-2xl font-bold text-blue-600">
                {users.filter(u => u.role === 'police').length}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Volunteers</p>
              <p className="text-2xl font-bold text-purple-600">
                {users.filter(u => u.role === 'volunteer').length}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Permissions Overview */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Role Permissions Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 font-medium text-gray-900">Permission</th>
                <th className="text-center py-2 px-3 font-medium text-red-600">Admin</th>
                <th className="text-center py-2 px-3 font-medium text-blue-600">Police</th>
                <th className="text-center py-2 px-3 font-medium text-purple-600">Volunteer</th>
              </tr>
            </thead>
            <tbody>
              {[
                { key: 'canViewAllZones', label: 'View All Zones' },
                { key: 'canManageDetection', label: 'Manage Detection' },
                { key: 'canAcknowledgeAlerts', label: 'Acknowledge Alerts' },
                { key: 'canExportData', label: 'Export Data' },
                { key: 'canManageUsers', label: 'Manage Users' },
                { key: 'canAccessPredictions', label: 'Access Predictions' },
                { key: 'canControlEvacuation', label: 'Control Evacuation' },
              ].map((permission) => (
                <tr key={permission.key} className="border-b border-gray-100">
                  <td className="py-2 px-3 text-gray-900">{permission.label}</td>
                  <td className="py-2 px-3 text-center">
                    {getDefaultPermissions('admin')[permission.key as keyof UserPermissions] ? 
                      <Eye className="w-4 h-4 text-green-600 mx-auto" /> : 
                      <EyeOff className="w-4 h-4 text-gray-400 mx-auto" />
                    }
                  </td>
                  <td className="py-2 px-3 text-center">
                    {getDefaultPermissions('police')[permission.key as keyof UserPermissions] ? 
                      <Eye className="w-4 h-4 text-green-600 mx-auto" /> : 
                      <EyeOff className="w-4 h-4 text-gray-400 mx-auto" />
                    }
                  </td>
                  <td className="py-2 px-3 text-center">
                    {getDefaultPermissions('volunteer')[permission.key as keyof UserPermissions] ? 
                      <Eye className="w-4 h-4 text-green-600 mx-auto" /> : 
                      <EyeOff className="w-4 h-4 text-gray-400 mx-auto" />
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};