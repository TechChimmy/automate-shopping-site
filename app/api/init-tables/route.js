import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request) {
  try {
    const results = []

    // Create cart table
    try {
      const { data: cartTest } = await supabaseAdmin.from('cart').select('*').limit(1)
      results.push({ table: 'cart', status: 'exists' })
    } catch (e) {
      results.push({ table: 'cart', status: 'needs_creation', error: e.message })
    }

    // Create wishlist table
    try {
      const { data: wishlistTest } = await supabaseAdmin.from('wishlist').select('*').limit(1)
      results.push({ table: 'wishlist', status: 'exists' })
    } catch (e) {
      results.push({ table: 'wishlist', status: 'needs_creation', error: e.message })
    }

    // Create promotions table
    try {
      const { data: promTest } = await supabaseAdmin.from('promotions').select('*').limit(1)
      results.push({ table: 'promotions', status: 'exists' })
    } catch (e) {
      results.push({ table: 'promotions', status: 'needs_creation', error: e.message })
    }

    return NextResponse.json({ results, message: 'Table check complete' })
  } catch (error) {
    console.error('Init tables error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
