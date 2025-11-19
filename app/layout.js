import './globals.css'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Toaster } from 'sonner'

export const metadata = {
  title: 'ShopSuite - E-Commerce Platform',
  description: 'Complete e-commerce platform with admin management',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
