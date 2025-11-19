'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/use-user'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Edit, Trash2, Tag } from 'lucide-react'
import { toast } from 'sonner'

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPromo, setEditingPromo] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discount_percentage: '',
    discount_amount: '',
    code: '',
    start_date: '',
    end_date: '',
    active: true
  })
  const { user, userRole, loading: userLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!userLoading) {
      if (!user || userRole !== 'admin') {
        router.push('/')
      } else {
        fetchPromotions()
      }
    }
  }, [user, userRole, userLoading, router])

  const fetchPromotions = async () => {
    try {
      const res = await fetch('/api/promotions')
      const data = await res.json()
      setPromotions(data.data || [])
    } catch (error) {
      console.error('Error fetching promotions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const method = editingPromo ? 'PUT' : 'POST'
      const body = editingPromo ? { ...formData, id: editingPromo.id } : formData

      const res = await fetch('/api/promotions', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (res.ok) {
        toast.success(editingPromo ? 'Promotion updated' : 'Promotion created')
        setDialogOpen(false)
        resetForm()
        fetchPromotions()
      } else {
        toast.error('Failed to save promotion')
      }
    } catch (error) {
      console.error('Error saving promotion:', error)
      toast.error('Failed to save promotion')
    }
  }

  const handleEdit = (promo) => {
    setEditingPromo(promo)
    setFormData({
      name: promo.name,
      description: promo.description || '',
      discount_percentage: promo.discount_percentage || '',
      discount_amount: promo.discount_amount || '',
      code: promo.code || '',
      start_date: promo.start_date ? new Date(promo.start_date).toISOString().split('T')[0] : '',
      end_date: promo.end_date ? new Date(promo.end_date).toISOString().split('T')[0] : '',
      active: promo.active
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this promotion?')) return

    try {
      const res = await fetch(`/api/promotions?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Promotion deleted')
        fetchPromotions()
      }
    } catch (error) {
      console.error('Error deleting promotion:', error)
      toast.error('Failed to delete promotion')
    }
  }

  const resetForm = () => {
    setEditingPromo(null)
    setFormData({
      name: '',
      description: '',
      discount_percentage: '',
      discount_amount: '',
      code: '',
      start_date: '',
      end_date: '',
      active: true
    })
  }

  if (userLoading || loading) {
    return (
      <div className=\"min-h-screen flex items-center justify-center bg-gray-50\">
        <div className=\"animate-spin rounded-full h-12 w-12 border-b-2 border-black\"></div>
      </div>
    )
  }

  return (
    <div className=\"min-h-screen bg-gray-50\">
      <div className=\"container mx-auto px-4 py-8\">
        <div className=\"flex justify-between items-center mb-8\">
          <div>
            <h1 className=\"text-4xl font-bold text-black\">Promotions Management</h1>
            <p className=\"text-gray-600 mt-2\">Create and manage promotional offers</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button className=\"bg-black text-white hover:bg-gray-800\">
                <Plus className=\"h-4 w-4 mr-2\" />
                Add Promotion
              </Button>
            </DialogTrigger>
            <DialogContent className=\"max-w-2xl\">
              <DialogHeader>
                <DialogTitle>{editingPromo ? 'Edit Promotion' : 'Create New Promotion'}</DialogTitle>
                <DialogDescription>
                  {editingPromo ? 'Update promotion details' : 'Add a new promotional offer'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className=\"grid gap-4 py-4\">
                  <div className=\"grid grid-cols-2 gap-4\">
                    <div className=\"space-y-2\">
                      <Label htmlFor=\"name\">Promotion Name *</Label>
                      <Input
                        id=\"name\"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className=\"space-y-2\">
                      <Label htmlFor=\"code\">Promo Code</Label>
                      <Input
                        id=\"code\"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        placeholder=\"SAVE20\"
                      />
                    </div>
                  </div>
                  <div className=\"space-y-2\">
                    <Label htmlFor=\"description\">Description</Label>
                    <Textarea
                      id=\"description\"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div className=\"grid grid-cols-2 gap-4\">
                    <div className=\"space-y-2\">
                      <Label htmlFor=\"discount_percentage\">Discount % (Optional)</Label>
                      <Input
                        id=\"discount_percentage\"
                        type=\"number\"
                        step=\"0.01\"
                        value={formData.discount_percentage}
                        onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                      />
                    </div>
                    <div className=\"space-y-2\">
                      <Label htmlFor=\"discount_amount\">Discount Amount (Optional)</Label>
                      <Input
                        id=\"discount_amount\"
                        type=\"number\"
                        step=\"0.01\"
                        value={formData.discount_amount}
                        onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className=\"grid grid-cols-2 gap-4\">
                    <div className=\"space-y-2\">
                      <Label htmlFor=\"start_date\">Start Date</Label>
                      <Input
                        id=\"start_date\"
                        type=\"date\"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      />
                    </div>
                    <div className=\"space-y-2\">
                      <Label htmlFor=\"end_date\">End Date</Label>
                      <Input
                        id=\"end_date\"
                        type=\"date\"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className=\"flex items-center space-x-2\">
                    <Switch
                      id=\"active\"
                      checked={formData.active}
                      onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                    />
                    <Label htmlFor=\"active\">Active</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button type=\"submit\" className=\"bg-black text-white hover:bg-gray-800\">
                    {editingPromo ? 'Update Promotion' : 'Create Promotion'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {promotions.length === 0 ? (
          <Card className=\"border-2\">
            <CardContent className=\"pt-12 pb-12 text-center\">
              <Tag className=\"h-20 w-20 text-gray-400 mx-auto mb-4\" />
              <h2 className=\"text-2xl font-semibold mb-2\">No promotions yet</h2>
              <p className=\"text-gray-600 mb-6\">Create your first promotional offer</p>
            </CardContent>
          </Card>
        ) : (
          <div className=\"grid gap-4\">
            {promotions.map((promo) => (
              <Card key={promo.id} className=\"border-2 hover:border-black transition-colors\">
                <CardContent className=\"pt-6\">
                  <div className=\"flex justify-between items-start\">
                    <div className=\"flex-1\">
                      <div className=\"flex items-center gap-3 mb-2\">
                        <h3 className=\"text-xl font-bold\">{promo.name}</h3>
                        {promo.code && (
                          <span className=\"bg-black text-white px-3 py-1 rounded text-sm font-mono\">
                            {promo.code}
                          </span>
                        )}
                        <span className={`px-3 py-1 rounded text-sm font-semibold ${
                          promo.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {promo.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {promo.description && (
                        <p className=\"text-gray-600 mb-3\">{promo.description}</p>
                      )}
                      <div className=\"flex gap-4 text-sm text-gray-600\">
                        {promo.discount_percentage && (
                          <span>Discount: {promo.discount_percentage}%</span>
                        )}
                        {promo.discount_amount && (
                          <span>Amount: ${promo.discount_amount}</span>
                        )}
                        {promo.start_date && (
                          <span>From: {new Date(promo.start_date).toLocaleDateString()}</span>
                        )}
                        {promo.end_date && (
                          <span>To: {new Date(promo.end_date).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className=\"flex gap-2\">
                      <Button
                        variant=\"outline\"
                        size=\"icon\"
                        onClick={() => handleEdit(promo)}
                        className=\"border-2\"
                      >
                        <Edit className=\"h-4 w-4\" />
                      </Button>
                      <Button
                        variant=\"destructive\"
                        size=\"icon\"
                        onClick={() => handleDelete(promo.id)}
                      >
                        <Trash2 className=\"h-4 w-4\" />
                      </Button>
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
