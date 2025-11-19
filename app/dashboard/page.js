'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { useUser } from '@/hooks/use-user'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Package, Clock, CheckCircle, XCircle } from 'lucide-react'

export default function UserDashboard() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const { user, loading: userLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/auth/login')
    } else if (user) {
      fetchOrders()
    }
  }, [user, userLoading, router])

  const fetchOrders = async () => {
    try {
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Fetch product details for each order
      const ordersWithProducts = await Promise.all(
        (ordersData || []).map(async (order) => {
          const { data: product } = await supabase
            .from('products')
            .select('name, image_url, category')
            .eq('id', order.product_id)
            .single()
          
          return { ...order, products: product }
        })
      )

      setOrders(ordersWithProducts)
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelOrder = async (orderId) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId)
        .eq('user_id', user.id)

      if (error) throw error

      toast.success('Order cancelled successfully')
      fetchOrders()
    } catch (error) {
      console.error('Error cancelling order:', error)
      toast.error('Failed to cancel order')
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'cancelled':
        return <XCircle className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
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
          <h1 className="text-4xl font-bold text-black">My Dashboard</h1>
          <p className="text-gray-600 mt-2">View and manage your orders</p>
        </div>

        <div className="mb-6">
          <Card className="border-2">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Account Information</CardTitle>
                <Link href="/account">
                  <Button variant="outline" className="border-2">Edit Profile</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                <span className="font-semibold">Email:</span> {user?.email}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>My Orders</CardTitle>
            <CardDescription>Track your order history and status</CardDescription>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex space-x-4 flex-1">
                          {order.products?.image_url ? (
                            <img
                              src={order.products.image_url}
                              alt={order.products.name}
                              className="w-20 h-20 object-cover rounded"
                            />
                          ) : (
                            <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center">
                              <Package className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{order.products?.name}</h3>
                            <p className="text-sm text-gray-500">Quantity: {order.quantity}</p>
                            <p className="text-lg font-bold text-primary mt-1">
                              ₹{parseFloat(order.total_price).toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <Badge className={getStatusColor(order.status)}>
                            <span className="mr-1">{getStatusIcon(order.status)}</span>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                          {order.status === 'pending' && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleCancelOrder(order.id)}
                            >
                              Cancel Order
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
