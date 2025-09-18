import { useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/Toast'
import { Layout } from '@/components/layout/Layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Save, User, Mail, Phone, UserCheck } from 'lucide-react'
import { validateEmail, validatePhone } from '@/lib/utils'

interface CreateUserForm {
  fullName: string
  email: string
  phone: string
  role: 'admin' | 'manager' | 'user'
}

export default function CreateUserPage() {
  const { user, loading } = useAuth()
  const { showToast } = useToast()
  const router = useRouter()
  const [formData, setFormData] = useState<CreateUserForm>({
    fullName: '',
    email: '',
    phone: '',
    role: 'user'
  })
  const [errors, setErrors] = useState<Partial<CreateUserForm>>({})
  const [creating, setCreating] = useState(false)

  // Redirect if not admin
  if (!loading && (!user || user.role !== 'admin')) {
    router.push('/')
    return null
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateUserForm> = {}

    // Full Name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters'
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Phone validation
    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setCreating(true)

    try {
      // Remove the manual authToken handling and let Supabase handle it via cookies
      const response = await fetch('/api/admin/createUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          role: formData.role
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        showToast({
          type: 'success',
          message: 'User created successfully! An invitation email has been sent.'
        })
        router.push('/admin/users')
      } else {
        showToast({
          type: 'error',
          message: data.message || 'Failed to create user'
        })
      }
    } catch (error) {
      console.error('Error creating user:', error)
      showToast({
        type: 'error',
        message: 'Failed to create user. Please try again.'
      })
    } finally {
      setCreating(false)
    }
  }

  const handleInputChange = (field: keyof CreateUserForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading…</div>
  }

  return (
    <Layout title="Create New User">
      <div className="max-w-2xl mx-auto space-y-6">
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
          <h1 className="text-3xl font-bold text-gray-900">Create New User</h1>
          <p className="text-gray-600 mt-2">Add a new user to the system</p>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              User Information
            </CardTitle>
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
                  Phone Number (Optional)
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
                    onChange={(e) => handleInputChange('role', e.target.value as 'admin' | 'manager' | 'user')}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="user">User</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex space-x-4">
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={creating}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {creating ? 'Creating User...' : 'Create User'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.push('/admin/users')}
                  disabled={creating}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}