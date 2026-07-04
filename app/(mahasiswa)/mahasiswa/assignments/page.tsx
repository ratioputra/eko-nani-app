import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GraduationCap, FileText } from 'lucide-react'
import StudentAssignmentList from './StudentAssignmentList'

export const dynamic = 'force-dynamic'

interface CourseJoined {
  name: string
  code: string
}

interface EnrollmentRow {
  id: string
  course_id: string
  courses: CourseJoined | null
}

export default async function MahasiswaAssignmentsPage() {
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
    .select('role, name, nim')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    redirect('/login')
  }

  const role = profile.role?.toUpperCase()
  if (role !== 'MAHASISWA' && role !== 'STUDENT') {
    redirect('/login')
  }

  // 3. Fetch student course enrollments
  const { data: enrollmentsData } = await supabase
    .from('grades')
    .select('id, course_id, courses(name, code)')
    .eq('student_id', user.id)

  const enrollments = (enrollmentsData as unknown as EnrollmentRow[]) || []
  const enrolledCourses = enrollments.map((e) => ({
    id: e.course_id,
    name: e.courses?.name || 'Mata Kuliah',
    code: e.courses?.code || '-',
  }))

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#171717] flex flex-col font-sans antialiased">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white px-6 py-4 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 border border-indigo-100">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-neutral-900 block font-sans">Portal Mahasiswa</span>
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Student Area</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-neutral-500 font-mono bg-neutral-100 px-2 py-1 rounded border border-neutral-200">
            {profile.name} ({profile.nim || '-'})
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-8 space-y-8">
        {/* Page Title */}
        <div className="flex flex-col gap-1.5 border-b border-neutral-200 pb-5">
          <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest font-sans">Mahasiswa Dashboard</div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 flex items-center gap-2 font-sans">
            <FileText className="w-8 h-8 text-indigo-600 shrink-0" />
            Tugas Kuliah & Evaluasi
          </h1>
          <p className="text-neutral-500 text-sm max-w-2xl font-sans">
            Lihat daftar tugas kuliah yang ditugaskan oleh dosen, kumpulkan berkas jawaban berformat PDF, dan pantau umpan balik hasil penilaian.
          </p>
        </div>

        {/* Interactive Student Assignments Client Layout */}
        <StudentAssignmentList
          enrolledCourses={enrolledCourses}
          studentId={user.id}
        />
      </main>
    </div>
  )
}
