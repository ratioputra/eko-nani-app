import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Calendar as CalendarIcon, GraduationCap, MapPin, ExternalLink, Clock, BookOpen, User, BookMarked } from 'lucide-react'

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

  // 5. Group and sort schedules by days
  const daysOfWeek = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']
  const groupedSchedules: { [key: string]: ScheduleRow[] } = {
    Senin: [],
    Selasa: [],
    Rabu: [],
    Kamis: [],
    Jumat: [],
  }

  schedules.forEach((sched) => {
    const day = sched.day
    if (groupedSchedules[day]) {
      groupedSchedules[day].push(sched)
    }
  })

  // Sort each day chronologically by start_time
  daysOfWeek.forEach((day) => {
    groupedSchedules[day].sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
  })

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#171717] flex flex-col font-sans antialiased">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white px-6 py-4 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 border border-indigo-100">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight block">Portal Mahasiswa</span>
            <span className="text-xs text-neutral-500 font-medium">Jadwal Kuliah Mingguan</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-neutral-500 font-mono bg-neutral-100 px-2 py-1 rounded border border-neutral-200">
            {profile.name}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8 space-y-8">
        {/* Page Title */}
        <div className="flex flex-col gap-1.5 border-b border-neutral-200 pb-5">
          <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest font-sans">Schedules</div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 flex items-center gap-2">
            <CalendarIcon className="w-8 h-8 text-indigo-600 shrink-0" />
            Jadwal Kuliah Saya
          </h1>
          <p className="text-neutral-500 text-sm max-w-2xl">
            Berikut adalah kalender matriks jadwal kuliah mingguan Anda berdasarkan kelas dan mata kuliah yang sudah diambil dalam Kartu Rencana Studi (KRS).
          </p>
        </div>

        {enrolledCourseIds.length === 0 ? (
          /* Empty KRS state */
          <div className="bg-white border border-neutral-200 rounded-lg p-16 text-center flex flex-col items-center justify-center shadow-xs">
            <div className="w-12 h-12 rounded-full bg-neutral-50 border border-neutral-200 flex items-center justify-center text-neutral-400 mb-3">
              <BookMarked className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-800">KRS Belum Diisi</h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm">
              Anda belum memilih mata kuliah untuk semester ini. Silakan kunjungi menu <strong>Pilih Matkul (KRS)</strong> terlebih dahulu.
            </p>
          </div>
        ) : (
          /* Weekly Grid Matrix */
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
            {daysOfWeek.map((day) => {
              const dayClasses = groupedSchedules[day]
              return (
                <div key={day} className="flex flex-col space-y-4 bg-white border border-neutral-200 p-4 rounded-xl shadow-3xs min-h-[350px] lg:min-h-[500px]">
                  {/* Day Header */}
                  <div className="pb-3 border-b border-neutral-100 flex items-center justify-between">
                    <span className="font-bold text-neutral-900 text-sm tracking-wide">{day}</span>
                    <span className="text-[10px] bg-neutral-100 text-neutral-500 font-bold px-2 py-0.5 rounded-full">
                      {dayClasses.length} Kelas
                    </span>
                  </div>

                  {/* Day Classes List */}
                  <div className="flex-1 flex flex-col space-y-3">
                    {dayClasses.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center p-6 text-center border border-dashed border-neutral-200 rounded-lg bg-neutral-50/30">
                        <span className="text-[11px] text-neutral-450 italic leading-relaxed">
                          Tidak ada jadwal kuliah hari ini
                        </span>
                      </div>
                    ) : (
                      dayClasses.map((sched) => {
                        const courseName = sched.courses?.name || 'Mata Kuliah'
                        const courseCode = sched.courses?.code || '-'
                        const lecturerName = sched.courses?.profiles?.name || 'Dosen Pengampu'

                        return (
                          <div
                            key={sched.id}
                            className="bg-white border border-neutral-150 hover:border-indigo-200 hover:shadow-2xs p-3 rounded-lg transition-all flex flex-col space-y-2.5 group"
                          >
                            {/* Class Time */}
                            <div className="flex items-center gap-1.5 text-[10px] text-indigo-600 font-semibold font-mono">
                              <Clock className="w-3 h-3 text-indigo-500 shrink-0" />
                              <span>
                                {sched.start_time.slice(0, 5)} - {sched.end_time.slice(0, 5)}
                              </span>
                            </div>

                            {/* Course info */}
                            <div className="space-y-0.5">
                              <span className="text-[9px] font-mono text-neutral-400 block tracking-wider uppercase font-semibold">
                                {courseCode}
                              </span>
                              <h4 className="text-xs font-bold text-neutral-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-tight">
                                {courseName}
                              </h4>
                            </div>

                            {/* Method/Room */}
                            <div className="text-[10px] text-neutral-600 flex items-center gap-1">
                              {sched.is_online ? (
                                <a
                                  href={sched.meeting_link || '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1 font-semibold"
                                >
                                  <ExternalLink className="w-3 h-3 shrink-0" />
                                  Kelas Online (Zoom)
                                </a>
                              ) : (
                                <div className="flex items-center gap-1 text-neutral-500 font-medium">
                                  <MapPin className="w-3 h-3 text-neutral-450 shrink-0" />
                                  <span>{sched.room_number || '-'}</span>
                                </div>
                              )}
                            </div>

                            {/* Lecturer name */}
                            <div className="pt-2 border-t border-neutral-100 flex items-center gap-1.5 text-[9px] text-neutral-500">
                              <User className="w-2.5 h-2.5 text-neutral-400 shrink-0" />
                              <span className="font-medium line-clamp-1">{lecturerName}</span>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
