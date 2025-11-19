'use client'

export default function Footer() {
  return (
    <footer className="bg-black text-white py-8 mt-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-xl mb-4">ShopSuite</h3>
            <p className="text-gray-400">Your one-stop shop for quality products</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="/products" className="hover:text-white">Products</a></li>
              <li><a href="/about" className="hover:text-white">About Us</a></li>
              <li><a href="/contact" className="hover:text-white">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <p className="text-gray-400">Email: support@shopsuite.com</p>
            <p className="text-gray-400">Phone: +91 1234567890</p>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-400">
          <p>© 2024 ShopSuite. All rights reserved.</p>
          <p className="mt-2 text-sm">Managed by <a href="https://theauto-mate.com/" target="_blank" rel="noopener noreferrer" className="text-white font-semibold hover:underline">The Auto-Mate</a></p>
        </div>
      </div>
    </footer>
  )
}
