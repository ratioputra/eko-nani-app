'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveOnboardingAction(name: string, nim: string) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'Unauthorized: Please log in again.' }
    }

    // 2. Validate inputs
    if (!name || name.trim() === '') {
      return { error: 'Nama Lengkap harus diisi.' }
    }

    if (!nim || nim.trim() === '') {
      return { error: 'NIM harus diisi.' }
    }

    // 3. Update profile row in Supabase profiles table
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        name: name.trim(),
        nim: nim.trim(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Update profile onboarding error:', updateError)
      return { error: `Gagal memperbarui profil: ${updateError.message}` }
    }

    // 4. Revalidate cache to refresh student dashboard contents
    revalidatePath('/mahasiswa/dashboard')
    return { success: true }
  } catch (error: any) {
    console.error('Unhandled saveOnboardingAction error:', error)
    return { error: error.message || 'An unexpected error occurred.' }
  }
}
