'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { 
  User, 
  Users, 
  Plus, 
  UserCircle, 
  Shield, 
  KeyRound,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { motion } from 'framer-motion'
import { SupabaseAuthService } from '@/lib/supabase-auth'

interface UserForm {
  email: string
  fullName: string
  role: 'admin' | 'manager' | 'user'
  phone?: string
}

interface UserData {
  id: string
  email: string
  fullName: string
  role: 'admin' | 'manager' | 'user'
  phone?: string
  isActive: boolean
  created_at: string
}

export default function AdminManageUsersPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { showToast } = useToast()
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState<UserForm>({
    email: '',
    fullName: '',
    role: 'user',
    phone: ''
  })
  const [creatingUser, setCreatingUser] = useState(false)
  const [resetUserId, setResetUserId] = useState<string | null>(null)
  const [resettingPassword, setResettingPassword] = useState(false)

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && user && user.role !== 'admin') {
      router.push('/')
    }
  }, [user, authLoading, router])

  // Fetch users
  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchUsers()
    }
  }, [user])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      // Updated to use the correct method from SupabaseAuthService
      const fetchedUsers = await SupabaseAuthService.getUsers()
      // Fixed: Convert AuthUser[] to UserData[] format
      const userData: UserData[] = fetchedUsers.map(user => ({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
        isActive: user.isActive,
        created_at: new Date().toISOString() // Placeholder, should be from actual data
      }))
      setUsers(userData)
    } catch {
      showToast({
        type: 'error',
        message: 'Failed to fetch users'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setCreatingUser(true)
    try {
      // Updated to use the correct method signature
      await SupabaseAuthService.createUserAccount(
        {
          email: formData.email,
          fullName: formData.fullName,
          role: formData.role,
          phone: formData.phone,
          createdBy: user.id
        },
        user.role
      )
      
      showToast({
        type: 'success',
        message: 'User created successfully! An invitation email has been sent.'
      })
      
      // Reset form and hide
      setFormData({
        email: '',
        fullName: '',
        role: 'user',
        phone: ''
      })
      setShowCreateForm(false)
      
      // Refresh users list
      fetchUsers()
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to create user'
      })
    } finally {
      setCreatingUser(false)
    }
  }

  const handleResetPassword = async (userId: string) => {
    setResetUserId(userId)
    setResettingPassword(true)
    
    try {
      // Find user email
      const userToReset = users.find(u => u.id === userId)
      if (!userToReset) throw new Error('User not found')
      
      // Reset password (this will send an email)
      await SupabaseAuthService.resetPassword(userToReset.email)
      
      showToast({
        type: 'success',
        message: 'Password reset email sent successfully!'
      })
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to reset password'
      })
    } finally {
      setResetUserId(null)
      setResettingPassword(false)
    }
  }

  const handleDeactivateUser = async (userId: string) => {
    try {
      // Updated to use the correct method name
      await SupabaseAuthService.deactivateUser(userId)
      
      showToast({
        type: 'success',
        message: 'User deactivated successfully!'
      })
      
      // Refresh users list
      fetchUsers()
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to deactivate user'
      })
    }
  }

  const handleReactivateUser = async (userId: string) => {
    try {
      // Updated to use the correct method name
      await SupabaseAuthService.reactivateUser(userId)
      
      showToast({
        type: 'success',
        message: 'User reactivated successfully!'
      })
      
      // Refresh users list
      fetchUsers()
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to reactivate user'
      })
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-slate-900 dark:to-slate-800">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            You do not have permission to access this page.
          </p>
          <Button 
            onClick={() => router.push('/')} 
            className="mt-4"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-slate-900 dark:to-slate-800 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manage Users</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Create and manage user accounts
              </p>
            </div>
            <Button 
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="mt-4 md:mt-0 flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              {showCreateForm ? 'Cancel' : 'Create User'}
            </Button>
          </div>

          {/* Create User Form */}
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <Card className="backdrop-blur-md bg-white/30 dark:bg-slate-800/30 rounded-2xl shadow-xl border border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <UserCircle className="w-5 h-5 mr-2" />
                    Create New User
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateUser} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        {/* Removed 'icon' prop which is not supported by the Input component */}
                        <Input
                          label="Full Name"
                          type="text"
                          placeholder="Enter full name"
                          value={formData.fullName}
                          onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        {/* Removed 'icon' prop which is not supported by the Input component */}
                        <Input
                          label="Email Address"
                          type="email"
                          placeholder="Enter email address"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Role
                        </label>
                        <div className="relative">
                          <Shield className="absolute left-3 top-3 w-4 h-4 text-gray-400 dark:text-gray-500" />
                          <select
                            value={formData.role}
                            onChange={(e) => setFormData({...formData, role: e.target.value as 'admin' | 'manager' | 'user'})}
                            className="w-full pl-10 pr-4 py-2 rounded-md bg-white/50 dark:bg-slate-700/50 border border-white/20 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
                            required
                          >
                            <option value="admin">Admin</option>
                            <option value="manager">Manager</option>
                            <option value="user">User</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        {/* Removed 'icon' prop which is not supported by the Input component */}
                        <Input
                          label="Phone Number (Optional)"
                          type="tel"
                          placeholder="Enter phone number"
                          value={formData.phone || ''}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-3">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setShowCreateForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={creatingUser}
                        className="relative overflow-hidden group"
                      >
                        <span className="flex items-center">
                          {creatingUser ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Creating...
                            </>
                          ) : (
                            <>
                              <User className="w-4 h-4 mr-2" />
                              Create User
                            </>
                          )}
                        </span>
                        <span className="absolute right-0 top-0 h-full w-0 bg-white/20 group-hover:w-full transition-all duration-300"></span>
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Users List */}
          <Card className="backdrop-blur-md bg-white/30 dark:bg-slate-800/30 rounded-2xl shadow-xl border border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                All Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {users.map((userData) => (
                        <motion.tr
                          key={userData.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                          className="hover:bg-white/10 dark:hover:bg-slate-700/50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {userData.fullName}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {userData.email}
                                </div>
                                {userData.phone && (
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {userData.phone}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              userData.role === 'admin' 
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' 
                                : userData.role === 'manager' 
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' 
                                  : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            }`}>
                              {userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              userData.isActive 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            }`}>
                              {userData.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(userData.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleResetPassword(userData.id)}
                                disabled={resettingPassword && resetUserId === userData.id}
                                title="Reset Password"
                              >
                                {resettingPassword && resetUserId === userData.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 dark:border-gray-300"></div>
                                ) : (
                                  <KeyRound className="w-4 h-4" />
                                )}
                              </Button>
                              {userData.isActive ? (
                                <Button
                                  size="sm"
                                  variant="danger"
                                  onClick={() => handleDeactivateUser(userData.id)}
                                  title="Deactivate User"
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="success"
                                  onClick={() => handleReactivateUser(userData.id)}
                                  title="Reactivate User"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}