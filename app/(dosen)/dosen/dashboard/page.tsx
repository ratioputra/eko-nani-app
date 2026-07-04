import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  FileText,
  Clock,
  ExternalLink,
  ClipboardList,
  ChevronRight,
  GraduationCap,
} from 'lucide-react'
import DashboardMiddleSection from './DashboardMiddleSection'

export const dynamic = 'force-dynamic'

interface CourseRow {
  id: string
  name: string
  code: string
}

interface ScheduleRow {
  id: string
  course_id: string
  day: string
  start_time: string | null
  end_time: string | null
  is_online: boolean
  room_number: string | null
  meeting_link: string | null
  courses: {
    name: string
    code: string
  } | null
}

export default async function DosenDashboardPage() {
  const supabase = await createClient()

  // 1. Authenticate user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // 2. Fetch profile role and details
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, name, email')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    redirect('/login')
  }

  const role = profile.role?.toUpperCase()
  if (role !== 'DOSEN' && role !== 'LECTURER') {
    redirect('/login')
  }

  // 3. Timezone-aware day names
  const dayName = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    timeZone: 'Asia/Jakarta',
  }).format(new Date())

  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(new Date())

  // 4. Fetch Lecturer's Courses
  const { data: coursesTaught } = await supabase
    .from('courses')
    .select('id, name, code')
    .eq('lecturer_id', user.id)
    .order('code', { ascending: true })

  const courses = (coursesTaught as CourseRow[]) || []
  const courseIds = courses.map((c) => c.id)

  // 5. Query metrics and logs in parallel
  let totalStudents = 0
  let totalSchedules = 0
  let schedules: ScheduleRow[] = []
  let recentAssignments: any[] = []
  let coursesList: any[] = []

  if (courseIds.length > 0) {
    const [gradesRes, schedulesRes, assignmentsRes] = await Promise.all([
      supabase.from('grades').select('course_id, student_id').in('course_id', courseIds),
      supabase
        .from('schedules')
        .select('id, course_id, day, start_time, end_time, is_online, room_number, meeting_link, courses(name, code)')
        .in('course_id', courseIds),
      supabase
        .from('assignments')
        .select('id, title, deadline, created_at, course_id, courses(name, code)')
        .in('course_id', courseIds)
        .order('created_at', { ascending: false })
        .limit(5),
    ])

    // Distinct enrolled students count
    const grades = gradesRes.data || []
    const uniqueStudents = new Set(grades.map((g) => g.student_id))
    totalStudents = uniqueStudents.size

    // Schedules
    schedules = (schedulesRes.data as unknown as ScheduleRow[]) || []
    totalSchedules = schedules.length

    // Build courses list with student counts
    coursesList = courses.map((c) => {
      const studentCount = grades.filter((g) => g.course_id === c.id).length
      return {
        id: c.id,
        name: c.name,
        code: c.code,
        studentCount,
      }
    })

    // Assignments submissions counts
    const assignments = assignmentsRes.data || []
    if (assignments.length > 0) {
      const { data: submissionsData } = await supabase
        .from('submissions')
        .select('assignment_id')
        .in('assignment_id', assignments.map((a) => a.id))

      const submissions = submissionsData || []

      recentAssignments = assignments.map((a: any) => {
        const subCount = submissions.filter((s) => s.assignment_id === a.id).length
        return {
          id: a.id,
          title: a.title,
          deadline: a.deadline,
          created_at: a.created_at,
          courseName: a.courses?.name || 'Mata Kuliah',
          courseCode: a.courses?.code || '-',
          submissionCount: subCount,
        }
      })
    }
  }

  const totalCourses = courses.length

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#171717] flex flex-col font-sans antialiased">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white px-6 py-4 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 border border-indigo-100">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight block">Portal Dosen</span>
            <span className="text-xs text-neutral-500 font-medium">Beranda Dashboard</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-neutral-500 font-mono bg-neutral-100 px-2 py-1 rounded border border-neutral-200">
            {profile.name}
          </span>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-8 space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col gap-1 border-b border-neutral-200 pb-5">
          <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest font-sans">Dosen Dashboard</div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            Selamat datang kembali, {profile.name}
          </h1>
          <p className="text-neutral-500 text-sm">
            Email: {profile.email} • Kelola kelas mengajar, evaluasi tugas kuliah mahasiswa, dan catat presensi perkuliahan.
          </p>
        </div>

        {/* ========================================================
            1. TOP ROW: Statistics Cards
            ======================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Mata Kuliah */}
          <div className="bg-white border border-neutral-200 p-6 rounded-lg relative overflow-hidden group shadow-2xs">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Total Mata Kuliah</span>
              <BookOpen className="w-5 h-5 text-neutral-400" />
            </div>
            <div className="text-3xl font-bold text-neutral-900 font-mono">{totalCourses}</div>
            <div className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider mt-1.5">
              Mata kuliah diampu
            </div>
          </div>

          {/* Total Mahasiswa */}
          <div className="bg-white border border-neutral-200 p-6 rounded-lg relative overflow-hidden group shadow-2xs">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Total Mahasiswa</span>
              <Users className="w-5 h-5 text-neutral-400" />
            </div>
            <div className="text-3xl font-bold text-neutral-900 font-mono">{totalStudents}</div>
            <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mt-1.5">
              Mahasiswa terdaftar
            </div>
          </div>

          {/* Total Jadwal Mengajar */}
          <div className="bg-white border border-neutral-200 p-6 rounded-lg relative overflow-hidden group shadow-2xs">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Jadwal Mengajar</span>
              <Calendar className="w-5 h-5 text-neutral-400" />
            </div>
            <div className="text-3xl font-bold text-neutral-900 font-mono">{totalSchedules}</div>
            <div className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mt-1.5">
              Slot mengajar terjadwal
            </div>
          </div>
        </div>

        {/* ========================================================
            2. MIDDLE ROW: Classes and Interactive Calendar
            ======================================================== */}
        <DashboardMiddleSection
          schedules={schedules}
          todayDayName={dayName}
          todayFormatted={todayFormatted}
        />

        {/* ========================================================
            3. BOTTOM ROW: Tasks & Taught Courses
            ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* LEFT PANEL: Tugas Terbaru (65% width equivalent) */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden flex flex-col justify-between min-h-[320px]">
              <div className="border-b border-neutral-100 px-6 py-4 flex items-center justify-between bg-neutral-50/30">
                <h3 className="text-neutral-900 font-bold text-sm flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  Tugas Kuliah Terbaru
                </h3>
                <span className="text-xs font-semibold text-neutral-400 font-mono">
                  Evaluasi Jawaban PDF
                </span>
              </div>

              <div className="p-6 flex-1 space-y-4">
                {recentAssignments.length === 0 ? (
                  <div className="py-10 text-center text-neutral-400 flex flex-col items-center justify-center">
                    <FileText className="w-8 h-8 text-neutral-300 mb-2" />
                    <p className="text-xs font-semibold text-neutral-700">Belum ada tugas dirilis.</p>
                    <p className="text-[10px] text-neutral-400">Rilis tugas di sub-halaman Tugas Kuliah.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-100 text-sm">
                    {recentAssignments.map((a) => (
                      <div
                        key={a.id}
                        className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <h4 className="font-bold text-neutral-800 text-xs sm:text-sm line-clamp-1">
                            {a.title}
                          </h4>
                          <div className="flex items-center gap-2 text-[10px] text-neutral-400 font-mono">
                            <span className="font-bold text-neutral-500">[{a.courseCode}]</span>
                            <span>•</span>
                            <span>Deadline: {new Date(a.deadline).toLocaleDateString('id-ID')}</span>
                          </div>
                        </div>

                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded shrink-0 font-mono">
                          {a.submissionCount} Pengumpulan
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-neutral-100 bg-neutral-50/20 text-center">
                <Link
                  href="/dosen/assignments"
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold tracking-wide flex items-center justify-center gap-0.5"
                >
                  Kelola Tugas Kuliah <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: Mata Kuliah Diampu (35% width equivalent) */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden flex flex-col justify-between min-h-[320px]">
              <div className="border-b border-neutral-100 px-5 py-4 flex items-center justify-between bg-neutral-50/30">
                <h3 className="text-neutral-900 font-bold text-sm flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  Mata Kuliah Diampu
                </h3>
              </div>

              <div className="p-5 flex-1 overflow-y-auto max-h-[220px]">
                {coursesList.length === 0 ? (
                  <p className="text-xs text-neutral-400 py-6 italic text-center">
                    Tidak ada mata kuliah terdaftar.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {coursesList.map((c) => (
                      <div
                        key={c.id}
                        className="p-3 bg-neutral-50/40 border border-neutral-150 rounded-md flex items-center justify-between text-xs hover:border-neutral-300 transition-colors"
                      >
                        <div className="space-y-0.5 max-w-[160px]">
                          <span className="font-bold text-[10px] text-neutral-400 block font-mono">
                            {c.code}
                          </span>
                          <span className="font-bold text-neutral-800 line-clamp-1">
                            {c.name}
                          </span>
                        </div>

                        <span className="font-mono text-[10px] font-bold bg-neutral-100 border border-neutral-250 text-neutral-500 px-2 py-0.5 rounded shadow-2xs">
                          {c.studentCount} Mhs
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-neutral-100 bg-neutral-50/20 text-center">
                <Link
                  href="/dosen/courses"
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold tracking-wide flex items-center justify-center gap-0.5"
                >
                  Detail Mata Kuliah <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
