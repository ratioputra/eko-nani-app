import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GraduationCap, Users } from 'lucide-react'
import StudentRosterTable from './StudentRosterTable'

export const dynamic = 'force-dynamic'

interface CourseData {
  id: string
  name: string
  code: string
  prodi: string | null
  kelas: string | null
}

interface ProfileData {
  name: string
  email: string
  nim: string | null
}

interface GradeJoin {
  id: string
  course_id: string
  student_id: string
  courses: CourseData | null
  profiles: ProfileData | null
}

export default async function DosenStudentsPage() {
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

  // 3. Fetch all courses taught by the lecturer
  const { data: courses } = await supabase
    .from('courses')
    .select('id')
    .eq('lecturer_id', user.id)

  const courseIds = courses?.map((c) => c.id) || []

  // 4. Fetch grades row (student enrollment records) joined with courses and profiles
  let enrollments: GradeJoin[] = []
  if (courseIds.length > 0) {
    const { data: gradesData, error: queryError } = await supabase
      .from('grades')
      .select('id, course_id, student_id, courses(id, name, code, prodi, kelas), profiles(name, email, nim)')
      .in('course_id', courseIds)

    if (queryError) {
      console.error('Fetch student roster error:', queryError)
    } else if (gradesData) {
      enrollments = (gradesData as unknown as GradeJoin[])
    }
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
            <span className="text-xs text-neutral-500 font-medium">Informasi Mahasiswa</span>
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
          <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest font-sans">Daftar Mahasiswa</div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 flex items-center gap-2">
            <Users className="w-8 h-8 text-indigo-600" />
            Monitoring Mahasiswa Terdaftar
          </h1>
          <p className="text-neutral-500 text-sm max-w-2xl">
            Tinjau seluruh daftar mahasiswa terdaftar, cari data profil akademik, serta saring berdasarkan mata kuliah yang diikuti, kelas, atau program studi.
          </p>
        </div>

        {/* Dynamic Student Roster Table Component */}
        <StudentRosterTable initialEnrollments={enrollments} />

      </main>
    </div>
  )
}
