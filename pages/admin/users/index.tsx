import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/hooks/useAuth'
import { Layout } from '@/components/layout/Layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  UserPlus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  CheckSquare,
  Square,
  Download,
  RefreshCw,
  Eye,
  UserX
} from 'lucide-react'
import { formatDate, getRoleColor, getInitials, generateGradient } from '@/lib/utils'

interface User {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'manager' | 'user'
  phone?: string
  is_active: boolean
  created_at: string
  created_by?: string
  last_login?: string
}

interface UsersFilter {
  search: string
  role: string
  status: string
}

export default function UsersPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [filters, setFilters] = useState<UsersFilter>({
    search: '',
    role: '',
    status: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [bulkLoading, setBulkLoading] = useState(false)

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers()
    }
  }, [user])

  useEffect(() => {
    filterUsers()
  }, [users, filters])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const filterUsers = () => {
    let filtered = [...users]

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(user => 
        user.full_name.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.email.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    // Role filter
    if (filters.role) {
      filtered = filtered.filter(user => user.role === filters.role)
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(user => 
        filters.status === 'active' ? user.is_active : !user.is_active
      )
    }

    setFilteredUsers(filtered)
  }

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id))
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setUsers(prev => prev.filter(u => u.id !== userId))
        alert('User deleted successfully')
      } else {
        const data = await response.json()
        alert(data.message || 'Failed to delete user')
      }
    } catch (error) {
      alert('Failed to delete user')
    }
  }

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: !currentStatus })
      })

      if (response.ok) {
        setUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, is_active: !currentStatus } : u
        ))
        alert(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
      } else {
        const data = await response.json()
        alert(data.message || 'Failed to update user status')
      }
    } catch (error) {
      alert('Failed to update user status')
    }
  }

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedUsers.length === 0) {
      alert('Please select users first')
      return
    }

    const confirmMessage = action === 'delete' 
      ? `Are you sure you want to delete ${selectedUsers.length} users? This cannot be undone.`
      : `Are you sure you want to ${action} ${selectedUsers.length} users?`

    if (!confirm(confirmMessage)) return

    setBulkLoading(true)
    
    try {
      const response = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          userIds: selectedUsers
        })
      })

      if (response.ok) {
        await fetchUsers()
        setSelectedUsers([])
        alert(`Bulk ${action} completed successfully`)
      } else {
        const data = await response.json()
        alert(data.message || `Failed to ${action} users`)
      }
    } catch (error) {
      alert(`Failed to ${action} users`)
    } finally {
      setBulkLoading(false)
    }
  }

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading…</div>
  }

  return (
    <Layout title="User Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">Manage system users and their permissions</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              onClick={() => fetchUsers()}
              disabled={loadingUsers}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loadingUsers ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Button onClick={() => router.push('/admin/users/create')}>
              <UserPlus className="w-4 h-4 mr-2" />
              Create New User
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Quick Filters */}
              <div className="flex gap-2">
                <select
                  value={filters.role}
                  onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="user">User</option>
                </select>

                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Results Summary */}
            <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
              <span>
                Showing {filteredUsers.length} of {users.length} users
              </span>
              
              {selectedUsers.length > 0 && (
                <div className="flex items-center gap-3">
                  <span>{selectedUsers.length} selected</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleBulkAction('activate')}
                      disabled={bulkLoading}
                    >
                      Activate
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleBulkAction('deactivate')}
                      disabled={bulkLoading}
                    >
                      Deactivate
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleBulkAction('delete')}
                      disabled={bulkLoading}
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            {loadingUsers ? (
              <div className="p-8 text-center">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {filters.search || filters.role || filters.status 
                  ? 'No users found matching your filters'
                  : 'No users found'
                }
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="p-4 text-left">
                        <button
                          onClick={handleSelectAll}
                          className="flex items-center justify-center"
                        >
                          {selectedUsers.length === filteredUsers.length ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </th>
                      <th className="p-4 text-left font-semibold text-gray-900">User</th>
                      <th className="p-4 text-left font-semibold text-gray-900">Role</th>
                      <th className="p-4 text-left font-semibold text-gray-900">Status</th>
                      <th className="p-4 text-left font-semibold text-gray-900">Created</th>
                      <th className="p-4 text-left font-semibold text-gray-900">Last Login</th>
                      <th className="p-4 text-right font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <button
                            onClick={() => handleSelectUser(user.id)}
                            className="flex items-center justify-center"
                          >
                            {selectedUsers.includes(user.id) ? (
                              <CheckSquare className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        </td>
                        
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${generateGradient(user.full_name)}`}>
                              {getInitials(user.full_name)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{user.full_name}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                              {user.phone && (
                                <p className="text-xs text-gray-400">{user.phone}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </span>
                        </td>
                        
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        
                        <td className="p-4 text-sm text-gray-600">
                          {formatDate(user.created_at)}
                        </td>
                        
                        <td className="p-4 text-sm text-gray-600">
                          {user.last_login ? formatDate(user.last_login) : 'Never'}
                        </td>
                        
                        <td className="p-4">
                          <div className="flex justify-end space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => router.push(`/admin/users/${user.id}`)}
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => router.push(`/admin/users/${user.id}/edit`)}
                              title="Edit User"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                              title={user.is_active ? 'Deactivate' : 'Activate'}
                            >
                              <UserX className="w-4 h-4" />
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-700"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
