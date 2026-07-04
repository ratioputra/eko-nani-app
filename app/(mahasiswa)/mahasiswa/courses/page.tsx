import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BookMarked, GraduationCap } from 'lucide-react'
import KrsCourseList from './KrsCourseList'

export const dynamic = 'force-dynamic'

interface CourseRow {
  id: string
  name: string
  code: string
  prodi: string | null
  semester: number | null
  kelas: string | null
  tahun_akademik: string | null
}

interface GradeRow {
  course_id: string
}

export default async function MahasiswaCoursesPage() {
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
  if (role !== 'MAHASISWA' && role !== 'STUDENT') {
    redirect('/login')
  }

  // 3. Fetch all offered courses
  const { data: coursesData } = await supabase
    .from('courses')
    .select('id, name, code, prodi, semester, kelas, tahun_akademik')
    .order('code', { ascending: true })

  const courses = (coursesData as CourseRow[]) || []

  // 4. Fetch already enrolled course IDs from grades
  const { data: gradesData } = await supabase
    .from('grades')
    .select('course_id')
    .eq('student_id', user.id)

  const enrolledCourseIds = (gradesData as GradeRow[])?.map((g) => g.course_id) || []

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
            <span className="text-xs text-neutral-500 font-medium">Sistem Informasi Akademik</span>
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
          <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest font-sans">KRS Mahasiswa</div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 flex items-center gap-2">
            <BookMarked className="w-8 h-8 text-indigo-600" />
            Kartu Rencana Studi (KRS)
          </h1>
          <p className="text-neutral-500 text-sm max-w-2xl">
            Pilihlah mata kuliah yang ingin Anda ambil untuk semester berjalan di bawah ini. Kelas yang sudah diambil akan terintegrasi langsung di dashboard utama.
          </p>
        </div>

        {/* Krs Course list with filtering and search */}
        <KrsCourseList courses={courses} enrolledCourseIds={enrolledCourseIds} />

      </main>
    </div>
  )
}
