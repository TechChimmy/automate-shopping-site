import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request) {
  try {
    const { user_id, items, total_amount, payment_method, shipping_address } = await request.json()

    if (!user_id || !items || !total_amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create individual orders for each item (compatible with existing schema)
    const orderPromises = items.map(async (item) => {
      const orderId = uuidv4()

      const base = {
        id: orderId,
        user_id,
        product_id: item.product_id,
        quantity: item.quantity,
        total_price: item.total,
        status: 'pending'
      }
      const withExtras = { ...base, payment_method, shipping_address }

      // Try inserting with payment_method/shipping_address; if columns don't exist, retry with base fields only
      let result = await supabaseAdmin
        .from('orders')
        .insert([withExtras])
        .select()
        .single()

      if (result.error && /does not exist|column|payment_method|shipping_address/i.test(result.error.message || '')) {
        result = await supabaseAdmin
          .from('orders')
          .insert([base])
          .select()
          .single()
      }

      return result
    })

    const results = await Promise.all(orderPromises)
    
    // Check if any order failed
    const failedOrder = results.find(result => result.error)
    if (failedOrder) {
      throw failedOrder.error
    }

    return NextResponse.json({ 
      success: true,
      data: results[0].data, // Return first order for redirect
      message: 'Orders created successfully'
    })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const orderId = searchParams.get('id')
    let createdAt = searchParams.get('created_at')

    let query = supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (orderId) {
      query = query.eq('id', orderId)
    } else if (userId && createdAt) {
      // Normalize createdAt if '+' got converted to space in query parsing
      if (createdAt && createdAt.includes(' ')) {
        createdAt = createdAt.replace(' ', '+')
      }
      query = query.eq('user_id', userId).eq('created_at', createdAt)
    } else if (userId) {
      query = query.eq('user_id', userId)
    } else {
      return NextResponse.json({ error: 'User ID or Order ID required' }, { status: 400 })
    }

    const { data, error } = await query

    if (error) throw error

    const orders = data || []

    const productIds = [...new Set(orders.map(o => o.product_id).filter(Boolean))]
    let productsById = {}

    if (productIds.length > 0) {
      const { data: products, error: productsError } = await supabaseAdmin
        .from('products')
        .select('id, name, price, image_url')
        .in('id', productIds)

      if (productsError) throw productsError

      productsById = Object.fromEntries((products || []).map(p => [p.id, p]))
    }

    const formattedData = orders.map(order => ({
      ...order,
      product: productsById[order.product_id] || null
    }))

    return NextResponse.json({ data: formattedData })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const { id, status } = await request.json()

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Update order error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const order_id = searchParams.get('id')

    if (!order_id) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('orders')
      .delete()
      .eq('id', order_id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete order error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
