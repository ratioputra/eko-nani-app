import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (!code) {
    console.error('OAuth Callback: No code parameter found')
    return NextResponse.redirect(`${requestUrl.origin}/login?error=oauth_failed`)
  }

  try {
    const supabase = await createClient()
    
    // 1. Exchange OAuth authorization code for session
    const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

    if (sessionError) {
      console.error('OAuth Callback: Code exchange failed:', sessionError)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=oauth_failed`)
    }

    // 2. Add small delay (500ms) to ensure cookie storage completes writing successfully
    console.log('OAuth Callback: Code exchange success. Delaying slightly to finalize session...')
    await new Promise((resolve) => setTimeout(resolve, 500))

    // 3. Confirm logged-in session state
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('OAuth Callback: Failed to retrieve authenticated user:', userError)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=oauth_failed`)
    }

    console.log('OAuth Callback: Authenticated User ID resolved:', user.id)

    // 4. Fetch user profile row with up to 3 retries (resolving Postgres trigger replication delays)
    let profile = null
    let profileError = null

    for (let attempt = 1; attempt <= 3; attempt++) {
      console.log(`OAuth Callback: Fetching profile (Attempt ${attempt}/3)...`)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!error && data) {
        profile = data
        profileError = null
        break
      }
      profileError = error
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }

    let activeProfile = profile

    // 5. Profile auto-provisioning fallback if missing
    if (profileError || !profile) {
      console.warn('OAuth Callback: Profile row not found after retries. Provisioning default profile...', profileError?.message)
      const defaultName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Mahasiswa'
      
      const { data: insertedData, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          name: defaultName,
          email: user.email || '',
          role: 'MAHASISWA' // default signup role
        })
        .select()
        .single()

      if (!insertError && insertedData) {
        console.log('OAuth Callback: Default profile successfully created')
        activeProfile = insertedData
      } else {
        console.error('OAuth Callback: Insert profile fallback failed:', insertError)
        // Mock profile to route user safely to dashboard where they can complete registration
        activeProfile = {
          id: user.id,
          name: defaultName,
          email: user.email || '',
          role: 'MAHASISWA',
          nim: null
        }
      }
    }

    const role = activeProfile?.role?.toUpperCase()

    // 6. Redirect dynamically based on role and onboarding status
    if (role === 'DOSEN' || role === 'LECTURER') {
      console.log('OAuth Callback: Redirecting Lecturer to dashboard')
      return NextResponse.redirect(`${requestUrl.origin}/dosen/dashboard`)
    } else {
      const nameVal = activeProfile?.name
      const nimVal = activeProfile?.nim
      const needsOnboarding = !nameVal || nameVal.trim() === '' || !nimVal || nimVal.trim() === ''

      console.log('OAuth Callback: Student resolved. Needs onboarding:', needsOnboarding)
      return NextResponse.redirect(`${requestUrl.origin}/mahasiswa/dashboard`)
    }

  } catch (err) {
    console.error('OAuth Callback: Unhandled route exception:', err)
    return NextResponse.redirect(`${requestUrl.origin}/login?error=oauth_failed`)
  }
}
