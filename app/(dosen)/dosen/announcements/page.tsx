import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Megaphone, GraduationCap, Calendar } from 'lucide-react'
import AnnouncementForm from './AnnouncementForm'

export const dynamic = 'force-dynamic'

interface CourseData {
  name: string
  code: string
}

interface AnnouncementRow {
  id: string
  course_id: string
  title: string
  content: string
  created_at: string | null
  courses: CourseData | null
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta'
    }).format(date) + ' WIB'
  } catch {
    return dateStr || '-'
  }
}

export default async function DosenAnnouncementsPage() {
  const supabase = await createClient()

  // 1. Authenticate user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // 2. Fetch user profile
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

  // 3. Fetch lecturer's courses
  const { data: coursesData } = await supabase
    .from('courses')
    .select('id, name, code')
    .eq('lecturer_id', user.id)

  const courses = coursesData || []
  const courseIds = courses.map((c) => c.id)

  // 4. Fetch announcements for these courses
  let announcements: AnnouncementRow[] = []
  if (courseIds.length > 0) {
    const { data: announcementsData } = await supabase
      .from('announcements')
      .select('id, course_id, title, content, created_at, courses(name, code)')
      .in('course_id', courseIds)
      .order('created_at', { ascending: false })

    announcements = (announcementsData as unknown as AnnouncementRow[]) || []
  }

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
            <span className="text-xs text-neutral-500 font-medium">Pengumuman Perkuliahan</span>
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
        
        {/* Page Title */}
        <div className="flex flex-col gap-1.5 border-b border-neutral-200 pb-5">
          <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest font-sans">Dosen Dashboard</div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            Class Announcements
          </h1>
          <p className="text-neutral-500 text-sm max-w-2xl">
            Kirimkan informasi penting ke kelas mata kuliah terdaftar, serta tinjau riwayat pengumuman kelas yang sudah Anda kirimkan.
          </p>
        </div>

        {/* Announcement form component */}
        <AnnouncementForm courses={courses} />

        {/* List of Sent Announcements */}
        <div className="space-y-4">
          <h2 className="text-neutral-900 font-bold text-lg flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-indigo-600" />
            Riwayat Pengumuman Kelas
          </h2>

          {announcements.length === 0 ? (
            <div className="bg-white border border-neutral-200 rounded-lg p-16 text-center flex flex-col items-center justify-center shadow-xs">
              <div className="w-12 h-12 rounded-full bg-neutral-50 border border-neutral-200 flex items-center justify-center text-neutral-400 mb-3">
                <Megaphone className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-neutral-800">Belum ada pengumuman terkirim</h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm">
                Anda belum pernah mengirimkan pengumuman perkuliahan untuk kelas Anda. Gunakan form di atas untuk membagikan pengumuman pertama Anda.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {announcements.map((announcement) => {
                const courseName = announcement.courses?.name || 'Mata Kuliah'
                const courseCode = announcement.courses?.code || '-'
                return (
                  <div
                    key={announcement.id}
                    className="bg-white border border-neutral-200 hover:border-neutral-300 rounded-lg p-6 shadow-2xs space-y-3 transition duration-200"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-neutral-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-indigo-600 font-mono bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-100">
                          {courseCode}
                        </span>
                        <span className="text-xs font-semibold text-neutral-700">
                          {courseName}
                        </span>
                      </div>
                      <span className="text-xs text-neutral-400 font-medium flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(announcement.created_at)}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-neutral-900 font-bold text-base">{announcement.title}</h3>
                      <p className="text-neutral-600 text-sm whitespace-pre-wrap leading-relaxed font-sans font-medium">
                        {announcement.content}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
