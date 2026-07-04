'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createAssignmentAction(
  courseId: string,
  title: string,
  description: string,
  deadline: string
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
      return { error: 'Unauthorized: Only lecturers can create assignments.' }
    }

    // 3. Verify that this lecturer teaches the course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('lecturer_id')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return { error: 'Mata kuliah tidak ditemukan.' }
    }

    if (course.lecturer_id !== user.id) {
      return { error: 'Unauthorized: Anda hanya dapat membuat tugas untuk mata kuliah yang Anda ampu.' }
    }

    // 4. Validate input fields
    if (!title.trim()) {
      return { error: 'Judul tugas wajib diisi.' }
    }
    if (!deadline.trim()) {
      return { error: 'Tenggat waktu (deadline) wajib diisi.' }
    }

    // 5. Insert new assignment
    const { error: insertError } = await supabase
      .from('assignments')
      .insert({
        course_id: courseId,
        title: title.trim(),
        description: description.trim(),
        deadline: deadline,
      })

    if (insertError) {
      console.error('Insert assignment error:', insertError)
      return { error: `Gagal membuat tugas: ${insertError.message}` }
    }

    revalidatePath('/dosen/assignments')
    return { success: true }
  } catch (error: any) {
    console.error('Unhandled createAssignmentAction error:', error)
    return { error: error.message || 'Terjadi kesalahan yang tidak terduga.' }
  }
}

export async function gradeSubmissionAction(
  submissionId: string,
  scoreTugas: number,
  feedback: string
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
      return { error: 'Unauthorized: Only lecturers can grade submissions.' }
    }

    // 3. Fetch submission and verify course ownership
    const { data: submissionData, error: subError } = await supabase
      .from('submissions')
      .select('id, assignment_id, assignments(course_id)')
      .eq('id', submissionId)
      .single()

    if (subError || !submissionData) {
      return { error: 'Data pengumpulan tugas tidak ditemukan.' }
    }

    const sub = submissionData as any
    const courseId = sub.assignments?.course_id

    if (!courseId) {
      return { error: 'Mata kuliah terkait tugas ini tidak valid.' }
    }

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('lecturer_id')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return { error: 'Mata kuliah tidak ditemukan.' }
    }

    if (course.lecturer_id !== user.id) {
      return { error: 'Unauthorized: Anda hanya dapat menilai tugas untuk mata kuliah yang Anda ampu.' }
    }

    // 4. Validate score range (0 - 100)
    const scoreVal = Number(scoreTugas)
    if (isNaN(scoreVal) || scoreVal < 0 || scoreVal > 100) {
      return { error: 'Nilai tugas harus bernilai antara 0 dan 100.' }
    }

    // 5. Update submission score & feedback
    const { error: updateError } = await supabase
      .from('submissions')
      .update({
        score_tugas: scoreVal,
        feedback: feedback.trim(),
      })
      .eq('id', submissionId)

    if (updateError) {
      console.error('Update submission grade error:', updateError)
      return { error: `Gagal menyimpan nilai: ${updateError.message}` }
    }

    revalidatePath('/dosen/assignments')
    return { success: true }
  } catch (error: any) {
    console.error('Unhandled gradeSubmissionAction error:', error)
    return { error: error.message || 'Terjadi kesalahan yang tidak terduga.' }
  }
}
