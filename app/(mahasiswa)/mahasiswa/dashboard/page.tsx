import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  GraduationCap,
  Calendar,
  Clock,
  Video,
  MapPin,
  ExternalLink,
  BookOpen,
  AlertCircle,
  Megaphone,
  FileText,
  CheckCircle,
  ChevronRight,
} from 'lucide-react'
import OnboardingForm from './OnboardingForm'

export const dynamic = 'force-dynamic'

interface CourseData {
  name: string
  code: string
}

interface EnrollmentRow {
  id: string
  course_id: string
  score_kehadiran: number | null
  score_tugas: number | null
  score_uts: number | null
  score_uas: number | null
  courses: CourseData | null
}

interface ScheduleRow {
  id: string
  course_id: string
  day: string
  start_time: string
  end_time: string
  is_online: boolean
  room_number: string | null
  meeting_link: string | null
  courses: {
    name: string
    code: string
  } | null
}

interface AnnouncementRow {
  id: string
  course_id: string
  title: string
  content: string
  created_at: string | null
  courses: {
    name: string
    code: string
  } | null
}

interface ProfileRow {
  id: string
  role: string
  name: string | null
  email: string
  nim?: string | null
}

function formatTime(timeStr: string | null): string {
  if (!timeStr) return ''
  const parts = timeStr.split(':')
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`
  }
  return timeStr
}

function formatDateOnly(dateStr: string | null): string {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Jakarta',
    }).format(date)
  } catch {
    return dateStr || '-'
  }
}

export default async function MahasiswaDashboardPage() {
  const supabase = await createClient()

  // 1. Authenticate user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // 2. Fetch user profile with retries to resolve trigger replication lag
  let profileData = null
  let profileError = null

  for (let attempt = 1; attempt <= 3; attempt++) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!error && data) {
      profileData = data
      profileError = null
      break
    }
    profileError = error
    if (attempt < 3) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  // Auto-provision profile fallback if missing
  if (profileError || !profileData) {
    const defaultName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Mahasiswa'
    const { data: insertedData, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        name: defaultName,
        email: user.email || '',
        role: 'MAHASISWA',
      })
      .select()
      .single()

    if (!insertError && insertedData) {
      profileData = insertedData
    } else {
      console.error('Student Dashboard: Profile auto-provisioning failed:', insertError)
      redirect('/login')
    }
  }

  const profile = profileData as ProfileRow

  const role = profile.role?.toUpperCase()
  if (role !== 'MAHASISWA' && role !== 'STUDENT') {
    redirect('/login')
  }

  // 3. Onboarding check
  const needsOnboarding =
    !profile.name ||
    profile.name.trim() === '' ||
    !profile.nim ||
    profile.nim.trim() === ''

  if (needsOnboarding) {
    return <OnboardingForm email={profile.email} />
  }

  // 4. Timezone-aware day names
  const todayDayName = new Intl.DateTimeFormat('id-ID', {
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

  // 5. Fetch student course enrollments
  const { data: enrollmentsData } = await supabase
    .from('grades')
    .select('id, course_id, score_kehadiran, score_tugas, score_uts, score_uas, courses(name, code, weight_kehadiran, weight_tugas, weight_uts, weight_uas)')
    .eq('student_id', user.id)

  const enrollments = (enrollmentsData as unknown as EnrollmentRow[]) || []
  const courseIds = enrollments.map((e) => e.course_id)

  // 6. Fetch schedules, announcements, assignments, and submissions in parallel
  let schedules: ScheduleRow[] = []
  let announcements: AnnouncementRow[] = []
  let assignments: any[] = []
  let submissions: any[] = []

  if (courseIds.length > 0) {
    const [schedulesRes, announcementsRes, assignmentsRes, submissionsRes] = await Promise.all([
      supabase
        .from('schedules')
        .select('id, course_id, day, start_time, end_time, is_online, room_number, meeting_link, courses(name, code)')
        .in('course_id', courseIds),
      supabase
        .from('announcements')
        .select('id, course_id, title, content, created_at, courses(name, code)')
        .in('course_id', courseIds)
        .order('created_at', { ascending: false })
        .limit(4),
      supabase
        .from('assignments')
        .select('*, courses(name, code)')
        .in('course_id', courseIds)
        .order('deadline', { ascending: true }),
      supabase
        .from('submissions')
        .select('*')
        .eq('student_id', user.id),
    ])

    schedules = (schedulesRes.data as unknown as ScheduleRow[]) || []
    announcements = (announcementsRes.data as unknown as AnnouncementRow[]) || []
    assignments = assignmentsRes.data || []
    submissions = submissionsRes.data || []
  }

  // Filter today's schedules
  const todaySchedules = schedules
    .filter((s) => s.day === todayDayName)
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))

  // Filter upcoming schedules for the rest of the week
  const dayOrder: Record<string, number> = {
    'Senin': 1,
    'Selasa': 2,
    'Rabu': 3,
    'Kamis': 4,
    'Jumat': 5,
    'Sabtu': 6,
    'Minggu': 7,
  }
  const upcomingSchedules = schedules
    .filter((s) => s.day !== todayDayName)
    .sort((a, b) => {
      const dayDiff = (dayOrder[a.day] || 9) - (dayOrder[b.day] || 9)
      if (dayDiff !== 0) return dayDiff
      return (a.start_time || '').localeCompare(b.start_time || '')
    })
    .slice(0, 3)

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
            <span className="text-xs text-neutral-500 font-medium">Beranda Dashboard</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-neutral-500 font-mono bg-neutral-100 px-2 py-1 rounded border border-neutral-200">
            {profile.name} ({profile.nim || '-'})
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-8 space-y-8">
        {/* Welcome message */}
        <div className="flex flex-col gap-1 border-b border-neutral-200 pb-5">
          <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest font-sans">Mahasiswa Dashboard</div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            Selamat datang kembali, {profile.name}
          </h1>
          <p className="text-neutral-500 text-sm">
            NIM: {profile.nim || '-'} • Email: {profile.email} • Pantau jadwal perkuliahan, pengumuman kampus, dan kelola pengerjaan tugas akademik Anda.
          </p>
        </div>

        {/* ========================================================
            1. TOP ROW: Kelas Hari Ini & Pengumuman Kampus
            ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* LEFT PANEL: Kelas Hari Ini Card (66.6% width) */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden flex flex-col justify-between h-full min-h-[420px]">
              {/* Header */}
              <div className="border-b border-neutral-100 px-6 py-4 flex items-center justify-between bg-neutral-50/30">
                <h2 className="text-neutral-900 font-bold text-sm flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
                  Kelas Hari Ini
                </h2>
                <span className="text-xs font-semibold text-neutral-500 font-mono">
                  {todayFormatted}
                </span>
              </div>

              {/* Body */}
              <div className="p-6 flex-1 space-y-5">
                {/* List today's schedules */}
                <div className="space-y-3">
                  {todaySchedules.length === 0 ? (
                    <div className="py-6 text-center text-neutral-500 flex flex-col items-center justify-center">
                      <Calendar className="w-8 h-8 text-neutral-300 mb-2" />
                      <p className="text-xs font-semibold text-neutral-700">Tidak ada jadwal kuliah hari ini.</p>
                      <p className="text-[10px] text-neutral-400">Selamat beristirahat atau selesaikan pengerjaan tugas.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {todaySchedules.map((s) => (
                        <div
                          key={s.id}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between border border-neutral-150 rounded-md p-3.5 bg-neutral-50/20 hover:border-neutral-300 transition-colors gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold bg-white border border-neutral-200 text-neutral-500 px-2 py-0.5 rounded font-mono">
                                {s.courses?.code}
                              </span>
                              <span className="text-[10px] font-semibold text-indigo-600 flex items-center gap-0.5 font-mono bg-indigo-50/50 px-1.5 py-0.5 rounded">
                                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                                {formatTime(s.start_time)} - {formatTime(s.end_time)}
                              </span>
                            </div>
                            <h4 className="font-bold text-neutral-900 text-sm">{s.courses?.name}</h4>
                          </div>

                          <div className="flex items-center gap-3 self-start sm:self-auto text-xs">
                            {s.is_online ? (
                              <>
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100 font-sans">
                                  <Video className="w-3 h-3" />
                                  Daring
                                </span>
                                {s.meeting_link && (
                                  <a
                                    href={s.meeting_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-0.5 font-semibold text-indigo-600 hover:underline"
                                  >
                                    Mulai <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </>
                            ) : (
                              <>
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-100 text-neutral-600 border border-neutral-250 font-sans">
                                  <MapPin className="w-3 h-3" />
                                  Luring
                                </span>
                                <span className="font-bold text-neutral-800 bg-white border border-neutral-200 px-2 py-0.5 rounded font-mono">
                                  Ruang {s.room_number || '-'}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Upcoming preview section */}
                <div className="border-t border-neutral-200 pt-4">
                  <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">
                    Jadwal Berikutnya
                  </h3>
                  {upcomingSchedules.length === 0 ? (
                    <p className="text-xs text-neutral-400 italic">Tidak ada jadwal kuliah lain.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {upcomingSchedules.map((s) => (
                        <div
                          key={s.id}
                          className="border border-neutral-200 p-3 rounded bg-white space-y-1"
                        >
                          <div className="flex items-center justify-between text-[10px] text-neutral-400">
                            <span className="font-bold uppercase font-mono">{s.day}</span>
                            <span className="font-mono">{formatTime(s.start_time)}</span>
                          </div>
                          <h4 className="font-bold text-neutral-800 text-xs line-clamp-1">
                            {s.courses?.name}
                          </h4>
                          <span className="text-[9px] text-neutral-400 block font-mono">
                            {s.is_online ? 'Kelas Daring' : `Ruang ${s.room_number || '-'}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom footer trigger */}
              <div className="p-3.5 border-t border-neutral-100 bg-neutral-50/20 text-center">
                <Link
                  href="/mahasiswa/courses"
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold tracking-wide"
                >
                  [ Selengkapnya → ]
                </Link>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: Pengumuman Kampus (33.3% width) */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden flex flex-col justify-between h-full min-h-[420px]">
              <div className="border-b border-neutral-100 px-5 py-4 flex items-center justify-between bg-neutral-50/30">
                <h2 className="text-neutral-900 font-bold text-sm flex items-center gap-1.5">
                  <Megaphone className="w-4 h-4 text-indigo-600" />
                  Pengumuman Kampus
                </h2>
              </div>

              <div className="p-5 flex-1 overflow-y-auto max-h-[320px] space-y-4">
                {announcements.length === 0 ? (
                  <div className="py-12 text-center text-neutral-400 italic text-xs">
                    Belum ada pengumuman terbaru dari dosen.
                  </div>
                ) : (
                  announcements.map((ann) => (
                    <div
                      key={ann.id}
                      className="p-3 bg-neutral-50/30 border border-neutral-200 rounded space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-neutral-100 pb-1.5">
                        <span className="text-[9px] font-bold text-indigo-600 font-mono truncate max-w-[65%]">
                          {ann.courses?.code} - {ann.courses?.name}
                        </span>
                        <span className="text-[9px] text-neutral-400 font-mono shrink-0">
                          {formatDateOnly(ann.created_at)}
                        </span>
                      </div>
                      <h4 className="font-bold text-neutral-800 text-xs">{ann.title}</h4>
                      <p className="text-neutral-600 text-[11px] leading-relaxed line-clamp-3">
                        {ann.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            2. BOTTOM ROW: Daftar Tugas Perkuliahan (100% width)
            ======================================================== */}
        <div className="space-y-4">
          <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden flex flex-col justify-between min-h-[300px]">
            {/* Header */}
            <div className="border-b border-neutral-100 px-6 py-4 flex items-center justify-between bg-neutral-50/30">
              <h3 className="text-neutral-900 font-bold text-sm flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                Daftar Tugas Perkuliahan
              </h3>
              <span className="text-xs font-semibold text-neutral-400 font-mono">
                Evaluasi Mandiri Mahasiswa
              </span>
            </div>

            {/* Table / List Body */}
            <div className="p-0 flex-1">
              {assignments.length === 0 ? (
                <div className="p-16 text-center text-neutral-500 flex flex-col items-center justify-center">
                  <FileText className="w-10 h-10 text-neutral-300 mb-2" />
                  <p className="text-xs font-semibold text-neutral-700">Tidak ada tugas terdaftar.</p>
                  <p className="text-[10px] text-neutral-400">Semua tugas kuliah Anda telah selesai dievaluasi atau belum dirilis.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-200 bg-neutral-50/50 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                        <th className="px-6 py-3 w-[60px] text-center font-sans">No</th>
                        <th className="px-6 py-3 font-sans">Mata Kuliah</th>
                        <th className="px-6 py-3 font-sans">Judul Tugas</th>
                        <th className="px-6 py-3 font-sans w-[180px]">Tenggat Waktu</th>
                        <th className="px-6 py-3 text-center w-[180px] font-sans">Status Pengumpulan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 text-xs">
                      {assignments.map((assign, idx) => {
                        const sub = submissions.find((s) => s.assignment_id === assign.id)
                        const isGraded = sub && sub.score_tugas !== null
                        const isSubmitted = sub && !isGraded

                        let badge = (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-rose-50 border border-rose-100 text-rose-700 px-2 py-0.5 rounded">
                            Belum Mengumpulkan
                          </span>
                        )

                        if (sub) {
                          if (isGraded) {
                            badge = (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
                                Sudah Dinilai ({sub.score_tugas})
                              </span>
                            )
                          } else {
                            badge = (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
                                Sudah Mengumpulkan
                              </span>
                            )
                          }
                        }

                        return (
                          <tr key={assign.id} className="hover:bg-neutral-50/20 transition-colors">
                            <td className="px-6 py-3.5 text-center text-neutral-500 font-mono">
                              {idx + 1}
                            </td>
                            <td className="px-6 py-3.5 font-bold text-neutral-800 font-mono">
                              [{assign.courses?.code}] {assign.courses?.name}
                            </td>
                            <td className="px-6 py-3.5 font-semibold text-neutral-800">
                              {assign.title}
                            </td>
                            <td className="px-6 py-3.5 text-neutral-500 font-mono font-medium">
                              {new Date(assign.deadline).toLocaleString('id-ID', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })}
                            </td>
                            <td className="px-6 py-3.5 text-center">
                              {badge}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer trigger */}
            <div className="p-4 border-t border-neutral-100 bg-neutral-50/20 text-center">
              <Link
                href="/mahasiswa/assignments"
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold tracking-wide flex items-center justify-center gap-0.5"
              >
                Buka Halaman Tugas Kuliah <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
