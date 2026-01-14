'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useUser } from '@/hooks/use-user'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Package, ShoppingCart, Users, Plus, Edit, Trash2, Upload } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

export default function AdminDashboard() {
  const { user, userRole, loading: userLoading } = useUser()
  const router = useRouter()

  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [users, setUsers] = useState([])
  const [totalUsersCount, setTotalUsersCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Product form state
  const [productForm, setProductForm] = useState({
    id: null,
    name: '',
    description: '',
    price: '',
    category: '',
    image_url: ''
  })
  const [imageFile, setImageFile] = useState(null)
  const [imageUrls, setImageUrls] = useState([''])
  const [useUrlInput, setUseUrlInput] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    if (!userLoading) {
      if (!user || userRole !== 'admin') {
        router.push('/')
      } else {
        fetchAllData()
      }
    }
  }, [user, userRole, userLoading, router])

  const fetchAllData = async () => {
    setLoading(true)
    await Promise.all([fetchProducts(), fetchOrders(), fetchUsers()])
    setLoading(false)
  }

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchOrders = async () => {
    try {
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Fetch related product and user details for each order
      const ordersWithDetails = await Promise.all(
        (ordersData || []).map(async (order) => {
          const [productResult, userResult] = await Promise.all([
            supabase.from('products').select('name').eq('id', order.product_id).single(),
            supabase.from('users').select('email').eq('id', order.user_id).single()
          ])

          return {
            ...order,
            products: productResult.data,
            users: userResult.data
          }
        })
      )

      setOrders(ordersWithDetails)
    } catch (error) {
      console.error('Error fetching orders:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      // Get user count
      const countResponse = await fetch(`/api/users/count`)
      const countData = await countResponse.json()

      if (countResponse.ok && countData.count !== undefined) {
        setTotalUsersCount(countData.count)
      }

      // Fetch users from API endpoint (uses service role key to bypass RLS)
      const usersResponse = await fetch(`/api/users`)
      const usersData = await usersResponse.json()

      if (!usersResponse.ok) {
        throw new Error(usersData.error || 'Failed to fetch users')
      }

      console.log('Fetched users data:', usersData.data)

      // Filter out admin emails and sort by name
      const filteredUsers = (usersData.data || [])
        .filter(user => !user.email.startsWith('admin@'))
        .sort((a, b) => {
          const nameA = (a.name || a.email || '').toLowerCase()
          const nameB = (b.name || b.email || '').toLowerCase()
          return nameA.localeCompare(nameB)
        })

      console.log('Filtered users:', filteredUsers)
      setUsers(filteredUsers)
    } catch (error) {
      console.error('Error fetching users:', error)
      setUsers([])
    }
  }

  // Handle image upload to Supabase Storage
  const handleImageUpload = async (file) => {
    if (!file) return null

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
      const filePath = `products/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('products')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Failed to upload image')
      return null
    }
  }

  const handleProductSubmit = async (e) => {
    e.preventDefault()
    setUploading(true)

    try {
      let imageUrl = productForm.image_url

      if (useUrlInput) {
        // Use URL input (multiple URLs separated by commas)
        imageUrl = imageUrls.filter(url => url.trim()).join(',')
      } else if (imageFile) {
        // Upload new image if selected
        const uploadedUrl = await handleImageUpload(imageFile)
        if (uploadedUrl) {
          imageUrl = uploadedUrl
        }
      }

      const productData = {
        name: productForm.name,
        description: productForm.description,
        price: parseFloat(productForm.price),
        category: productForm.category,
        image_url: imageUrl
      }

      if (productForm.id) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', productForm.id)

        if (error) throw error
        toast.success('Product updated successfully')
      } else {
        // Create new product
        const { error } = await supabase
          .from('products')
          .insert([productData])

        if (error) throw error
        toast.success('Product created successfully')
      }

      resetProductForm()
      setDialogOpen(false)
      fetchProducts()
    } catch (error) {
      console.error('Error saving product:', error)
      toast.error('Failed to save product')
    } finally {
      setUploading(false)
    }
  }

  const handleEditProduct = (product) => {
    setProductForm({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      image_url: product.image_url || ''
    })
    setImageFile(null)

    // Check if image_url contains multiple URLs
    if (product.image_url && product.image_url.includes(',')) {
      setImageUrls(product.image_url.split(',').map(url => url.trim()))
      setUseUrlInput(true)
    } else if (product.image_url && product.image_url.startsWith('http')) {
      setImageUrls([product.image_url])
      setUseUrlInput(true)
    } else {
      setImageUrls([''])
      setUseUrlInput(false)
    }

    setDialogOpen(true)
  }

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (error) throw error
      toast.success('Product deleted successfully')
      fetchProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('Failed to delete product')
    }
  }

  const resetProductForm = () => {
    setProductForm({
      id: null,
      name: '',
      description: '',
      price: '',
      category: '',
      image_url: ''
    })
    setImageFile(null)
    setImageUrls([''])
    setUseUrlInput(false)
  }

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)

      if (error) throw error
      toast.success('Order status updated')
      fetchOrders()
    } catch (error) {
      console.error('Error updating order:', error)
      toast.error('Failed to update order')
    }
  }

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error
      toast.success('User role updated')
      fetchUsers()
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error('Failed to update user')
    }
  }

  if (userLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-black">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage products, orders, and users</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsersCount}</div>
              <p className="text-xs text-gray-500 mt-1">(Including admin accounts)</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="products" className="space-y-4">
          <TabsList>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Products Management</CardTitle>
                    <CardDescription>Add, edit, or delete products</CardDescription>
                  </div>
                  <Dialog open={dialogOpen} onOpenChange={(open) => {
                    setDialogOpen(open)
                    if (!open) resetProductForm()
                  }}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Product
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>
                          {productForm.id ? 'Edit Product' : 'Add New Product'}
                        </DialogTitle>
                        <DialogDescription>
                          {productForm.id ? 'Update product information' : 'Create a new product listing'}
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleProductSubmit}>
                        <div className="grid gap-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Product Name</Label>
                            <Input
                              id="name"
                              value={productForm.name}
                              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                              id="description"
                              value={productForm.description}
                              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                              required
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="price">Price</Label>
                              <Input
                                id="price"
                                type="number"
                                step="0.01"
                                value={productForm.price}
                                onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="category">Category</Label>
                              <Input
                                id="category"
                                value={productForm.category}
                                onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                                required
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between mb-2">
                              <Label>Product Images</Label>
                              <div className="flex items-center space-x-2">
                                <Label htmlFor="urlToggle" className="text-sm">Use URL</Label>
                                <input
                                  id="urlToggle"
                                  type="checkbox"
                                  checked={useUrlInput}
                                  onChange={(e) => setUseUrlInput(e.target.checked)}
                                  className="w-4 h-4"
                                />
                              </div>
                            </div>

                            {useUrlInput ? (
                              <div className="space-y-2">
                                {imageUrls.map((url, index) => (
                                  <div key={index} className="flex gap-2">
                                    <Input
                                      placeholder="Enter image URL"
                                      value={url}
                                      onChange={(e) => {
                                        const newUrls = [...imageUrls]
                                        newUrls[index] = e.target.value
                                        setImageUrls(newUrls)
                                      }}
                                      className="border-2"
                                    />
                                    {index === imageUrls.length - 1 && (
                                      <Button
                                        type="button"
                                        onClick={() => setImageUrls([...imageUrls, ''])}
                                        variant="outline"
                                        className="border-2"
                                      >
                                        +
                                      </Button>
                                    )}
                                    {imageUrls.length > 1 && (
                                      <Button
                                        type="button"
                                        onClick={() => setImageUrls(imageUrls.filter((_, i) => i !== index))}
                                        variant="destructive"
                                      >
                                        -
                                      </Button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <>
                                <Input
                                  id="image"
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => setImageFile(e.target.files[0])}
                                  className="border-2"
                                />
                                {productForm.image_url && !imageFile && (
                                  <div className="mt-2">
                                    <img src={productForm.image_url.split(',')[0]} alt="Current" className="w-32 h-32 object-cover rounded" />
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit" disabled={uploading}>
                            {uploading ? 'Saving...' : productForm.id ? 'Update Product' : 'Create Product'}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {products.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No products yet. Add your first product!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {products.map((product) => (
                      <Card key={product.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex space-x-4 flex-1">
                              {product.image_url ? (
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  className="w-20 h-20 object-cover rounded"
                                />
                              ) : (
                                <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center">
                                  <Package className="h-8 w-8 text-gray-400" />
                                </div>
                              )}
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg">{product.name}</h3>
                                <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                                <div className="flex items-center space-x-3 mt-2">
                                  <Badge>{product.category}</Badge>
                                  <span className="text-lg font-bold text-primary">
                                    ₹{parseFloat(product.price).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleEditProduct(product)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => handleDeleteProduct(product.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Orders Management</CardTitle>
                <CardDescription>View and manage all customer orders</CardDescription>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No orders yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <Card key={order.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="font-semibold">{order.products?.name}</h3>
                                <Badge>{order.status}</Badge>
                              </div>
                              <p className="text-sm text-gray-600">Customer: {order.users?.email}</p>
                              <p className="text-sm text-gray-600">Quantity: {order.quantity}</p>
                              <p className="text-lg font-bold text-primary mt-2">
                                ₹{parseFloat(order.total_price).toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(order.created_at).toLocaleString()}
                              </p>
                            </div>
                            <div className="ml-4">
                              <Label className="text-sm mb-2 block">Update Status</Label>
                              <Select
                                value={order.status}
                                onValueChange={(value) => handleUpdateOrderStatus(order.id, value)}
                              >
                                <SelectTrigger className="w-40">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Users Management</CardTitle>
                <CardDescription>View and manage user accounts</CardDescription>
              </CardHeader>
              <CardContent>
                {users.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No users yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {users.map((u) => (
                      <Card key={u.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-4">
                                <div className="flex-1">
                                  <p className="font-semibold text-lg">{u.name || 'User'}</p>
                                  <p className="text-sm text-gray-600">{u.email}</p>
                                  {u.phone && (
                                    <p className="text-sm text-gray-500">Phone: {u.phone}</p>
                                  )}
                                  <p className="text-xs text-gray-400 mt-1">
                                    Joined: {new Date(u.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                                {u.role}
                              </Badge>
                              <Select
                                value={u.role}
                                onValueChange={(value) => handleUpdateUserRole(u.id, value)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">User</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
