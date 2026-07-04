'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateCourseWeightsAction(
  courseId: string,
  weightKehadiran: number,
  weightTugas: number,
  weightUts: number,
  weightUas: number
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
      return { error: 'Unauthorized: Only lecturers can manage course weights.' }
    }

    // 3. Verify weights sum to 100
    const sum = Number(weightKehadiran) + Number(weightTugas) + Number(weightUts) + Number(weightUas)
    if (sum !== 100) {
      return { error: `Total bobot harus bernilai 100%. Total saat ini: ${sum}%` }
    }

    // 4. Verify that this lecturer teaches the course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('lecturer_id')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return { error: 'The selected course does not exist.' }
    }

    if (course.lecturer_id !== user.id) {
      return { error: 'Unauthorized: You can only edit weights for courses you teach.' }
    }

    // 5. Update weights
    const { error: updateError } = await supabase
      .from('courses')
      .update({
        weight_kehadiran: Number(weightKehadiran),
        weight_tugas: Number(weightTugas),
        weight_uts: Number(weightUts),
        weight_uas: Number(weightUas),
      })
      .eq('id', courseId)

    if (updateError) {
      console.error('Update weights error:', updateError)
      return { error: `Failed to update weights: ${updateError.message}` }
    }

    revalidatePath('/dosen/grades')
    return { success: true }
  } catch (error: any) {
    console.error('Unhandled updateCourseWeightsAction error:', error)
    return { error: error.message || 'An unexpected error occurred.' }
  }
}

export interface SaveGradeItem {
  id: string
  studentId: string
  courseId: string
  scoreKehadiran: number | null
  scoreTugas: number | null
  scoreUts: number | null
  scoreUas: number | null
}

export async function saveAllGradesAction(courseId: string, gradesList: SaveGradeItem[]) {
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
      return { error: 'Unauthorized: Only lecturers can manage student grades.' }
    }

    // 3. Verify that this lecturer teaches the course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('lecturer_id')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return { error: 'The selected course does not exist.' }
    }

    if (course.lecturer_id !== user.id) {
      return { error: 'Unauthorized: You can only edit grades for courses you teach.' }
    }

    // 4. Validate all grades
    for (const g of gradesList) {
      if (g.scoreKehadiran !== null && (g.scoreKehadiran < 0 || g.scoreKehadiran > 100)) {
        return { error: 'Nilai Kehadiran harus bernilai antara 0 dan 100.' }
      }
      if (g.scoreTugas !== null && (g.scoreTugas < 0 || g.scoreTugas > 100)) {
        return { error: 'Nilai Tugas harus bernilai antara 0 dan 100.' }
      }
      if (g.scoreUts !== null && (g.scoreUts < 0 || g.scoreUts > 100)) {
        return { error: 'Nilai UTS harus bernilai antara 0 dan 100.' }
      }
      if (g.scoreUas !== null && (g.scoreUas < 0 || g.scoreUas > 100)) {
        return { error: 'Nilai UAS harus bernilai antara 0 dan 100.' }
      }
    }

    // 5. Build payload for bulk upsert
    // We only update the score columns and match on the primary key id
    const payload = gradesList.map((g) => ({
      id: g.id,
      course_id: g.courseId,
      student_id: g.studentId,
      score_kehadiran: g.scoreKehadiran === null ? null : Number(g.scoreKehadiran),
      score_tugas: g.scoreTugas === null ? null : Number(g.scoreTugas),
      score_uts: g.scoreUts === null ? null : Number(g.scoreUts),
      score_uas: g.scoreUas === null ? null : Number(g.scoreUas),
    }))

    const { error: upsertError } = await supabase
      .from('grades')
      .upsert(payload)

    if (upsertError) {
      console.error('Upsert grades error:', upsertError)
      return { error: `Failed to save grades: ${upsertError.message}` }
    }

    revalidatePath('/dosen/grades')
    return { success: true }
  } catch (error: any) {
    console.error('Unhandled saveAllGradesAction error:', error)
    return { error: error.message || 'An unexpected error occurred.' }
  }
}
