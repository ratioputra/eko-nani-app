import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GraduationCap, BookOpen, AlertCircle } from 'lucide-react'
import CourseSelect from './CourseSelect'
import GradeManager from './GradeManager'

export const dynamic = 'force-dynamic'

interface SearchParams {
  courseId?: string
}

interface StudentProfile {
  name: string
}

interface GradeRowFromDB {
  id: string
  course_id: string
  student_id: string
  score_kehadiran: number | null
  score_tugas: number | null
  score_uts: number | null
  score_uas: number | null
  profiles: StudentProfile | StudentProfile[] | null
}

interface GradeItem {
  id: string
  student_id: string
  score_kehadiran: number | null
  score_tugas: number | null
  score_uts: number | null
  score_uas: number | null
  profiles: {
    name: string
  } | null
}

export default async function DosenGradesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const supabase = await createClient()

  // 1. Authenticate user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // 2. Fetch user profile details
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, name, nidn, faculty, department')
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
    .select('id, name, code, weight_kehadiran, weight_tugas, weight_uts, weight_uas')
    .eq('lecturer_id', user.id)

  const courses = coursesData || []

  // 4. Parse courseId query parameter
  const params = await searchParams
  const selectedCourseId = params.courseId || ''

  // Validate if the selected course actually belongs to the lecturer
  const selectedCourse = courses.find((c) => c.id === selectedCourseId)

  let grades: GradeItem[] = []
  let fetchError = false

  if (selectedCourseId && selectedCourse) {
    // 5. Fetch grades and student profiles
    const { data: gradesData, error: gradesFetchError } = await supabase
      .from('grades')
      .select('id, course_id, student_id, score_kehadiran, score_tugas, score_uts, score_uas, profiles(name)')
      .eq('course_id', selectedCourseId)

    if (gradesFetchError) {
      console.error('Error fetching student grades:', gradesFetchError)
      fetchError = true
    } else {
      // Map and type profiles correctly (PostgREST returns single object or array)
      const rawGrades = (gradesData as unknown as GradeRowFromDB[]) || []
      grades = rawGrades.map((g) => {
        let mappedProfile: { name: string } | null = null
        if (g.profiles) {
          if (Array.isArray(g.profiles)) {
            mappedProfile = g.profiles[0] || null
          } else {
            mappedProfile = g.profiles
          }
        }
        return {
          id: g.id,
          student_id: g.student_id,
          score_kehadiran: g.score_kehadiran,
          score_tugas: g.score_tugas,
          score_uts: g.score_uts,
          score_uas: g.score_uas,
          profiles: mappedProfile,
        }
      })
    }
  }

  // Fallback defaults for weights if they are not defined in the courses table
  const weightKehadiran = selectedCourse?.weight_kehadiran ?? 10
  const weightTugas = selectedCourse?.weight_tugas ?? 20
  const weightUts = selectedCourse?.weight_uts ?? 30
  const weightUas = selectedCourse?.weight_uas ?? 40

  // 6. Fetch institution settings
  const { data: instSettings } = await supabase
    .from('institution_settings')
    .select('*')
    .single()

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#171717] flex flex-col font-sans antialiased print:block print:w-full print:static print:bg-white print:text-black print:p-0">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white px-6 py-4 flex items-center justify-between shadow-2xs print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 border border-indigo-100">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight block">Portal Dosen</span>
            <span className="text-xs text-neutral-500 font-medium">Layanan Nilai Kuliah</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-neutral-500 font-mono bg-neutral-100 px-2 py-1 rounded border border-neutral-200">
            {profile.name}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-8 space-y-8 print:block print:w-full print:max-w-none print:p-0 print:static print:m-0">
        {/* Page Title */}
        <div className="flex flex-col gap-1.5 border-b border-neutral-200 pb-5 print:hidden">
          <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Dosen Dashboard</div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            Grade Management
          </h1>
          <p className="text-neutral-500 text-sm max-w-2xl">
            Kelola bobot kontrak penilaian (Kehadiran, Tugas, UTS, UAS) dan input nilai mahasiswa dalam bentuk grid spreadsheet interaktif.
          </p>
        </div>

        {/* Course Selector */}
        <div className="print:hidden">
          <CourseSelect courses={courses} selectedCourseId={selectedCourseId} />
        </div>

        {/* Selected Course Work Area */}
        {selectedCourseId ? (
          !selectedCourse ? (
            <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-md text-sm flex items-center gap-2 print:hidden">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              Mata kuliah tidak ditemukan atau Anda tidak berwenang mengampu mata kuliah ini.
            </div>
          ) : fetchError ? (
            <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-md text-sm flex items-center gap-2 print:hidden">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              Gagal memuat data nilai mahasiswa dari database. Silakan coba lagi.
            </div>
          ) : (
            <GradeManager
              courseId={selectedCourseId}
              initialWeightKehadiran={weightKehadiran}
              initialWeightTugas={weightTugas}
              initialWeightUts={weightUts}
              initialWeightUas={weightUas}
              initialGrades={grades}
              courseCode={selectedCourse?.code || ''}
              courseName={selectedCourse?.name || ''}
              lecturerName={profile.name || ''}
              lecturerNidn={profile.nidn || ''}
              lecturerFaculty={profile.faculty || ''}
              lecturerDepartment={profile.department || ''}
              univName={instSettings?.univ_name || ''}
              facultyDefault={instSettings?.faculty_default || ''}
              departmentDefault={instSettings?.department_default || ''}
              univAddress={instSettings?.address || ''}
              univPhone={instSettings?.phone || ''}
            />
          )
        ) : (
          /* Empty State prompt */
          <div className="bg-white border border-neutral-200 rounded-lg p-16 text-center flex flex-col items-center justify-center shadow-xs print:hidden">
            <div className="w-12 h-12 rounded-full bg-neutral-50 border border-neutral-200 flex items-center justify-center text-neutral-400 mb-3">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-800">Mata Kuliah Belum Dipilih</h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm">
              Silakan pilih salah satu mata kuliah yang Anda ampu menggunakan menu dropdown di atas untuk mengelola bobot dan nilai mahasiswa.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
