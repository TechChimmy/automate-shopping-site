'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'
import { useUser } from '@/hooks/use-user'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingBag, User, LogOut, LayoutDashboard, ShoppingCart, Heart, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useState, useEffect } from 'react'

export default function Navbar() {
  const { user, userRole } = useUser()
  const router = useRouter()
  const pathname = usePathname()
  const [cartCount, setCartCount] = useState(0)
  const [wishlistCount, setWishlistCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (user) {
      fetchCounts()
    }
  }, [user])

  const fetchCounts = async () => {
    try {
      const [cartRes, wishlistRes] = await Promise.all([
        fetch(`/api/cart?user_id=${user.id}`),
        fetch(`/api/wishlist?user_id=${user.id}`)
      ])

      if (cartRes.ok) {
        const cartData = await cartRes.json()
        setCartCount(cartData.data?.length || 0)
      }

      if (wishlistRes.ok) {
        const wishlistData = await wishlistRes.json()
        setWishlistCount(wishlistData.data?.length || 0)
      }
    } catch (error) {
      console.error('Error fetching counts:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  // Always show navbar (removed condition to hide on home/auth pages)

  return (
    <nav id="main-navbar" className="bg-black text-white shadow-lg sticky top-0 z-50 border-b border-gray-800">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href={user ? (userRole === 'admin' ? '/admin/dashboard' : '/products') : '/'}>
            <div id="navbar-logo" className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer">
              <Image
                src="/logo.png"
                alt="ShopSuite logo"
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
              />
              <span className="text-2xl font-bold">ShopSuite</span>
            </div>
          </Link>

          {/* Search Bar (only for customers) */}
          {user && userRole !== 'admin' && (
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="navbar-search-input"
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 bg-white text-black border-gray-300 focus:border-black"
                />
              </div>
            </form>
          )}

          {/* Nav Items */}
          <div className="flex items-center space-x-2">
            {user ? (
              <>
                {userRole === 'admin' ? (
                  <Link href="/admin/dashboard">
                    <Button id="admin-dashboard-btn" variant="ghost" className="text-white hover:bg-gray-800">
                      <LayoutDashboard className="h-5 w-5 mr-2" />
                      Admin
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/products">
                      <Button id="products-btn" variant="ghost" className="text-white hover:bg-gray-800">
                        Products
                      </Button>
                    </Link>

                    <Link href="/wishlist">
                      <Button id="wishlist-btn" variant="ghost" size="icon" className="text-white hover:bg-gray-800 relative">
                        <Heart className="h-5 w-5" />
                        {wishlistCount > 0 && (
                          <Badge id="wishlist-count" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-white text-black text-xs font-bold">
                            {wishlistCount}
                          </Badge>
                        )}
                      </Button>
                    </Link>

                    <Link href="/cart">
                      <Button id="cart-btn" variant="ghost" size="icon" className="text-white hover:bg-gray-800 relative">
                        <ShoppingCart className="h-5 w-5" />
                        {cartCount > 0 && (
                          <Badge id="cart-count" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-white text-black text-xs font-bold">
                            {cartCount}
                          </Badge>
                        )}
                      </Button>
                    </Link>

                    <Link href="/dashboard">
                      <Button id="account-btn" variant="ghost" className="text-white hover:bg-gray-800">
                        <User className="h-5 w-5 mr-2" />
                        Account
                      </Button>
                    </Link>

                    <Link href="/account/cards">
                      <Button id="cards-link" variant="ghost" className="text-white hover:bg-gray-800">
                        Cards
                      </Button>
                    </Link>
                  </>
                )}
                <Button id="logout-btn" variant="ghost" onClick={handleLogout} className="text-white hover:bg-gray-800">
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button id="login-btn" variant="ghost" className="text-white hover:bg-gray-800">Login</Button>
                </Link>
                <Link href="/auth/register">
                  <Button id="signup-btn" className="bg-white text-black hover:bg-gray-200">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
