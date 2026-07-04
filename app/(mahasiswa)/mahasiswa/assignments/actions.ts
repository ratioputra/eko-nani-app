'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitAssignmentAction(assignmentId: string, fileUrl: string) {
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
      return { error: 'Unauthorized: Only students can submit assignments.' }
    }

    // 3. Verify that student is enrolled in the course associated with the assignment
    const { data: assignment, error: assignError } = await supabase
      .from('assignments')
      .select('course_id')
      .eq('id', assignmentId)
      .single()

    if (assignError || !assignment) {
      return { error: 'Tugas tidak ditemukan.' }
    }

    const { data: enrollment, error: enrollError } = await supabase
      .from('grades')
      .select('id')
      .eq('student_id', user.id)
      .eq('course_id', assignment.course_id)
      .single()

    if (enrollError || !enrollment) {
      return { error: 'Anda tidak terdaftar di mata kuliah terkait tugas ini.' }
    }

    // 4. Check if student already submitted to decide insert vs update
    const { data: existingSubmission } = await supabase
      .from('submissions')
      .select('id')
      .eq('assignment_id', assignmentId)
      .eq('student_id', user.id)
      .maybeSingle()

    if (existingSubmission) {
      // Update existing submission
      const { error: updateError } = await supabase
        .from('submissions')
        .update({
          file_url: fileUrl,
          submitted_at: new Date().toISOString(),
          score_tugas: null, // Clear grading states for re-review
          feedback: null,
        })
        .eq('id', existingSubmission.id)
        .eq('student_id', user.id)

      if (updateError) {
        console.error('Update submission error:', updateError)
        return { error: `Gagal memperbarui pengumpulan: ${updateError.message}` }
      }
    } else {
      // Insert new submission
      const { error: insertError } = await supabase
        .from('submissions')
        .insert({
          assignment_id: assignmentId,
          student_id: user.id,
          file_url: fileUrl,
          submitted_at: new Date().toISOString(),
        })

      if (insertError) {
        console.error('Insert submission error:', insertError)
        return { error: `Gagal mengumpulkan tugas: ${insertError.message}` }
      }
    }

    revalidatePath('/mahasiswa/assignments')
    return { success: true }
  } catch (error: any) {
    console.error('Unhandled submitAssignmentAction error:', error)
    return { error: error.message || 'Terjadi kesalahan yang tidak terduga.' }
  }
}
