import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/hooks/useAuth'
import { Layout } from '@/components/layout/Layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Save, User, Mail, Phone, UserCheck, Key } from 'lucide-react'
import { validateEmail, validatePhone, getRoleColor, getInitials, generateGradient } from '@/lib/utils'

interface EditUserForm {
  fullName: string
  email: string
  phone: string
  role: 'admin' | 'manager' | 'user'
  isActive: boolean
}

interface UserData {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'manager' | 'user'
  phone?: string
  is_active: boolean
  created_at: string
  last_login?: string
}

export default function EditUserPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { id } = router.query
  const [userData, setUserData] = useState<UserData | null>(null)
  const [formData, setFormData] = useState<EditUserForm>({
    fullName: '',
    email: '',
    phone: '',
    role: 'user',
    isActive: true
  })
  const [errors, setErrors] = useState<Partial<EditUserForm>>({})
  const [loading2, setLoading2] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPasswordReset, setShowPasswordReset] = useState(false)

  // Redirect if not admin
  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (id && user?.role === 'admin') {
      fetchUser()
    }
  }, [id, user])

  const fetchUser = async () => {
    try {
      const response = await fetch(`/api/admin/users/${id}`)

      if (response.ok) {
        const data = await response.json()
        setUserData(data.user)
        setFormData({
          fullName: data.user.full_name,
          email: data.user.email,
          phone: data.user.phone || '',
          role: data.user.role,
          isActive: data.user.is_active
        })
      } else {
        alert('Failed to fetch user data')
        router.push('/admin/users')
      }
    } catch (error) {
      alert('Error fetching user data')
      router.push('/admin/users')
    } finally {
      setLoading2(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<EditUserForm> = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setSaving(true)

    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim() || null,
          role: formData.role,
          isActive: formData.isActive
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        alert('User updated successfully!')
        router.push('/admin/users')
      } else {
        alert(data.message || 'Failed to update user')
      }
    } catch (error) {
      alert('Failed to update user. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordReset = async () => {
    if (!confirm('This will generate a new temporary password and send it to the user. Continue?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${id}/reset-password`, {
        method: 'POST'
      })

      const data = await response.json()

      if (response.ok) {
        alert(`Password reset successful. Temporary password: ${data.tempPassword}`)
      } else {
        alert(data.message || 'Failed to reset password')
      }
    } catch (error) {
      alert('Failed to reset password')
    }
  }

  const handleInputChange = (field: keyof EditUserForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  if (loading || loading2 || !user || !userData) {
    return (
      <Layout title="Edit User">
        <div className="min-h-screen flex items-center justify-center">Loading…</div>
      </Layout>
    )
  }

  return (
    <Layout title={`Edit User - ${userData.full_name}`}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/users')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Users
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit User</h1>
          <p className="text-gray-600 mt-2">Update user information and settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Info Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>User Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-white text-2xl font-bold ${generateGradient(userData.full_name)}`}>
                    {getInitials(userData.full_name)}
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg">{userData.full_name}</h3>
                    <p className="text-gray-600">{userData.email}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Role:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(userData.role)}`}>
                        {userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        userData.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {userData.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Created:</span>
                      <span>{new Date(userData.created_at).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Last Login:</span>
                      <span>{userData.last_login ? new Date(userData.last_login).toLocaleDateString() : 'Never'}</span>
                    </div>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handlePasswordReset}
                    className="w-full"
                  >
                    <Key className="w-4 h-4 mr-2" />
                    Reset Password
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Edit Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Edit Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.fullName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter full name"
                      />
                    </div>
                    {errors.fullName && (
                      <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter email address"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.phone ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter phone number"
                      />
                    </div>
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                    )}
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <UserCheck className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <select
                        value={formData.role}
                        onChange={(e) => handleInputChange('role', e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                      >
                        <option value="user">User</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Status
                    </label>
                    <div className="flex items-center space-x-3">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={formData.isActive}
                          onChange={() => handleInputChange('isActive', true)}
                          className="mr-2"
                        />
                        <span className="text-green-700">Active</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={!formData.isActive}
                          onChange={() => handleInputChange('isActive', false)}
                          className="mr-2"
                        />
                        <span className="text-red-700">Inactive</span>
                      </label>
                    </div>
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex space-x-4">
                    <Button 
                      type="submit" 
                      className="flex-1"
                      disabled={saving}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => router.push('/admin/users')}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  )
}
