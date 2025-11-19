'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/use-user'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCard, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'sonner'

export default function SavedCardsPage() {
  const [cards, setCards] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [cardType, setCardType] = useState('visa')
  const [cardNumber, setCardNumber] = useState('')
  const [cardHolder, setCardHolder] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [cvv, setCvv] = useState('')
  const [saving, setSaving] = useState(false)
  const { user, loading: userLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/auth/login')
    } else if (user) {
      fetchCards()
    }
  }, [user, userLoading, router])

  const fetchCards = async () => {
    try {
      const res = await fetch(`/api/saved-cards?user_id=${user.id}`)
      const data = await res.json()
      setCards(data.data || [])
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const validateCard = () => {
    const cleanNumber = cardNumber.replace(/\s/g, '')
    if (cleanNumber.length !== 16) {
      toast.error('Card number must be 16 digits')
      return false
    }
    
    // Luhn algorithm
    let sum = 0, isEven = false
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
      toast.error('Invalid card number')
      return false
    }
    
    if (!cardHolder.trim()) {
      toast.error('Card holder name required')
      return false
    }
    if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
      toast.error('Invalid expiry date (MM/YY)')
      return false
    }
    if (cvv.length !== 3) {
      toast.error('CVV must be 3 digits')
      return false
    }
    return true
  }

  const handleSaveCard = async () => {
    if (!validateCard()) return
    
    setSaving(true)
    try {
      const res = await fetch('/api/saved-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          card_type: cardType,
          card_number: cardNumber,
          card_holder: cardHolder,
          expiry_date: expiryDate
        })
      })
      
      if (res.ok) {
        toast.success('Card saved successfully!')
        setShowAddForm(false)
        setCardNumber('')
        setCardHolder('')
        setExpiryDate('')
        setCvv('')
        fetchCards()
      } else {
        toast.error('Failed to save card')
      }
    } catch (error) {
      toast.error('Error saving card')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCard = async (cardId) => {
    try {
      const res = await fetch(`/api/saved-cards?id=${cardId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Card deleted')
        fetchCards()
      }
    } catch (error) {
      toast.error('Error deleting card')
    }
  }

  const getCardIcon = () => <CreditCard className="h-8 w-8" />

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 id="saved-cards-heading" className="text-4xl font-bold">Saved Cards</h1>
          <Button id="add-card-btn" onClick={() => setShowAddForm(!showAddForm)} className="bg-black text-white">
            <Plus className="h-5 w-5 mr-2" />
            Add New Card
          </Button>
        </div>
        
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Add Card Form */}
          {showAddForm && (
            <Card id="add-card-form" className="border-2 border-black">
              <CardHeader>
                <CardTitle>Add New Card</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Card Type</Label>
                  <RadioGroup value={cardType} onValueChange={setCardType} className="flex gap-4 mt-2">
                    <div className="flex items-center">
                      <RadioGroupItem value="visa" id="add-visa" />
                      <Label htmlFor="add-visa" className="ml-2">VISA</Label>
                    </div>
                    <div className="flex items-center">
                      <RadioGroupItem value="mastercard" id="add-mastercard" />
                      <Label htmlFor="add-mastercard" className="ml-2">Mastercard</Label>
                    </div>
                    <div className="flex items-center">
                      <RadioGroupItem value="rupay" id="add-rupay" />
                      <Label htmlFor="add-rupay" className="ml-2">RuPay</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div>
                  <Label htmlFor="add-card-number">Card Number</Label>
                  <Input
                    id="add-card-number"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\s/g, '').match(/.{1,4}/g)?.join(' ') || e.target.value)}
                    maxLength={19}
                    className="border-2"
                  />
                </div>
                <div>
                  <Label htmlFor="add-card-holder">Card Holder Name</Label>
                  <Input
                    id="add-card-holder"
                    placeholder="JOHN DOE"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                    className="border-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="add-expiry">Expiry (MM/YY)</Label>
                    <Input
                      id="add-expiry"
                      placeholder="12/25"
                      value={expiryDate}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '')
                        setExpiryDate(val.length >= 2 ? val.substring(0,2) + '/' + val.substring(2,4) : val)
                      }}
                      maxLength={5}
                      className="border-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="add-cvv">CVV</Label>
                    <Input
                      id="add-cvv"
                      placeholder="123"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                      maxLength={3}
                      type="password"
                      className="border-2"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button id="save-card-btn" onClick={handleSaveCard} disabled={saving} className="bg-black text-white">
                    {saving ? 'Saving...' : 'Save Card'}
                  </Button>
                  <Button id="cancel-add-btn" onClick={() => setShowAddForm(false)} variant="outline">
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Saved Cards List */}
          {cards.length > 0 ? cards.map((card, idx) => (
            <Card key={card.id} id={`card-item-${idx}`} className="saved-card border-2">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getCardIcon()}
                    <div>
                      <p id={`card-type-${idx}`} className="font-bold text-lg capitalize">{card.card_type}</p>
                      <p className="text-sm text-gray-600">•••• •••• •••• {card.card_last4}</p>
                      <p className="text-xs text-gray-500 mt-1">{card.card_holder}</p>
                      <p className="text-xs text-gray-400">Expires: {card.expiry_month}/{card.expiry_year}</p>
                    </div>
                  </div>
                  <Button 
                    id={`delete-card-${idx}`}
                    onClick={() => handleDeleteCard(card.id)}
                    variant="ghost" 
                    className="text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )) : !showAddForm && (
            <Card className="border-2">
              <CardContent className="pt-6 text-center">
                <CreditCard className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No saved cards yet</p>
                <p className="text-sm text-gray-500 mt-2">Click "Add New Card" to save your card details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
