import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function POST(request) {
  try {
    // Try to create admin user
    let userId = null
    
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: 'admin@shop.com',
      password: '12345678',
      email_confirm: true,
    })

    if (authData?.user) {
      userId = authData.user.id
    } else if (authError?.message.includes('already registered')) {
      // User exists, get their ID
      const { data: users } = await supabaseAdmin.auth.admin.listUsers()
      const existingUser = users.users.find(u => u.email === 'admin@shop.com')
      userId = existingUser?.id
    } else if (authError) {
      throw authError
    }

    if (userId) {
      // Check if user exists in users table
      const { data: existingUserData } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (existingUserData) {
        // Update existing user to admin
        await supabaseAdmin
          .from('users')
          .update({ role: 'admin' })
          .eq('id', userId)
      } else {
        // Insert new user record
        await supabaseAdmin
          .from('users')
          .insert([{
            id: userId,
            email: 'admin@shop.com',
            role: 'admin',
          }])
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Admin user created/updated successfully',
      userId 
    })
  } catch (error) {
    console.error('Setup admin error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    // Check admin user status
    const { data: users } = await supabaseAdmin.auth.admin.listUsers()
    const adminUser = users.users.find(u => u.email === 'admin@shop.com')
    
    if (!adminUser) {
      return NextResponse.json({ exists: false })
    }

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', adminUser.id)
      .single()

    return NextResponse.json({ 
      exists: true,
      authUser: adminUser,
      dbUser: userData
    })
  } catch (error) {
    console.error('Check admin error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
