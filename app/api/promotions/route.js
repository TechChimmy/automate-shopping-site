import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request) {
  try {
    const { name, description, discount_percentage, discount_amount, code, start_date, end_date, active } = await request.json()

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('promotions')
      .insert([{
        id: uuidv4(),
        name,
        description,
        discount_percentage,
        discount_amount,
        code,
        start_date,
        end_date,
        active: active !== undefined ? active : true
      }])
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Create promotion error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const { data, error } = await supabaseAdmin
      .from('promotions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Get promotions error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const { id, name, description, discount_percentage, discount_amount, code, start_date, end_date, active } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (discount_percentage !== undefined) updateData.discount_percentage = discount_percentage
    if (discount_amount !== undefined) updateData.discount_amount = discount_amount
    if (code !== undefined) updateData.code = code
    if (start_date !== undefined) updateData.start_date = start_date
    if (end_date !== undefined) updateData.end_date = end_date
    if (active !== undefined) updateData.active = active

    const { data, error } = await supabaseAdmin
      .from('promotions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Update promotion error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const promo_id = searchParams.get('id')

    if (!promo_id) {
      return NextResponse.json({ error: 'Promotion ID required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('promotions')
      .delete()
      .eq('id', promo_id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete promotion error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
