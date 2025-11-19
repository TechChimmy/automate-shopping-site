'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ShoppingCart, Heart } from 'lucide-react'
import { toast } from 'sonner'
import { useUser } from '@/hooks/use-user'

export default function ProductsPage() {
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get('search') || ''
  
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState(searchQuery)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [priceRange, setPriceRange] = useState([0, 1000])
  const [sortBy, setSortBy] = useState('name')
  const [categories, setCategories] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const productsPerPage = 8
  const { user } = useUser()

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      setSearchTerm(searchQuery)
    }
  }, [searchQuery])

  useEffect(() => {
    filterProducts()
  }, [products, searchTerm, selectedCategory, priceRange, sortBy])

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      setProducts(data || [])
      
      // Extract unique categories
      const uniqueCategories = [...new Set(data.map(p => p.category))]
      setCategories(uniqueCategories)
      
      // Set max price range
      const maxPrice = Math.max(...data.map(p => parseFloat(p.price)), 1000)
      setPriceRange([0, maxPrice])
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterProducts = () => {
    let filtered = [...products]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory)
    }

    // Price filter
    filtered = filtered.filter(p => {
      const price = parseFloat(p.price)
      return price >= priceRange[0] && price <= priceRange[1]
    })

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'price-low') return parseFloat(a.price) - parseFloat(b.price)
      if (sortBy === 'price-high') return parseFloat(b.price) - parseFloat(a.price)
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      return 0
    })

    setFilteredProducts(filtered)
    // Reset to page 1 when filters change
    setCurrentPage(1)
  }

  const addToCart = async (productId) => {
    if (!user) {
      toast.error('Please login to add items to cart')
      return
    }

    try {
      // First, check if item already exists in cart
      const checkRes = await fetch(`/api/cart?user_id=${user.id}`)
      const checkData = await checkRes.json()
      
      if (checkRes.ok && checkData.data) {
        const existingItem = checkData.data.find(item => item.product_id === productId)
        
        if (existingItem) {
          // Item already in cart, show warning
          toast.warning('This item is already in your cart!', {
            description: 'You can update the quantity from the cart page.'
          })
          return
        }
      }

      // Item not in cart, proceed to add
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          product_id: productId,
          quantity: 1
        })
      })

      if (res.ok) {
        toast.success('Added to cart!')
        // Refresh page to update cart count
        window.location.reload()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to add to cart')
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.error('Failed to add to cart')
    }
  }

  const addToWishlist = async (productId) => {
    if (!user) {
      toast.error('Please login to add items to wishlist')
      return
    }

    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          product_id: productId
        })
      })

      if (res.ok) {
        toast.success('Added to wishlist!')
      } else {
        const data = await res.json()
        toast.info(data.message || 'Already in wishlist')
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error)
      toast.error('Failed to add to wishlist')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div id="loading-spinner" className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 id="products-title" className="text-4xl font-bold text-black mb-8">All Products</h1>

        {/* Filters */}
        <Card id="filters-card" className="mb-6 border-2">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <Input
                id="search-input"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-2"
              />

              {/* Category Filter */}
              <Select id="category-filter" value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger id="category-filter-trigger" className="category-filter-dropdown border-2">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent id="category-filter-content">
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select id="sort-filter" value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger id="sort-filter-trigger" className="sort-filter-dropdown border-2">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent id="sort-filter-content">
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>

              {/* Clear Filters Button */}
              <Button 
                id="clear-filters-btn"
                className="clear-filters-button bg-gray-200 text-black hover:bg-gray-300"
                onClick={() => {
                  setSelectedCategory('all')
                  setSortBy('name')
                  setPriceRange([0, 10000])
                  setSearchTerm('')
                }}
              >
                Clear Filters
              </Button>

              {/* Price Range Editable */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium">Price Range</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                    className="border-2 w-20"
                  />
                  <span className="self-center">-</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 10000])}
                    className="border-2 w-20"
                  />
                </div>
              </div>
            </div>
            {searchTerm && (
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  Showing results for: <span className="font-semibold">"{searchTerm}"</span>
                  <Button 
                    variant="link" 
                    onClick={() => setSearchTerm('')}
                    className="ml-2 text-black"
                  >
                    Clear search
                  </Button>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div id="no-products" className="text-center py-16">
            <p className="text-gray-500 text-lg">No products found.</p>
            {searchTerm && (
              <Button 
                onClick={() => setSearchTerm('')}
                className="mt-4 bg-black text-white hover:bg-gray-800"
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <>
            <div id="products-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts
                .slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage)
                .map((product, index) => (
                <Card key={product.id} id={`product-card-${index}`} className="border-2 hover:border-black transition-all group">
                  <div className="relative">
                    {product.image_url ? (
                      <img
                        src={product.image_url.split(',')[0]}
                        alt={product.name}
                        className="w-full h-64 object-cover"
                      />
                    ) : (
                      <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
                        <ShoppingCart className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Wishlist Button */}
                    <Button
                      id={`wishlist-btn-${index}`}
                      onClick={() => addToWishlist(product.id)}
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 bg-white hover:bg-gray-100 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Heart className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  <CardContent className="pt-4">
                    <Badge id={`product-category-${index}`} className="product-category-badge mb-2 bg-black text-white">{product.category}</Badge>
                    <h3 id={`product-title-${index}`} className="product-title font-bold text-lg mb-2 line-clamp-2">{product.name}</h3>
                    <p id={`product-description-${index}`} className="product-description text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                    <p id={`product-price-${index}`} className="product-price text-2xl font-bold">₹{parseFloat(product.price).toFixed(2)}</p>
                  </CardContent>
                  
                  <CardFooter className="flex gap-2">
                    <Button
                      id={`add-cart-btn-${index}`}
                      onClick={() => addToCart(product.id)}
                      className="flex-1 bg-black text-white hover:bg-gray-800"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                    <Link href={`/products/${product.id}`} target="_blank" rel="noopener noreferrer" className="flex-1">
                      <Button id={`view-btn-${index}`} variant="outline" className="w-full border-2">
                        View
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {filteredProducts.length > productsPerPage && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  id="prev-page-btn"
                  onClick={() => {
                    setCurrentPage(prev => Math.max(1, prev - 1))
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  disabled={currentPage === 1}
                  variant="outline"
                  className="border-2"
                >
                  Previous
                </Button>
                
                <div className="flex gap-2">
                  {Array.from({ length: Math.ceil(filteredProducts.length / productsPerPage) }, (_, i) => i + 1).map(pageNum => (
                    <Button
                      key={pageNum}
                      id={`page-${pageNum}-btn`}
                      onClick={() => {
                        setCurrentPage(pageNum)
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      className={currentPage === pageNum ? "bg-black text-white" : "border-2"}
                    >
                      {pageNum}
                    </Button>
                  ))}
                </div>

                <Button
                  id="next-page-btn"
                  onClick={() => {
                    setCurrentPage(prev => Math.min(Math.ceil(filteredProducts.length / productsPerPage), prev + 1))
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  disabled={currentPage === Math.ceil(filteredProducts.length / productsPerPage)}
                  variant="outline"
                  className="border-2"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
