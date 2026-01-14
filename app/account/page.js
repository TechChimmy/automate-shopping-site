'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/use-user'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Mail, Lock, Phone } from 'lucide-react'
import { toast } from 'sonner'

export default function AccountPage() {
  const { user, loading: userLoading } = useUser()
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [updating, setUpdating] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/auth/login')
    } else if (user) {
      fetchUserProfile()
    }
  }, [user, userLoading, router])

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('name, email, phone')
        .eq('id', user.id)
        .single()

      if (error) throw error
      
      setFormData({
        name: data.name || '',
        email: data.email || user.email,
        phone: data.phone || '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
      setFormData({ ...formData, email: user.email })
    } finally {
      setLoadingProfile(false)
    }
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Name is required')
      return
    }

    // if (!formData.phone.trim()) {
    if (!(String(formData.phone).trim())) {
      toast.error('Phone number is required')
      return
    }

    setUpdating(true)

    try {
      // Update name and phone in users table
      const { error: profileError } = await supabase
        .from('users')
        .update({
          name: formData.name,
          phone: formData.phone
        })
        .eq('id', user.id)

      if (profileError) throw profileError

      // Update password if provided
      if (formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          toast.error('Passwords do not match')
          setUpdating(false)
          return
        }
        if (formData.newPassword.length < 6) {
          toast.error('Password must be at least 6 characters')
          setUpdating(false)
          return
        }

        const { error: passwordError } = await supabase.auth.updateUser({
          password: formData.newPassword
        })
        if (passwordError) throw passwordError
        
        // Clear password fields
        setFormData({ ...formData, newPassword: '', confirmPassword: '' })
        toast.success('Profile and password updated successfully!')
      } else {
        toast.success('Profile updated successfully!')
      }

      // Refresh profile data
      await fetchUserProfile()
    } catch (error) {
      console.error('Update error:', error)
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setUpdating(false)
    }
  }

  if (userLoading || loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-black mb-8">Account Settings</h1>

        <div className="max-w-2xl mx-auto space-y-6">
          {/* Profile Information */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="pl-10 border-2"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      className="pl-10 border-2 bg-gray-50"
                      disabled
                    />
                  </div>
                  <p className="text-xs text-gray-500">Email cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="pl-10 border-2"
                      placeholder="+91 98765 43210"
                      required
                    />
                  </div>
                </div>

                <div className="border-t-2 pt-4 mt-6">
                  <h3 className="font-semibold text-lg mb-4">Change Password</h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="newPassword"
                          type="password"
                          value={formData.newPassword}
                          onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                          className="pl-10 border-2"
                          placeholder="Leave blank to keep current password"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          className="pl-10 border-2"
                          placeholder="Confirm new password"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-black text-white hover:bg-gray-800"
                  disabled={updating}
                >
                  {updating ? 'Updating...' : 'Update Profile'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 text-gray-600">
                <User className="h-5 w-5" />
                <span>User ID: {user?.id.substring(0, 8)}...</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Mail className="h-5 w-5" />
                <span>{formData.email}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Phone className="h-5 w-5" />
                <span>{formData.phone || 'Not provided'}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
