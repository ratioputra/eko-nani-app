'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function enrollInCourseAction(courseId: string) {
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

    // 2. Fetch user profile role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return { error: 'Failed to verify user profile.' }
    }

    const role = profile.role?.toUpperCase()
    if (role !== 'MAHASISWA' && role !== 'STUDENT') {
      return { error: 'Unauthorized: Only students can select courses.' }
    }

    // 3. Check if already enrolled to avoid duplicates
    const { data: existing, error: queryError } = await supabase
      .from('grades')
      .select('id')
      .eq('student_id', user.id)
      .eq('course_id', courseId)
      .limit(1)

    if (queryError) {
      console.error('Check existing enrollment error:', queryError)
      return { error: 'Terjadi kesalahan sistem saat mengecek data kelas.' }
    }

    if (existing && existing.length > 0) {
      return { error: 'Mata kuliah ini sudah Anda ambil sebelumnya.' }
    }

    // 4. Insert row into grades (KRS enrollment)
    // Defaulting scores to 0 as specified in the functional requirements
    const { error: insertError } = await supabase
      .from('grades')
      .insert({
        student_id: user.id,
        course_id: courseId,
        score_tugas: 0,
        score_uts: 0,
        score_uas: 0,
      })

    if (insertError) {
      console.error('Enroll in course database error:', insertError)
      return { error: `Gagal mengambil mata kuliah: ${insertError.message}` }
    }

    // 5. Revalidate path to refresh list instantly
    revalidatePath('/mahasiswa/courses')
    revalidatePath('/mahasiswa/dashboard')
    
    return { success: true }
  } catch (error: any) {
    console.error('Unhandled enrollInCourseAction error:', error)
    return { error: error.message || 'An unexpected error occurred.' }
  }
}
