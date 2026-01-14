'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/use-user'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, Minus, Plus, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function CartPage() {
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(true)
  const { user, loading: userLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/auth/login')
    } else if (user) {
      fetchCart()
    }
  }, [user, userLoading, router])

  const fetchCart = async () => {
    try {
      const res = await fetch(`/api/cart?user_id=${user.id}`, {
        credentials: 'include',
      })

      const contentType = res.headers.get('content-type')
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Server error: ${res.status}`)
      }

      const data = await res.json()

      if (data.data) {
        // Fetch product details for each cart item
        const itemsWithProducts = await Promise.all(
          data.data.map(async (item) => {
            const productRes = await fetch(`https://qttglmtiagzuxpttjsoy.supabase.co/rest/v1/products?id=eq.${item.product_id}`, {
              headers: {
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
              }
            })
            const products = await productRes.json()
            return { ...item, product: products[0], quantity: item.qty }
          })
        )
        setCartItems(itemsWithProducts)
      }
    } catch (error) {
      console.error('Error fetching cart:', error)
      toast.error('Failed to load cart')
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (cartId, newQuantity) => {
    if (newQuantity < 1) return

    try {
      const res = await fetch(`/api/cart`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cartId, quantity: newQuantity }),
        credentials: 'include',
      })

      if (res.ok) {
        fetchCart()
        toast.success('Cart updated')
      } else {
        const contentType = res.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const errorData = await res.json()
          toast.error(errorData.error || 'Failed to update cart')
        } else {
          const text = await res.text()
          throw new Error(text || `Server error: ${res.status}`)
        }
      }
    } catch (error) {
      console.error('Error updating cart:', error)
      toast.error('Failed to update cart')
    }
  }

  const removeItem = async (cartId) => {
    try {
      const res = await fetch(`/api/cart?id=${cartId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (res.ok) {
        fetchCart()
        toast.success('Item removed from cart')
      }
    } catch (error) {
      console.error('Error removing item:', error)
      toast.error('Failed to remove item')
    }
  }

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => {
      return sum + (parseFloat(item.product?.price || 0) * item.quantity)
    }, 0).toFixed(2)
  }

  if (userLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div id="loading-spinner" className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 id="cart-title" className="text-4xl font-bold text-black mb-8">Shopping Cart</h1>

        {cartItems.length === 0 ? (
          <Card id="empty-cart-card" className="border-2">
            <CardContent className="pt-12 pb-12 text-center">
              <ShoppingBag className="h-20 w-20 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
              <p className="text-gray-600 mb-6">Add some products to get started!</p>
              <Link href="/products">
                <Button id="browse-products-btn" className="bg-black text-white hover:bg-gray-800">
                  Browse Products
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item, index) => (
                <Card key={item.id} id={`cart-item-${index}`} className="border-2 hover:border-black transition-colors">
                  <CardContent className="p-6">
                    <div className="flex gap-6">
                      {/* Product Image */}
                      <div className="w-32 h-32 bg-gray-100 rounded flex-shrink-0">
                        {item.product?.image_url ? (
                          <img
                            src={item.product.image_url.split(',')[0]}
                            alt={item.product.name}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1">
                        <h3 className="font-bold text-xl mb-2">{item.product?.name}</h3>
                        <p className="text-gray-600 text-sm mb-3">{item.product?.category}</p>
                        <p className="text-2xl font-bold">₹{parseFloat(item.product?.price || 0).toFixed(2)}</p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex flex-col items-end justify-between">
                        <Button
                          id={`remove-item-${index}`}
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          className="hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>

                        <div className="flex items-center gap-2">
                          <Button
                            id={`cart-decrease-qty-${index}`}
                            className="cart-qty-decrease-btn"
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span id={`cart-qty-value-${index}`} className="cart-quantity-value w-12 text-center font-semibold">{item.quantity}</span>
                          <Button
                            id={`cart-increase-qty-${index}`}
                            className="cart-qty-increase-btn"
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card id="cart-summary-card" className="border-2 sticky top-24">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span id="cart-subtotal">₹{calculateTotal()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>Free</span>
                  </div>
                  <div className="border-t-2 pt-4 flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span id="cart-total">₹{calculateTotal()}</span>
                  </div>
                  <Link href="/payment">
                    <Button id="proceed-checkout-btn" className="w-full bg-black text-white hover:bg-gray-800" size="lg">
                      Proceed to Checkout
                    </Button>
                  </Link>
                  <Link href="/products">
                    <Button id="continue-shopping-btn" variant="outline" className="w-full border-2">
                      Continue Shopping
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
