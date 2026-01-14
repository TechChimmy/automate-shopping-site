'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/use-user'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, ShoppingCart, Heart } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState([])
  const [loading, setLoading] = useState(true)
  const { user, loading: userLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/auth/login')
    } else if (user) {
      fetchWishlist()
    }
  }, [user, userLoading])

  const fetchWishlist = async () => {
    setLoading(true)

    try {
      const res = await fetch(`/api/wishlist?user_id=${user.id}`, {
        credentials: 'include',
      })

      if (!res.ok) {
        throw new Error('Failed to fetch wishlist')
      }

      const data = await res.json()

      if (!data?.data) {
        setWishlistItems([])
        return
      }

      const itemsWithProducts = await Promise.all(
        data.data.map(async (item) => {
          try {
            const productRes = await fetch(
              `https://qttglmtiagzuxpttjsoy.supabase.co/rest/v1/products?id=eq.${item.product_id}`,
              {
                headers: {
                  apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                  Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
                },
              }
            )

            const products = await productRes.json()

            return {
              ...item,
              product: products?.[0] ?? null,
            }
          } catch {
            return { ...item, product: null }
          }
        })
      )

      setWishlistItems(itemsWithProducts)
    } catch (error) {
      console.error('Wishlist fetch error:', error)
      toast.error('Failed to load wishlist')
      setWishlistItems([])
    } finally {
      setLoading(false)
    }
  }

  const removeItem = async (wishlistId) => {
    try {
      const res = await fetch(`/api/wishlist?id=${wishlistId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!res.ok) {
        throw new Error('Remove failed')
      }

      fetchWishlist()
      toast.success('Removed from wishlist')
    } catch (error) {
      console.error(error)
      toast.error('Failed to remove item')
    }
  }

  const moveToCart = async (item) => {
    try {
      const cartRes = await fetch(`/api/cart`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: item.product_id,
          quantity: 1,
        }),
      })

      if (!cartRes.ok) {
        throw new Error('Add to cart failed')
      }

      const removeRes = await fetch(`/api/wishlist?id=${item.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!removeRes.ok) {
        throw new Error('Wishlist cleanup failed')
      }

      fetchWishlist()
      toast.success('Moved to cart!')
    } catch (error) {
      console.error(error)
      toast.error('Failed to move item to cart')
    }
  }

  if (userLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-black mb-8">My Wishlist</h1>

        {wishlistItems.length === 0 ? (
          <Card className="border-2">
            <CardContent className="pt-12 pb-12 text-center">
              <Heart className="h-20 w-20 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Your wishlist is empty</h2>
              <p className="text-gray-600 mb-6">Save items you love for later!</p>
              <Link href="/products">
                <Button className="bg-black text-white hover:bg-gray-800">
                  Browse Products
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistItems.map((item, index) => (
              <Card key={item.id} className="border-2 hover:border-black transition-colors">
                <CardContent className="p-0">
                  <div className="relative h-64 bg-gray-100">
                    {item.product?.image_url ? (
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingCart className="h-16 w-16 text-gray-400" />
                      </div>
                    )}

                    <Button
                      className="absolute top-2 right-2 bg-white hover:bg-red-50 hover:text-red-600 shadow"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-2 line-clamp-2">
                      {item.product?.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {item.product?.category}
                    </p>
                    <p className="text-2xl font-bold mb-4">
                      ₹{parseFloat(item.product?.price || 0).toFixed(2)}
                    </p>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => moveToCart(item)}
                        className="flex-1 bg-black text-white hover:bg-gray-800"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Add to Cart
                      </Button>
                      <Link href={`/products/${item.product_id}`} className="flex-1">
                        <Button variant="outline" className="w-full border-2">
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
