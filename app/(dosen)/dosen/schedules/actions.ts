'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface CreateScheduleInput {
  courseId: string
  classDate: string
  startTime: string
  endTime: string
  isOnline: boolean
  roomNumber?: string
  meetingLink?: string
}

export async function createScheduleAction(input: CreateScheduleInput) {
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

    // 2. Fetch user profile to verify role
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
      return { error: 'Unauthorized: Only lecturers can manage schedules.' }
    }

    // 3. Verify input fields
    const { courseId, classDate, startTime, endTime, isOnline, roomNumber, meetingLink } = input

    if (!courseId) {
      return { error: 'Course is required.' }
    }

    if (!classDate || classDate.trim() === '') {
      return { error: 'Tanggal perkuliahan wajib diisi.' }
    }

    // Date validation
    const parsedDate = new Date(classDate)
    if (isNaN(parsedDate.getTime())) {
      return { error: 'Format tanggal perkuliahan tidak valid.' }
    }

    // Derive day name in Indonesian (Senin, Selasa, etc.) for backward compatibility
    const dayName = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(parsedDate)

    if (!startTime || !endTime) {
      return { error: 'Start time and end time are required.' }
    }

    // Time validation: format HH:MM
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return { error: 'Invalid time format. Please use HH:MM.' }
    }

    // Convert start and end times to minutes from midnight to compare
    const [startH, startM] = startTime.split(':').map(Number)
    const [endH, endM] = endTime.split(':').map(Number)
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM

    if (endMinutes <= startMinutes) {
      return { error: 'End time must be after start time.' }
    }

    if (isOnline) {
      if (!meetingLink || meetingLink.trim() === '') {
        return { error: 'Meeting link is required for online classes.' }
      }
      try {
        if (!meetingLink.startsWith('http://') && !meetingLink.startsWith('https://')) {
          return { error: 'Meeting link must start with http:// or https://' }
        }
      } catch {
        return { error: 'Invalid meeting link URL.' }
      }
    } else {
      if (!roomNumber || roomNumber.trim() === '') {
        return { error: 'Room number is required for offline classes.' }
      }
    }

    // 4. Verify that the lecturer teaches this course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, name, lecturer_id')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return { error: 'The selected course does not exist.' }
    }

    if (course.lecturer_id !== user.id) {
      return { error: 'Unauthorized: You can only create schedules for courses you teach.' }
    }

    // 5. Insert schedule into the database
    const insertPayload = {
      course_id: courseId,
      day: dayName,
      class_date: classDate,
      start_time: startTime,
      end_time: endTime,
      is_online: isOnline,
      room_number: isOnline ? null : roomNumber?.trim(),
      meeting_link: isOnline ? meetingLink?.trim() : null,
    }

    const { error: insertError } = await supabase
      .from('schedules')
      .insert(insertPayload)

    if (insertError) {
      console.error('Insert schedule error:', insertError)
      return { error: `Failed to save schedule: ${insertError.message}` }
    }

    // 6. Revalidate the schedules dashboard path
    revalidatePath('/dosen/schedules')

    return { success: true }
  } catch (error: any) {
    console.error('Unhandled server action error:', error)
    return { error: error.message || 'An unexpected error occurred.' }
  }
}
