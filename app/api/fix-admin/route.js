import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request) {
  try {
    // Update admin user role in users table
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ role: 'admin' })
      .eq('email', 'admin@shop.com')
      .select()

    if (error) throw error

    return NextResponse.json({ 
      success: true, 
      message: 'Admin role updated successfully',
      data
    })
  } catch (error) {
    console.error('Fix admin error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
