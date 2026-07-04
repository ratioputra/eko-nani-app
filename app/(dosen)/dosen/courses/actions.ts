'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createCourseAction(
  code: string,
  name: string,
  prodi: string,
  semester: number,
  kelas: string,
  tahunAkademik: string
) {
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
    if (role !== 'DOSEN' && role !== 'LECTURER') {
      return { error: 'Unauthorized: Only lecturers can manage courses.' }
    }

    // 3. Validate inputs
    if (!code || code.trim() === '') {
      return { error: 'Kode Mata Kuliah is required.' }
    }

    if (!name || name.trim() === '') {
      return { error: 'Nama Mata Kuliah is required.' }
    }

    if (!prodi || prodi.trim() === '') {
      return { error: 'Program Studi is required.' }
    }

    if (!semester || semester < 1 || semester > 8) {
      return { error: 'Semester must be between 1 and 8.' }
    }

    if (!kelas || kelas.trim() === '') {
      return { error: 'Kelas is required.' }
    }

    if (!tahunAkademik || tahunAkademik.trim() === '') {
      return { error: 'Tahun Akademik is required.' }
    }

    // 4. Insert course into Supabase
    // Setting default grading weights (30%, 30%, 40%) as established
    const { error: insertError } = await supabase
      .from('courses')
      .insert({
        code: code.trim(),
        name: name.trim(),
        prodi: prodi.trim(),
        semester: semester,
        kelas: kelas.trim(),
        tahun_akademik: tahunAkademik.trim(),
        lecturer_id: user.id,
        weight_tugas: 30,
        weight_uts: 30,
        weight_uas: 40,
      })

    if (insertError) {
      console.error('Insert course error:', insertError)
      return { error: `Failed to create course: ${insertError.message}` }
    }

    // 5. Revalidate path to refresh list instantly
    revalidatePath('/dosen/courses')
    return { success: true }
  } catch (error: any) {
    console.error('Unhandled createCourseAction error:', error)
    return { error: error.message || 'An unexpected error occurred.' }
  }
}
