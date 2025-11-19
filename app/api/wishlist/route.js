import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request) {
  try {
    const { user_id, product_id } = await request.json()

    if (!user_id || !product_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if already in wishlist
    const { data: existing } = await supabaseAdmin
      .from('wishlist')
      .select('*')
      .eq('user_id', user_id)
      .eq('product_id', product_id)
      .single()

    if (existing) {
      return NextResponse.json({ data: existing, message: 'Already in wishlist' })
    }

    const { data, error } = await supabaseAdmin
      .from('wishlist')
      .insert([{
        id: uuidv4(),
        user_id,
        product_id
      }])
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Wishlist error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')

    if (!user_id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('wishlist')
      .select('*')
      .eq('user_id', user_id)

    if (error) throw error
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Get wishlist error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const wishlist_id = searchParams.get('id')

    if (!wishlist_id) {
      return NextResponse.json({ error: 'Wishlist ID required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('wishlist')
      .delete()
      .eq('id', wishlist_id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete wishlist error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
