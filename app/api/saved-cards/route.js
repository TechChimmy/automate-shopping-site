import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('saved_cards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ data: data || [] })
  } catch (error) {
    console.error('Error fetching cards:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { user_id, card_type, card_number, card_holder, expiry_date } = await request.json()

    if (!user_id || !card_type || !card_number || !card_holder || !expiry_date) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 })
    }

    // Extract last 4 digits and expiry
    const last4 = card_number.replace(/\s/g, '').slice(-4)
    const [month, year] = expiry_date.split('/')

    const { data, error } = await supabaseAdmin
      .from('saved_cards')
      .insert([{
        user_id,
        card_type,
        card_last4: last4,
        card_holder,
        expiry_month: month,
        expiry_year: year,
        is_default: false
      }])
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error saving card:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const cardId = searchParams.get('id')

    if (!cardId) {
      return NextResponse.json({ error: 'Card ID required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('saved_cards')
      .delete()
      .eq('id', cardId)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting card:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}