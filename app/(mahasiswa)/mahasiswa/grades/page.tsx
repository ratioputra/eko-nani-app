import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GraduationCap, FileSpreadsheet } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface CourseData {
  name: string
  code: string
  weight_kehadiran: number | null
  weight_tugas: number | null
  weight_uts: number | null
  weight_uas: number | null
}

interface GradeRow {
  id: string
  course_id: string
  score_kehadiran: number | null
  score_tugas: number | null
  score_uts: number | null
  score_uas: number | null
  courses: CourseData | null
}

function getGradeLetter(grade: number): string {
  if (grade >= 80) return 'A'
  if (grade >= 70) return 'B'
  if (grade >= 60) return 'C'
  if (grade >= 50) return 'D'
  return 'E'
}

export default async function MahasiswaGradesPage() {
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

  // 3. Fetch real student grades and courses weights from database
  const { data: gradesData } = await supabase
    .from('grades')
    .select('id, course_id, score_kehadiran, score_tugas, score_uts, score_uas, courses(name, code, weight_kehadiran, weight_tugas, weight_uts, weight_uas)')
    .eq('student_id', user.id)

  const enrollments = (gradesData as unknown as GradeRow[]) || []

  // Fetch student attendance records to calculate presence summary
  const enrollmentIds = enrollments.map((e) => e.id)
  let attendanceList: { grade_id: string; status: string }[] = []
  if (enrollmentIds.length > 0) {
    const { data: attData } = await supabase
      .from('attendance')
      .select('grade_id, status')
      .in('grade_id', enrollmentIds)
    attendanceList = (attData as any[]) || []
  }

  // 4. Calculate total GPA (IPK)
  // Let's assume standard grade points: A=4, B=3, C=2, D=1, E=0
  let totalGradePoints = 0
  let gradedClassesCount = 0

  enrollments.forEach((row) => {
    const isNotGradedYet = row.score_kehadiran === null && row.score_tugas === null && row.score_uts === null && row.score_uas === null
    if (!isNotGradedYet) {
      const wkh = row.courses?.weight_kehadiran ?? 10
      const wt = row.courses?.weight_tugas ?? 20
      const wuts = row.courses?.weight_uts ?? 30
      const wuas = row.courses?.weight_uas ?? 40

      const kehadiranScore = row.score_kehadiran ?? 0
      const tugasScore = row.score_tugas ?? 0
      const utsScore = row.score_uts ?? 0
      const uasScore = row.score_uas ?? 0

      const calculated = (kehadiranScore * wkh + tugasScore * wt + utsScore * wuts + uasScore * wuas) / 100
      const letter = getGradeLetter(calculated)

      const points = letter === 'A' ? 4 : letter === 'B' ? 3 : letter === 'C' ? 2 : letter === 'D' ? 1 : 0
      totalGradePoints += points
      gradedClassesCount++
    }
  })

  const ipk = gradedClassesCount > 0 ? (totalGradePoints / gradedClassesCount).toFixed(2) : '0.00'

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
          <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest font-sans">Hasil Studi</div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 flex items-center gap-2">
            <FileSpreadsheet className="w-8 h-8 text-indigo-600" />
            Kartu Hasil Studi (KHS)
          </h1>
          <p className="text-neutral-500 text-sm max-w-2xl">
            Tinjau seluruh riwayat nilai akademik Anda. Rata-rata IPK dihitung berdasarkan hasil evaluasi nilai akhir yang telah diinput dosen.
          </p>
        </div>

        {/* Grades Table Card */}
        <div className="bg-white border border-neutral-200 shadow-sm rounded-lg overflow-hidden">
          <div className="p-5 border-b border-neutral-100 bg-neutral-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-semibold text-neutral-900 text-base">Semester Academic Records</h3>
              <p className="text-neutral-500 text-xs mt-0.5">Daftar nilai mata kuliah terdaftar.</p>
            </div>
            <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3.5 py-1.5 rounded-full border border-indigo-100 shrink-0 font-mono">
              IPK Kumulatif: {ipk}
            </span>
          </div>

          {enrollments.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-neutral-50 border border-neutral-200 flex items-center justify-center text-neutral-400 mb-3">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-semibold text-neutral-800">Belum terdaftar di kelas manapun</h4>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm">
                Anda belum mengambil kelas mata kuliah apapun untuk semester ini. Silakan kunjungi menu KRS untuk mengisi rencana studi Anda.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50/50 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                    <th className="px-6 py-3 w-[120px]">Kode</th>
                    <th className="px-6 py-3">Nama Mata Kuliah</th>
                    <th className="px-4 py-3 text-center w-[90px]">Kehadiran</th>
                    <th className="px-4 py-3 text-center w-[90px]">Tugas</th>
                    <th className="px-4 py-3 text-center w-[90px]">UTS</th>
                    <th className="px-4 py-3 text-center w-[90px]">UAS</th>
                    <th className="px-4 py-3 text-center w-[120px] bg-indigo-50/30">Nilai Akhir</th>
                    <th className="px-6 py-3 text-center w-[120px]">Huruf Mutu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-sm">
                  {enrollments.map((row) => {
                    const courseCode = row.courses?.code || '-'
                    const courseName = row.courses?.name || 'Mata Kuliah'
                    
                    const isNotGradedYet = row.score_kehadiran === null && row.score_tugas === null && row.score_uts === null && row.score_uas === null

                    let finalGradeStr = '-'
                    let gradeLetter = '-'
                    let isGraded = false

                    const wkh = row.courses?.weight_kehadiran ?? 10
                    const wt = row.courses?.weight_tugas ?? 20
                    const wuts = row.courses?.weight_uts ?? 30
                    const wuas = row.courses?.weight_uas ?? 40

                    if (!isNotGradedYet) {
                      const kehadiranScore = row.score_kehadiran ?? 0
                      const tugasScore = row.score_tugas ?? 0
                      const utsScore = row.score_uts ?? 0
                      const uasScore = row.score_uas ?? 0

                      const calculated = (kehadiranScore * wkh + tugasScore * wt + utsScore * wuts + uasScore * wuas) / 100
                      finalGradeStr = calculated.toFixed(2)
                      gradeLetter = getGradeLetter(calculated)
                      isGraded = true
                    }

                    const courseAttendance = attendanceList.filter((a) => a.grade_id === row.id)
                    const totalPertemuan = courseAttendance.length
                    const hadirPertemuan = courseAttendance.filter((a) => a.status === 'HADIR').length

                    return (
                      <tr key={row.id} className="hover:bg-neutral-50/30 transition-colors">
                        <td className="px-6 py-4 font-mono font-medium text-xs text-neutral-500">
                          {courseCode}
                        </td>
                        <td className="px-6 py-4 font-semibold text-neutral-900">
                          {courseName}
                        </td>
                        <td className="px-4 py-4 text-center font-medium text-neutral-700 font-mono">
                          <div className="flex flex-col items-center">
                            <span>{row.score_kehadiran !== null ? row.score_kehadiran : '-'}</span>
                            <span className="text-[10px] text-neutral-400 font-normal">Bobot: {wkh}%</span>
                            <span className="text-[10px] text-indigo-600 font-semibold mt-1 shrink-0">
                              Kehadiran: {hadirPertemuan} / {totalPertemuan} Pertemuan
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center font-medium text-neutral-700">
                          <div className="flex flex-col items-center">
                            <span>{row.score_tugas !== null ? row.score_tugas : '-'}</span>
                            <span className="text-[10px] text-neutral-400 font-normal">Bobot: {wt}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center font-medium text-neutral-700">
                          <div className="flex flex-col items-center">
                            <span>{row.score_uts !== null ? row.score_uts : '-'}</span>
                            <span className="text-[10px] text-neutral-400 font-normal">Bobot: {wuts}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center font-medium text-neutral-700">
                          <div className="flex flex-col items-center">
                            <span>{row.score_uas !== null ? row.score_uas : '-'}</span>
                            <span className="text-[10px] text-neutral-400 font-normal">Bobot: {wuas}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center font-bold text-indigo-700 bg-indigo-50/30">
                          {finalGradeStr}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {isGraded ? (
                            <span
                              className={`inline-flex items-center justify-center w-8 h-8 rounded-full border text-sm font-bold shadow-2xs ${
                                gradeLetter === 'A'
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                  : gradeLetter === 'B'
                                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                                  : gradeLetter === 'C'
                                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                                  : gradeLetter === 'D'
                                  ? 'bg-orange-50 border-orange-200 text-orange-700'
                                  : 'bg-red-50 border-red-200 text-red-700'
                              }`}
                            >
                              {gradeLetter}
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-1 rounded bg-neutral-100 text-neutral-400 border border-neutral-200 text-xs italic font-medium">
                              Belum Diinput
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
      </main>
    </div>
  )
}
