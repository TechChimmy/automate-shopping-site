import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('product_id')

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select('*, users(name, email)')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ data: data || [] })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { product_id, user_id, rating, review_text } = await request.json()

    if (!product_id || !user_id || !rating || !review_text) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('reviews')
      .insert([{ product_id, user_id, rating, review_text }])
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}