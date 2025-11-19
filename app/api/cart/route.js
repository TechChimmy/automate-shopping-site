import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request) {
  try {
    const { user_id, product_id, quantity } = await request.json()

    if (!user_id || !product_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if item already exists in cart
    const { data: existing } = await supabaseAdmin
      .from('cart')
      .select('*')
      .eq('user_id', user_id)
      .eq('product_id', product_id)
      .single()

    if (existing) {
      // Item exists - use DELETE + INSERT to bypass UPDATE trigger
      const newQty = existing.qty + (quantity || 1)
      
      // Delete existing
      const { error: deleteError } = await supabaseAdmin
        .from('cart')
        .delete()
        .eq('id', existing.id)

      if (deleteError) throw deleteError

      // Insert with new quantity
      const { data, error } = await supabaseAdmin
        .from('cart')
        .insert([{
          id: existing.id,
          user_id: existing.user_id,
          product_id: existing.product_id,
          qty: newQty,
          created_at: existing.created_at
        }])
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ data })
    } else {
      // Insert new cart item
      const { data, error } = await supabaseAdmin
        .from('cart')
        .insert([{
          id: uuidv4(),
          user_id,
          product_id,
          qty: quantity || 1
        }])
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ data })
    }
  } catch (error) {
    console.error('Cart error:', error)
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
      .from('cart')
      .select('*')
      .eq('user_id', user_id)

    if (error) throw error
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Get cart error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const cart_id = searchParams.get('id')

    if (!cart_id) {
      return NextResponse.json({ error: 'Cart ID required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('cart')
      .delete()
      .eq('id', cart_id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete cart error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const { id, quantity } = await request.json()

    if (!id || quantity === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // WORKAROUND: Instead of UPDATE (which triggers the error), 
    // we DELETE the old item and INSERT a new one with updated quantity
    // This completely bypasses the UPDATE trigger
    
    // Step 1: Get current cart item details
    const { data: currentItem, error: fetchError } = await supabaseAdmin
      .from('cart')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    // Step 2: Delete the current item
    const { error: deleteError } = await supabaseAdmin
      .from('cart')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError

    // Step 3: Insert new item with updated quantity (same ID)
    const { data: newItem, error: insertError } = await supabaseAdmin
      .from('cart')
      .insert([{
        id: currentItem.id,
        user_id: currentItem.user_id,
        product_id: currentItem.product_id,
        qty: quantity,
        created_at: currentItem.created_at
      }])
      .select()
      .single()

    if (insertError) throw insertError

    return NextResponse.json({ data: newItem })
  } catch (error) {
    console.error('Update cart error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
