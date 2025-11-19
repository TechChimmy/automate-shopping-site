import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request) {
  try {
    // Try basic fields first (always exist)
    const { data: basicData, error: basicError } = await supabaseAdmin
      .from('users')
      .select('id, email, role, created_at')
      .order('created_at', { ascending: false })

    if (basicError) throw basicError

    // Try to get name and phone fields separately
    let usersWithExtras = basicData
    
    try {
      const { data: extraData, error: extraError } = await supabaseAdmin
        .from('users')
        .select('id, name, phone')
      
      if (!extraError && extraData) {
        // Merge the extra data
        usersWithExtras = basicData.map(user => {
          const extra = extraData.find(e => e.id === user.id)
          return {
            ...user,
            name: extra?.name || null,
            phone: extra?.phone || null
          }
        })
      } else {
        // If columns don't exist, add null values
        usersWithExtras = basicData.map(user => ({
          ...user,
          name: null,
          phone: null
        }))
      }
    } catch (err) {
      console.log('Name/phone columns do not exist, using defaults')
      usersWithExtras = basicData.map(user => ({
        ...user,
        name: null,
        phone: null
      }))
    }

    return NextResponse.json({ data: usersWithExtras || [] })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
