import { createClient } from '@supabase/supabase-js'

// Admin client with service role key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET() {
  try {
    // Use admin client to get accurate count bypassing RLS
    const { count, error } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.error('Error fetching user count:', error)
      return Response.json({ error: 'Failed to fetch user count' }, { status: 500 })
    }

    return Response.json({ count })
  } catch (error) {
    console.error('Error in users count API:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}