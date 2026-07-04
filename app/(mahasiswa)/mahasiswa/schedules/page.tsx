import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StudentScheduleClient from './StudentScheduleClient'

export const dynamic = 'force-dynamic'

interface CourseJoined {
  name: string
  code: string
  lecturer_id: string
  profiles: {
    name: string
  } | null
}

interface ScheduleRow {
  id: string
  course_id: string
  day: string
  class_date: string | null
  start_time: string
  end_time: string
  is_online: boolean
  room_number: string | null
  meeting_link: string | null
  courses: CourseJoined | null
}

export default async function MahasiswaSchedulesPage() {
  const supabase = await createClient()

  // 1. Authenticate user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // 2. Fetch user profile role and name
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    redirect('/login')
  }

  const role = profile.role?.toUpperCase()
  if (role !== 'MAHASISWA' && role !== 'STUDENT') {
    redirect('/login')
  }

  // 3. Fetch enrolled course IDs from grades
  const { data: gradesData } = await supabase
    .from('grades')
    .select('course_id')
    .eq('student_id', user.id)

  const enrolledCourseIds = gradesData?.map((g) => g.course_id) || []

  // 4. Fetch schedules for enrolled courses
  let schedules: ScheduleRow[] = []
  if (enrolledCourseIds.length > 0) {
    const { data: schedulesData } = await supabase
      .from('schedules')
      .select(`
        id,
        course_id,
        day,
        class_date,
        start_time,
        end_time,
        is_online,
        room_number,
        meeting_link,
        courses(
          name,
          code,
          lecturer_id,
          profiles:lecturer_id(name)
        )
      `)
      .in('course_id', enrolledCourseIds)

    schedules = (schedulesData as unknown as ScheduleRow[]) || []
  }

  return (
    <StudentScheduleClient
      profile={profile}
      enrolledCourseIds={enrolledCourseIds}
      initialSchedules={schedules}
    />
  )
}
