'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/use-user'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Package, Truck, MapPin, Calendar } from 'lucide-react'
import Link from 'next/link'

export default function OrderSummaryPage({ params }) {
  const [order, setOrder] = useState(null)
  const [orderItems, setOrderItems] = useState([])
  const [otherOrders, setOtherOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      fetchOrderDetails()
    }
  }, [user, params.id])

  const fetchOrderDetails = async () => {
    try {
      // Fetch this specific order with product details
      const orderRes = await fetch(`/api/orders?id=${params.id}`)
      const orderData = await orderRes.json()
      
      if (!orderData.data || orderData.data.length === 0) {
        throw new Error('Order not found')
      }
      
      const currentOrder = orderData.data[0]
      setOrder(currentOrder)

      // Fetch all orders from same timestamp (grouped order) with product details
      const groupedRes = await fetch(`/api/orders?user_id=${currentOrder.user_id}&created_at=${encodeURIComponent(currentOrder.created_at)}`)
      const groupedData = await groupedRes.json()

      const groupOrders = groupedData.data || []

      const items = groupOrders.map(ord => ({
        product_name: ord.product?.name || 'Product',
        quantity: ord.quantity,
        total: ord.total_price
      }))
      setOrderItems(items)

      const groupTotalAmount = groupOrders.reduce((sum, ord) => sum + (Number(ord.total_price) || 0), 0)
      const groupAddress = (groupOrders.find(o => o.shipping_address)?.shipping_address) || currentOrder.shipping_address || ''
      setOrder({
        ...currentOrder,
        total_amount: groupTotalAmount,
        payment_method: currentOrder.payment_method || 'N/A',
        shipping_address: groupAddress
      })

      // Fetch other recent orders and group by created_at to compute totals
      const otherRes = await fetch(`/api/orders?user_id=${user.id}`)
      const otherData = await otherRes.json()

      const allUserOrders = otherData.data || []

      const groups = new Map()
      for (const ord of allUserOrders) {
        const key = ord.created_at
        if (!groups.has(key)) {
          groups.set(key, { ...ord, total_amount: 0 })
        }
        const g = groups.get(key)
        g.total_amount += Number(ord.total_price) || 0
        groups.set(key, g)
      }

      const groupedList = Array.from(groups.values())
        .filter(g => g.created_at !== currentOrder.created_at)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)

      setOtherOrders(groupedList)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDeliveryDate = () => {
    const orderDate = new Date(order.created_at)
    const deliveryDate = new Date(orderDate)
    deliveryDate.setDate(deliveryDate.getDate() + 5) // 5 days delivery
    return deliveryDate.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    )
  }

  if (!order) {
    return <div className="min-h-screen flex items-center justify-center"><p>Order not found</p></div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Success Banner */}
        <Card id="order-success-banner" className="border-2 border-green-500 bg-green-50 mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
              <div>
                <h1 className="text-2xl font-bold text-green-800">Order Placed Successfully!</h1>
                <p className="text-green-700">Thank you for your order. Your order has been confirmed.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Info */}
            <Card id="order-info-card" className="border-2">
              <CardHeader>
                <CardTitle>Order Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Order ID</p>
                    <p id="order-id" className="font-semibold">{order.id.substring(0, 8).toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Order Date</p>
                    <p id="order-date" className="font-semibold">{new Date(order.created_at).toLocaleDateString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment Method</p>
                    <p id="payment-method" className="font-semibold capitalize">{order.payment_method}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <Badge id="order-status" className="bg-green-600">{order.status}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Info */}
            <Card id="delivery-info-card" className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Delivery Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 mt-1 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Expected Delivery</p>
                    <p id="delivery-date" className="font-bold text-lg text-green-600">{getDeliveryDate()}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Shipping Address</p>
                    <p id="shipping-address" className="font-semibold">{order.shipping_address || 'No address provided'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card id="order-items-card" className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Items ({orderItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orderItems.map((item, idx) => (
                    <div key={idx} id={`order-item-${idx}`} className="flex justify-between items-center border-b pb-4">
                      <div>
                        <p className="font-semibold">{item.product_name}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-bold">₹{item.total?.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary Sidebar */}
          <div className="space-y-6">
            <Card id="order-summary-card" className="border-2">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{order.total_amount?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span className="text-green-600">Included</span>
                </div>
                <div className="border-t-2 pt-3 flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span id="order-total-amount">₹{order.total_amount?.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            <Link href="/products">
              <button className="w-full bg-black text-white py-3 rounded font-semibold hover:bg-gray-800">Continue Shopping</button>
            </Link>
          </div>
        </div>

        {/* Other Orders */}
        {otherOrders.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Your Other Orders</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {otherOrders.map((ord, idx) => (
                <Link key={ord.id} href={`/orders/${ord.id}`}>
                  <Card id={`other-order-${idx}`} className="border-2 hover:border-black transition-all cursor-pointer">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        {ord.product?.image_url ? (
                          <img
                            src={(ord.product.image_url || '').split(',')[0]}
                            alt={ord.product?.name || 'Product'}
                            className="w-16 h-16 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <p className="font-semibold">Order #{ord.id.substring(0, 8).toUpperCase()}</p>
                            <Badge className="bg-gray-600">{ord.status}</Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {ord.product?.name || 'Product'} • {new Date(ord.created_at).toLocaleDateString('en-IN')}
                          </p>
                          <p className="font-bold">₹{ord.total_amount?.toFixed(2)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
