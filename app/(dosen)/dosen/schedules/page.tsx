import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Calendar, GraduationCap } from 'lucide-react'
import ScheduleForm from './ScheduleForm'
import ScheduleListTable from './ScheduleListTable'

export const dynamic = 'force-dynamic'

interface CourseJoined {
  name: string
  code: string
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

export default async function DosenSchedulesPage() {
  const supabase = await createClient()

  // 1. Authenticate user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // 2. Fetch user profile role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    redirect('/login')
  }

  const role = profile.role?.toUpperCase()
  if (role !== 'DOSEN' && role !== 'LECTURER') {
    redirect('/login')
  }

  // 3. Fetch courses taught by the lecturer
  const { data: coursesData } = await supabase
    .from('courses')
    .select('id, name, code')
    .eq('lecturer_id', user.id)

  const courses = coursesData || []

  // 4. Fetch schedules for lecturer's courses
  let schedules: ScheduleRow[] = []
  if (courses.length > 0) {
    const { data: schedulesData } = await supabase
      .from('schedules')
      .select('id, course_id, day, class_date, start_time, end_time, is_online, room_number, meeting_link, courses(name, code)')
      .in('course_id', courses.map(c => c.id))

    schedules = (schedulesData as unknown as ScheduleRow[]) || []
  }

  // 5. Sort schedules chronologically by class_date and start time
  const sortedSchedules = [...schedules].sort((a, b) => {
    const dateA = a.class_date || ''
    const dateB = b.class_date || ''
    const dateDiff = dateA.localeCompare(dateB)
    if (dateDiff !== 0) return dateDiff
    return (a.start_time || '').localeCompare(b.start_time || '')
  })

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-neutral-900 flex flex-col font-sans antialiased">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white px-6 py-4 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 border border-indigo-100">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight block">Portal Dosen</span>
            <span className="text-xs text-neutral-500 font-medium">Layanan Jadwal Kuliah</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-neutral-500 font-mono bg-neutral-100 px-2 py-1 rounded border border-neutral-200">
            {profile.name}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-8 space-y-8">
        
        {/* Page Title section */}
        <div className="flex flex-col gap-1.5 border-b border-neutral-200 pb-5">
          <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest font-sans">Dosen Dashboard</div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            Schedule Management
          </h1>
          <p className="text-neutral-500 text-sm max-w-2xl font-sans">
            Kelola jadwal kelas Anda. Anda dapat menambahkan jadwal kelas baru, menentukan ruangan kelas fisik (offline), atau memasukkan tautan virtual meeting (online).
          </p>
        </div>

        {/* Action Form Grid */}
        <div className="grid grid-cols-1 gap-8">
          <ScheduleForm courses={courses} />

          {/* Schedule List Table Component */}
          <ScheduleListTable initialSchedules={sortedSchedules} courses={courses} />
        </div>
      </main>
    </div>
  )
}
