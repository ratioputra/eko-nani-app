'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  let redirectTo: string | null = null

  try {
    const supabase = await createClient()
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      return { error: authError.message }
    }

    if (!data.user) {
      return { error: 'Failed to authenticate user.' }
    }

    // Print the user ID to the server console right after a successful login
    console.log("Logged in user ID:", data.user?.id)

    // Fetch user profile role from public.profiles table matching the authenticated user ID
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    // Log the output of that query
    console.log("Profile query result:", profileData, profileError)

    if (profileError) {
      return { error: `Profile query failed: ${profileError.message}` }
    }

    if (!profileData) {
      return { error: 'User profile or role not found in database.' }
    }

    const role = profileData.role?.toUpperCase()

    if (role === 'DOSEN') {
      redirectTo = '/dosen/dashboard'
    } else if (role === 'MAHASISWA') {
      redirectTo = '/mahasiswa/dashboard'
    } else {
      return { error: `Access Denied: Invalid role "${profileData.role}".` }
    }
  } catch (error: any) {
    return { error: error.message || 'An unexpected error occurred.' }
  }

  // Move the actual redirect call completely OUTSIDE and AFTER the try...catch block
  if (redirectTo) {
    redirect(redirectTo)
  }
}
