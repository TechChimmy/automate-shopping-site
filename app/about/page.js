'use client'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        <h1 id="about-heading" className="text-4xl font-bold text-black mb-8">About ShopSuite</h1>
        <div className="max-w-3xl mx-auto space-y-6">
          <p className="text-gray-700 leading-relaxed">
            Welcome to ShopSuite - Your trusted e-commerce destination for quality products at great prices.
          </p>
          <p className="text-gray-700 leading-relaxed">
            We are committed to providing an exceptional shopping experience with a wide range of products,
            secure payments, and reliable delivery services.
          </p>
          <div className="bg-white p-6 rounded-lg border-2">
            <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
            <p className="text-gray-700">
              To make online shopping accessible, affordable, and enjoyable for everyone.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
