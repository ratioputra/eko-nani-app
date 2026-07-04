'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createAnnouncementAction(courseId: string, title: string, content: string) {
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
      return { error: 'Unauthorized: Only lecturers can publish announcements.' }
    }

    // 3. Input validation
    if (!courseId) {
      return { error: 'Mata Kuliah target harus dipilih.' }
    }

    if (!title || title.trim() === '') {
      return { error: 'Judul pengumuman harus diisi.' }
    }

    if (!content || content.trim() === '') {
      return { error: 'Konten pengumuman harus diisi.' }
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
      return { error: 'Unauthorized: You can only publish announcements for courses you teach.' }
    }

    // 5. Insert announcement
    const { error: insertError } = await supabase
      .from('announcements')
      .insert({
        course_id: courseId,
        title: title.trim(),
        content: content.trim(),
      })

    if (insertError) {
      console.error('Insert announcement error:', insertError)
      return { error: `Failed to post announcement: ${insertError.message}` }
    }

    // 6. Revalidate page to refresh announcements list
    revalidatePath('/dosen/announcements')
    return { success: true }
  } catch (error: any) {
    console.error('Unhandled createAnnouncementAction error:', error)
    return { error: error.message || 'An unexpected error occurred.' }
  }
}
