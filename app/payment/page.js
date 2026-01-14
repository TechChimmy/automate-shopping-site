'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/use-user'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { CreditCard, ShoppingBag, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'


export default function PaymentPage() {
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const { user, loading: userLoading } = useUser()
  const router = useRouter()

  // Payment form state
  const [cardType, setCardType] = useState('visa')
  const [cardNumber, setCardNumber] = useState('')
  const [cardHolder, setCardHolder] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [cvv, setCvv] = useState('')

  // Shipping address state
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [pincode, setPincode] = useState('')
  const [shippingCost, setShippingCost] = useState(0)

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/auth/login')
    } else if (user) {
      fetchCart()
    }
  }, [user, userLoading, router])

  const fetchCart = async () => {
    try {
      const res = await fetch(`/api/cart?user_id=${user.id}`)
      const data = await res.json()

      if (data.data) {
        const itemsWithProducts = await Promise.all(
          data.data.map(async (item) => {
            const productRes = await fetch(`https://qttglmtiagzuxpttjsoy.supabase.co/rest/v1/products?id=eq.${item.product_id}`, {
              headers: {
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
              }
            })
            const products = await productRes.json()
            return { ...item, product: products[0], quantity: item.qty || 1 }
          })
        )
        setCartItems(itemsWithProducts)
      }
    } catch (error) {
      console.error('Error fetching cart:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => {
      return sum + (parseFloat(item.product?.price || 0) * item.quantity)
    }, 0).toFixed(2)
  }

  const calculateShipping = (pin) => {
    if (!pin || pin.length !== 6) return 0
    // Calculate shipping based on pincode
    const firstDigit = parseInt(pin[0])
    if (firstDigit <= 3) return 50 // Metro cities
    if (firstDigit <= 6) return 80 // Tier 2 cities
    return 120 // Remote areas
  }

  const handlePincodeChange = (value) => {
    setPincode(value)
    if (value.length === 6) {
      const cost = calculateShipping(value)
      setShippingCost(cost)
      toast.success(`Shipping cost: ₹${cost}`)
    } else {
      setShippingCost(0)
    }
  }

  const validateCard = () => {
    const cleanNumber = cardNumber.replace(/\s/g, '')

    // Card number validation
    if (!cardNumber || cleanNumber.length !== 16) {
      toast.error('Please enter a valid 16-digit card number')
      return false
    }

    // Card type validation based on first digits
    const firstDigit = cleanNumber[0]
    const firstTwo = cleanNumber.substring(0, 2)

    if (cardType === 'visa' && firstDigit !== '4') {
      toast.error('Visa cards must start with 4. Please check your card number or select correct card type.')
      return false
    }
    if (cardType === 'mastercard' && (firstTwo < '51' || firstTwo > '55')) {
      toast.error('Mastercard numbers must start with 51-55. Please check your card number or select correct card type.')
      return false
    }
    if (cardType === 'rupay' && firstDigit !== '6') {
      toast.error('RuPay cards must start with 6. Please check your card number or select correct card type.')
      return false
    }

    // Luhn algorithm check for card number
    let sum = 0
    let isEven = false
    for (let i = cleanNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNumber[i])
      if (isEven) {
        digit *= 2
        if (digit > 9) digit -= 9
      }
      sum += digit
      isEven = !isEven
    }
    if (sum % 10 !== 0) {
      toast.error('Invalid card number. Please check and try again.')
      return false
    }

    if (!cardHolder || cardHolder.trim().length < 3) {
      toast.error('Please enter card holder name')
      return false
    }
    if (!expiryDate || !/^\d{2}\/\d{2}$/.test(expiryDate)) {
      toast.error('Please enter expiry date in MM/YY format')
      return false
    }

    // Check if card is expired
    const [month, year] = expiryDate.split('/').map(Number)
    const now = new Date()
    const expiry = new Date(2000 + year, month - 1)
    if (expiry < now) {
      toast.error('Card has expired')
      return false
    }

    if (!cvv || cvv.length !== 3) {
      toast.error('Please enter a valid 3-digit CVV')
      return false
    }
    return true
  }

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      toast.error('Your cart is empty')
      return
    }

    if (!address || !city || !pincode) {
      toast.error('Please fill in complete shipping address')
      return
    }

    if (pincode.length !== 6) {
      toast.error('Please enter valid 6-digit pincode')
      return
    }

    if (!validateCard()) {
      return
    }

    setProcessing(true)

    try {
      // Prepare order items
      const orderItems = cartItems.map(item => ({
        product_id: item.product_id,
        product_name: item.product?.name,
        quantity: item.quantity,
        price: parseFloat(item.product?.price || 0),
        total: parseFloat(item.product?.price || 0) * item.quantity
      }))

      const totalAmount = parseFloat(calculateTotal())

      // Create single order with all items
      const orderData = {
        user_id: user.id,
        items: orderItems,
        total_amount: totalAmount + shippingCost,
        payment_method: cardType,
        shipping_address: `${address}, ${city}, ${pincode}`
      }


      const res = await fetch(`/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to create order')
      }

      const orderResponse = await res.json()
      const orderId = orderResponse.data?.id

      // Clear cart
      for (const item of cartItems) {
        await fetch(`/api/cart?id=${item.id}`, { method: 'DELETE' })
      }

      toast.success('Order placed successfully!')
      router.push(`/orders/${orderId}`)
    } catch (error) {
      console.error('Error placing order:', error)
      toast.error(error.message || 'Failed to place order')
    } finally {
      setProcessing(false)
    }
  }

  const formatCardNumber = (value) => {
    const cleaned = value.replace(/\s/g, '')
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned
    return formatted
  }

  const formatExpiryDate = (value) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4)
    }
    return cleaned
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
        <h1 id="checkout-title" className="text-4xl font-bold text-black mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Payment Method */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address */}
            <Card id="shipping-address-card" className="border-2">
              <CardHeader>
                <CardTitle>Shipping Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address-input">Address</Label>
                  <Input
                    id="address-input"
                    className="address-field border-2"
                    placeholder="House No, Street, Area"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city-input">City</Label>
                    <Input
                      id="city-input"
                      className="city-field border-2"
                      placeholder="Mumbai"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="pincode-input">Pincode</Label>
                    <Input
                      id="pincode-input"
                      className="pincode-field border-2"
                      placeholder="400001"
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => handlePincodeChange(e.target.value.replace(/\D/g, ''))}
                      required
                    />
                  </div>
                </div>
                {shippingCost > 0 && (
                  <div className="bg-green-50 border-2 border-green-200 p-3 rounded">
                    <p className="text-green-800 font-semibold">Shipping Cost: ₹{shippingCost}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card id="payment-method-card" className="border-2">
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Card Type Selection */}
                <div className="mb-6">
                  <Label className="text-lg font-semibold mb-3 block">Select Card Type</Label>
                  <RadioGroup value={cardType} onValueChange={setCardType} className="grid grid-cols-3 gap-4">
                    <div className="flex items-center">
                      <RadioGroupItem value="visa" id="card-type-visa" className="mr-2" />
                      <Label htmlFor="card-type-visa" className="cursor-pointer flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        <span className="font-semibold">VISA</span>
                      </Label>
                    </div>
                    <div className="flex items-center">
                      <RadioGroupItem value="mastercard" id="card-type-mastercard" className="mr-2" />
                      <Label htmlFor="card-type-mastercard" className="cursor-pointer flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        <span className="font-semibold">Mastercard</span>
                      </Label>
                    </div>
                    <div className="flex items-center">
                      <RadioGroupItem value="rupay" id="card-type-rupay" className="mr-2" />
                      <Label htmlFor="card-type-rupay" className="cursor-pointer flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        <span className="font-semibold">Rupay</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Card Details Form */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="card-number">Card Number</Label>
                    <Input
                      id="card-number"
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      maxLength="19"
                      className="border-2 text-lg"
                    />
                  </div>

                  <div>
                    <Label htmlFor="card-holder">Card Holder Name</Label>
                    <Input
                      id="card-holder"
                      type="text"
                      placeholder="John Doe"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                      className="border-2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiry-date">Expiry Date</Label>
                      <Input
                        id="expiry-date"
                        type="text"
                        placeholder="MM/YY"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                        maxLength="5"
                        className="border-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        type="password"
                        placeholder="123"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                        maxLength="3"
                        className="border-2"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card id="order-items-card" className="border-2">
              <CardHeader>
                <CardTitle>Order Items ({cartItems.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {cartItems.map((item, index) => (
                    <div key={item.id} id={`order-item-${index}`} className="flex gap-4 pb-3 border-b last:border-b-0">
                      <div className="w-20 h-20 bg-gray-100 rounded flex-shrink-0">
                        {item.product?.image_url ? (
                          <img
                            src={item.product.image_url.split(',')[0]}
                            alt={item.product.name}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{item.product?.name}</h4>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">₹{(parseFloat(item.product?.price || 0) * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card id="order-summary-card" className="border-2 sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span id="order-subtotal">₹{calculateTotal()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span id="order-shipping" className="font-semibold text-green-600">₹{shippingCost}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span id="order-tax">₹0.00</span>
                </div>
                <div className="border-t-2 pt-4 flex justify-between text-2xl font-bold">
                  <span>Total</span>
                  <span id="order-total">₹{(parseFloat(calculateTotal()) + shippingCost).toFixed(2)}</span>
                </div>
                <Button
                  id="place-order-btn"
                  onClick={handlePlaceOrder}
                  disabled={processing || cartItems.length === 0}
                  className="w-full bg-black text-white hover:bg-gray-800"
                  size="lg"
                >
                  {processing ? (
                    'Processing...'
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Place Order
                    </>
                  )}
                </Button>
                <Link href="/cart">
                  <Button id="back-to-cart-btn" variant="outline" className="w-full border-2">
                    Back to Cart
                  </Button>
                </Link>
                <div className="bg-gray-100 p-3 rounded text-sm text-center text-gray-600">
                  🔒 Your payment is secure and encrypted
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
