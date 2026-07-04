'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface SaveAttendanceItem {
  gradeId: string
  status: 'HADIR' | 'TIDAK HADIR'
}

export async function saveAttendanceAction(
  courseId: string,
  pertemuanKe: number,
  attendanceList: SaveAttendanceItem[]
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
      return { error: 'Unauthorized: Only lecturers can record attendance.' }
    }

    // 3. Validate pertemuan_ke
    const sessionNum = Number(pertemuanKe)
    if (isNaN(sessionNum) || sessionNum < 1 || sessionNum > 16) {
      return { error: 'Pertemuan harus bernilai antara 1 dan 16.' }
    }

    // 4. Verify that this lecturer teaches the course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('lecturer_id')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return { error: 'Mata kuliah yang dipilih tidak ditemukan.' }
    }

    if (course.lecturer_id !== user.id) {
      return { error: 'Unauthorized: Anda hanya dapat mengelola presensi untuk mata kuliah yang Anda ampu.' }
    }

    // 5. Build payload for bulk upsert
    const payload = attendanceList.map((item) => ({
      grade_id: item.gradeId,
      pertemuan_ke: sessionNum,
      status: item.status,
    }))

    // Perform upsert matching on unique constraint (grade_id, pertemuan_ke)
    const { error: upsertError } = await supabase
      .from('attendance')
      .upsert(payload, { onConflict: 'grade_id,pertemuan_ke' })

    if (upsertError) {
      console.error('Upsert attendance error:', upsertError)
      return { error: `Gagal menyimpan presensi: ${upsertError.message}` }
    }

    revalidatePath('/dosen/attendance')
    // Revalidate student dashboard views too
    revalidatePath('/mahasiswa/dashboard')
    revalidatePath('/mahasiswa/grades')

    return { success: true }
  } catch (error: any) {
    console.error('Unhandled saveAttendanceAction error:', error)
    return { error: error.message || 'Terjadi kesalahan yang tidak terduga.' }
  }
}
