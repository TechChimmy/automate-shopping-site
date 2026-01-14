'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useUser } from '@/hooks/use-user'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, ShoppingCart, Heart, Plus, Minus, Star } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function ProductDetailPage({ params }) {
  const [product, setProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [addingToCart, setAddingToCart] = useState(false)
  const [suggestedProducts, setSuggestedProducts] = useState([])
  const [reviews, setReviews] = useState([])
  const [rating, setRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const { user } = useUser()
  const router = useRouter()

  useEffect(() => {
    fetchProduct()
  }, [params.id])

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error
      setProduct(data)

      // Fetch suggested products from same category
      const { data: suggested } = await supabase
        .from('products')
        .select('*')
        .eq('category', data.category)
        .neq('id', params.id)
        .limit(4)

      setSuggestedProducts(suggested || [])

      // Fetch reviews
      const reviewRes = await fetch(`/api/reviews?product_id=${params.id}`)
      const reviewData = await reviewRes.json()
      setReviews(reviewData.data || [])
    } catch (error) {
      console.error('Error fetching product:', error)
      toast.error('Product not found')
    } finally {
      setLoading(false)
    }
  }

  const submitReview = async () => {
    if (!user) {
      toast.error('Please login to submit a review')
      router.push('/auth/login')
      return
    }
    if (!rating) {
      toast.error('Please select a rating')
      return
    }
    if (!reviewText.trim()) {
      toast.error('Please write a review')
      return
    }

    setSubmittingReview(true)
    try {
      const res = await fetch(`/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          user_id: user.id,
          rating,
          review_text: reviewText
        })
      })

      if (res.ok) {
        toast.success('Review submitted successfully!')
        setRating(0)
        setReviewText('')
        fetchProduct() // Refresh reviews
      } else {
        toast.error('Failed to submit review')
      }
    } catch (error) {
      toast.error('Error submitting review')
    } finally {
      setSubmittingReview(false)
    }
  }

  const addToCart = async () => {
    if (!user) {
      toast.error('Please login to add items to cart')
      router.push('/auth/login')
      return
    }

    setAddingToCart(true)

    try {
      // First, check if item already exists in cart
      const checkRes = await fetch(`/api/cart?user_id=${user.id}`)
      const checkData = await checkRes.json()

      if (checkRes.ok && checkData.data) {
        const existingItem = checkData.data.find(item => item.product_id === product.id)

        if (existingItem) {
          // Item already in cart, show warning
          toast.warning('This item is already in your cart!', {
            description: 'You can update the quantity from the cart page.',
            action: {
              label: 'View Cart',
              onClick: () => router.push('/cart')
            }
          })
          setAddingToCart(false)
          return
        }
      }

      // Item not in cart, proceed to add
      const res = await fetch(`/api/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          product_id: product.id,
          quantity
        })
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Added to cart!')
      } else {
        toast.error(data.error || 'Failed to add to cart')
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.error('Failed to add to cart')
    } finally {
      setAddingToCart(false)
    }
  }

  const addToWishlist = async () => {
    if (!user) {
      toast.error('Please login to add items to wishlist')
      router.push('/auth/login')
      return
    }

    try {
      const res = await fetch(`/api/wishlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          product_id: product.id
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

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p id="product-not-found" className="text-gray-500">Product not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Link href="/products">
          <Button id="back-to-products-btn" variant="ghost" className="mb-6 hover:bg-gray-100">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Product Image Carousel */}
          <Card className="border-2">
            <CardContent className="p-0">
              {product.image_url ? (
                <div className="relative">
                  {/* Main Image */}
                  <div id="product-image-container" className="relative overflow-hidden">
                    <img
                      id="product-main-image"
                      src={product.image_url.split(',')[currentImageIndex]}
                      alt={product.name}
                      className="w-full h-[500px] object-cover"
                    />
                  </div>

                  {/* Carousel Controls - Only show if multiple images */}
                  {product.image_url.split(',').length > 1 && (
                    <>
                      {/* Previous Button */}
                      <Button
                        id="prev-image-btn"
                        variant="ghost"
                        size="icon"
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white border-2 h-12 w-12 rounded-full shadow-lg"
                        onClick={() => setCurrentImageIndex(prev =>
                          prev === 0 ? product.image_url.split(',').length - 1 : prev - 1
                        )}
                      >
                        <ArrowLeft className="h-6 w-6" />
                      </Button>

                      {/* Next Button */}
                      <Button
                        id="next-image-btn"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white border-2 h-12 w-12 rounded-full shadow-lg"
                        onClick={() => setCurrentImageIndex(prev =>
                          prev === product.image_url.split(',').length - 1 ? 0 : prev + 1
                        )}
                      >
                        <ArrowLeft className="h-6 w-6 rotate-180" />
                      </Button>

                      {/* Image Indicators */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {product.image_url.split(',').map((_, index) => (
                          <button
                            key={index}
                            id={`image-indicator-${index}`}
                            className={`h-2 rounded-full transition-all ${index === currentImageIndex
                              ? 'w-8 bg-black'
                              : 'w-2 bg-white/70 hover:bg-white'
                              }`}
                            onClick={() => setCurrentImageIndex(index)}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="w-full h-[500px] bg-gray-200 flex items-center justify-center">
                  <ShoppingCart className="h-24 w-24 text-gray-400" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <Badge id="product-category" className="mb-3 bg-black text-white">{product.category}</Badge>
              <h1 id="product-title" className="text-4xl font-bold text-black mb-4">{product.name}</h1>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-sm text-gray-600">(4.5/5 - 120 ratings)</span>
              </div>
              <p id="product-price" className="text-4xl font-bold text-black mb-6">
                ₹{parseFloat(product.price).toFixed(2)}
              </p>
              <p id="product-description" className="text-gray-600 leading-relaxed text-lg">{product.description}</p>
            </div>

            {/* Quantity & Actions */}
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {/* Quantity Selector */}
                  <div>
                    <Label htmlFor="quantity" className="text-lg font-semibold mb-3 block">Quantity</Label>
                    <div className="flex items-center gap-3">
                      <Button
                        id="decrease-quantity-btn"
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="border-2 h-12 w-12"
                      >
                        <Minus className="h-5 w-5" />
                      </Button>
                      <Input
                        id="quantity-input"
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        className="text-center text-xl font-semibold border-2 h-12"
                      />
                      <Button
                        id="increase-quantity-btn"
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(quantity + 1)}
                        className="border-2 h-12 w-12"
                      >
                        <Plus className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Total Price */}
                  <div className="flex items-center justify-between py-4 border-y-2">
                    <span className="text-lg font-semibold">Total:</span>
                    <span id="product-total-price" className="text-3xl font-bold text-black">
                      ₹{(parseFloat(product.price) * quantity).toFixed(2)}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <Button
                      id="add-to-cart-btn"
                      onClick={addToCart}
                      disabled={addingToCart}
                      className="w-full bg-black text-white hover:bg-gray-800"
                      size="lg"
                    >
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      {addingToCart ? 'Adding...' : 'Add to Cart'}
                    </Button>
                    <Button
                      id="add-to-wishlist-btn"
                      onClick={addToWishlist}
                      variant="outline"
                      className="w-full border-2"
                      size="lg"
                    >
                      <Heart className="h-5 w-5 mr-2" />
                      Add to Wishlist
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Product Specifications - Flipkart Style */}
        <Card className="mt-8 border-2">
          <CardContent className="pt-6">
            <Tabs defaultValue="specifications" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger id="tab-specifications" value="specifications">Specifications</TabsTrigger>
                <TabsTrigger id="tab-description" value="description">Description</TabsTrigger>
                <TabsTrigger id="tab-reviews" value="reviews">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="specifications" className="mt-6">
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold mb-4">Product Specifications</h3>
                  <table id="specifications-table" className="specifications-table w-full border-2 border-gray-200">
                    <tbody>
                      <tr id="spec-row-category" className="spec-row border-b">
                        <td id="spec-label-category" className="spec-label font-semibold p-4 bg-gray-50 w-1/3">Category</td>
                        <td id="spec-value-category" className="spec-value p-4 text-gray-600">{product.category}</td>
                      </tr>
                      <tr id="spec-row-id" className="spec-row border-b">
                        <td id="spec-label-id" className="spec-label font-semibold p-4 bg-gray-50">Product ID</td>
                        <td id="spec-value-id" className="spec-value p-4 text-gray-600">{product.id.substring(0, 8)}...</td>
                      </tr>
                      <tr id="spec-row-price" className="spec-row border-b">
                        <td id="spec-label-price" className="spec-label font-semibold p-4 bg-gray-50">Price</td>
                        <td id="spec-value-price" className="spec-value p-4 text-gray-600">₹{parseFloat(product.price).toFixed(2)}</td>
                      </tr>
                      <tr id="spec-row-availability" className="spec-row border-b">
                        <td id="spec-label-availability" className="spec-label font-semibold p-4 bg-gray-50">Availability</td>
                        <td id="spec-value-availability" className="spec-value p-4 text-green-600 font-semibold">In Stock</td>
                      </tr>
                      <tr id="spec-row-brand" className="spec-row border-b">
                        <td id="spec-label-brand" className="spec-label font-semibold p-4 bg-gray-50">Brand</td>
                        <td id="spec-value-brand" className="spec-value p-4 text-gray-600">ShopSuite Premium</td>
                      </tr>
                      <tr id="spec-row-warranty" className="spec-row border-b">
                        <td id="spec-label-warranty" className="spec-label font-semibold p-4 bg-gray-50">Warranty</td>
                        <td id="spec-value-warranty" className="spec-value p-4 text-gray-600">1 Year Manufacturer Warranty</td>
                      </tr>
                      <tr id="spec-row-seller" className="spec-row border-b">
                        <td id="spec-label-seller" className="spec-label font-semibold p-4 bg-gray-50">Seller</td>
                        <td id="spec-value-seller" className="spec-value p-4 text-gray-600">ShopSuite Official Store</td>
                      </tr>
                      <tr id="spec-row-return" className="spec-row">
                        <td id="spec-label-return" className="spec-label font-semibold p-4 bg-gray-50">Return Policy</td>
                        <td id="spec-value-return" className="spec-value p-4 text-gray-600">7 Days Return & Exchange</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="description" className="mt-6">
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold mb-4">Product Description</h3>
                  <p className="text-gray-700 leading-relaxed">{product.description}</p>
                  <div className="mt-6">
                    <h4 className="font-bold text-lg mb-3">Key Features:</h4>
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                      <li>Premium Quality Material</li>
                      <li>Durable and Long-lasting</li>
                      <li>Perfect for Daily Use</li>
                      <li>Easy to Maintain</li>
                      <li>Eco-friendly Packaging</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="reviews" className="mt-6">
                <div className="space-y-4">
                  <h3 id="reviews-heading" className="text-2xl font-bold mb-4">Customer Reviews</h3>

                  {/* Add Review Form */}
                  <Card id="add-review-card" className="add-review-section border-2 bg-gray-50">
                    <CardContent className="pt-6">
                      <h4 className="font-bold text-lg mb-4">Write a Review</h4>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="review-rating">Rating</Label>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star
                                key={star}
                                id={`star-${star}`}
                                className={`star-rating h-6 w-6 cursor-pointer ${rating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                onClick={() => setRating(star)}
                              />
                            ))}
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="review-text">Your Review</Label>
                          <textarea
                            id="review-text"
                            className="review-input w-full border-2 rounded p-2 mt-2"
                            rows={4}
                            placeholder="Share your experience with this product..."
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                          />
                        </div>
                        <Button
                          id="submit-review-btn"
                          className="submit-review-button bg-black text-white hover:bg-gray-800"
                          onClick={submitReview}
                          disabled={submittingReview}
                        >
                          {submittingReview ? 'Submitting...' : 'Submit Review'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Existing Reviews */}
                  <div id="reviews-list" className="reviews-container space-y-4">
                    {reviews.length > 0 ? reviews.map((review, idx) => (
                      <Card key={review.id} id={`review-box-${idx}`} className="review-card border">
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div id={`review-stars-${idx}`} className="review-stars flex">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                              ))}
                            </div>
                            <span id={`review-author-${idx}`} className="review-author text-sm text-gray-600">by {review.users?.name || 'Customer'}</span>
                          </div>
                          <p id={`review-text-${idx}`} className="review-content text-gray-700">{review.review_text}</p>
                          <p className="text-xs text-gray-400 mt-2">{new Date(review.created_at).toLocaleDateString()}</p>
                        </CardContent>
                      </Card>
                    )) : (
                      <p className="text-gray-500 text-center py-8">No reviews yet. Be the first to review!</p>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Product Suggestions */}
        {suggestedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-3xl font-bold mb-6">You May Also Like</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {suggestedProducts.map((suggestedProduct) => (
                <Card key={suggestedProduct.id} className="border-2 hover:border-black transition-all">
                  <div className="relative">
                    {suggestedProduct.image_url ? (
                      <img
                        src={suggestedProduct.image_url.split(',')[0]}
                        alt={suggestedProduct.name}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                        <ShoppingCart className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <CardContent className="pt-4">
                    <Badge className="mb-2 bg-black text-white">{suggestedProduct.category}</Badge>
                    <h3 className="font-bold text-lg mb-2 line-clamp-1">{suggestedProduct.name}</h3>
                    <p className="text-xl font-bold mb-3">₹{parseFloat(suggestedProduct.price).toFixed(2)}</p>
                    <Link href={`/products/${suggestedProduct.id}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="w-full border-2">
                        View Product
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
