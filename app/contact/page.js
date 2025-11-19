'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Mail, Phone, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })

  const handleSubmit = (e) => {
    e.preventDefault()
    toast.success('Message sent! We\'ll get back to you soon.')
    setFormData({ name: '', email: '', message: '' })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        <h1 id="contact-heading" className="text-4xl font-bold text-black mb-8">Contact Us</h1>
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Send us a Message</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="contact-name">Name</Label>
                  <Input id="contact-name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required className="border-2" />
                </div>
                <div>
                  <Label htmlFor="contact-email">Email</Label>
                  <Input id="contact-email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required className="border-2" />
                </div>
                <div>
                  <Label htmlFor="contact-message">Message</Label>
                  <Textarea id="contact-message" value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} required className="border-2" rows={5} />
                </div>
                <Button id="contact-submit-btn" type="submit" className="w-full bg-black text-white">Send Message</Button>
              </form>
            </CardContent>
          </Card>
          <div className="space-y-6">
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Mail className="h-6 w-6" />
                  <div>
                    <p className="font-semibold">Email</p>
                    <p className="text-gray-600">support@shopsuite.com</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Phone className="h-6 w-6" />
                  <div>
                    <p className="font-semibold">Phone</p>
                    <p className="text-gray-600">+91 1234567890</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <MapPin className="h-6 w-6" />
                  <div>
                    <p className="font-semibold">Address</p>
                    <p className="text-gray-600">Mumbai, Maharashtra, India</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
