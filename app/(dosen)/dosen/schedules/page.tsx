import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Calendar, Video, MapPin, ExternalLink, GraduationCap, Clock, BookOpen } from 'lucide-react'
import ScheduleForm from './ScheduleForm'

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

function formatTime(timeStr: string | null): string {
  if (!timeStr) return ''
  const parts = timeStr.split(':')
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`
  }
  return timeStr
}

function formatClassDate(dateStr: string | null, dayName: string): string {
  if (!dateStr) return dayName
  try {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Jakarta'
    }).format(date)
  } catch {
    return `${dayName}, ${dateStr}`
  }
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
          <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Dosen Dashboard</div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            Schedule Management
          </h1>
          <p className="text-neutral-500 text-sm max-w-2xl">
            Kelola jadwal kelas Anda. Anda dapat menambahkan jadwal kelas baru, menentukan ruangan kelas fisik (offline), atau memasukkan tautan virtual meeting (online).
          </p>
        </div>

        {/* Action Form Grid */}
        <div className="grid grid-cols-1 gap-8">
          <ScheduleForm courses={courses} />

          {/* Schedule Table Card */}
          <div className="bg-white border border-neutral-200 shadow-sm rounded-lg overflow-hidden">
            <div className="border-b border-neutral-100 bg-neutral-50/50 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-neutral-900 font-semibold text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  Jadwal Mengajar Anda
                </h2>
                <p className="text-neutral-500 text-xs mt-0.5">
                  Berikut adalah seluruh jadwal kuliah aktif yang Anda ampu semester ini.
                </p>
              </div>
              <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-100">
                {sortedSchedules.length} Jadwal
              </span>
            </div>

            {sortedSchedules.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-neutral-50 border border-neutral-200 flex items-center justify-center text-neutral-400 mb-3">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-neutral-800">Belum ada jadwal mengajar</h3>
                <p className="text-xs text-neutral-500 mt-1 max-w-sm">
                  Anda belum menambahkan jadwal mengajar untuk mata kuliah Anda. Silakan isi form di atas untuk membuat jadwal baru.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50/50 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                      <th className="px-6 py-3">Mata Kuliah</th>
                      <th className="px-6 py-3">Waktu</th>
                      <th className="px-6 py-3">Metode</th>
                      <th className="px-6 py-3">Ruangan / Link</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-sm">
                    {sortedSchedules.map((schedule) => {
                      const courseName = schedule.courses?.name || 'Mata Kuliah'
                      const courseCode = schedule.courses?.code || '-'
                      return (
                        <tr key={schedule.id} className="hover:bg-neutral-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-semibold text-neutral-900">{courseName}</span>
                              <span className="text-xs text-neutral-500 font-mono font-medium mt-0.5">{courseCode}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-neutral-800">
                              <Clock className="w-4 h-4 text-neutral-400" />
                              <span className="font-medium">{formatClassDate(schedule.class_date, schedule.day)}</span>
                              <span className="text-neutral-400">•</span>
                              <span className="text-neutral-600">
                                {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {schedule.is_online ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                                <Video className="w-3 h-3" />
                                Online
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-neutral-100 text-neutral-700 border border-neutral-200">
                                <MapPin className="w-3 h-3" />
                                Offline
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {schedule.is_online ? (
                              schedule.meeting_link ? (
                                <a
                                  href={schedule.meeting_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 hover:underline font-medium"
                                >
                                  Gabung Kelas
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : (
                                <span className="text-neutral-400 text-xs italic">Link tidak tersedia</span>
                              )
                            ) : (
                              <span className="font-semibold text-neutral-800 flex items-center gap-1">
                                {schedule.room_number || '-'}
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
