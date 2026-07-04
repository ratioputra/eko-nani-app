'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { saveAttendanceAction, SaveAttendanceItem } from './actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Save, ShieldAlert, CheckCircle2, Loader2, Table } from 'lucide-react'

interface CourseItem {
  id: string
  name: string
  code: string
}

interface StudentEnrolled {
  gradeId: string
  studentId: string
  name: string
  nim: string
}

interface AttendanceGridProps {
  courses: CourseItem[]
}

export default function AttendanceGrid({ courses }: AttendanceGridProps) {
  // Filters state
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '')
  const [selectedPertemuan, setSelectedPertemuan] = useState<number>(1)

  // Data states
  const [students, setStudents] = useState<StudentEnrolled[]>([])
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'HADIR' | 'TIDAK HADIR'>>({})

  // Feedback states
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Pertemuan list (1 to 16)
  const pertemuanList = Array.from({ length: 16 }, (_, i) => i + 1)

  // Fetch student roster and attendance on filter change
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedCourseId) return
      setLoading(true)
      setErrorMsg(null)
      setSuccessMsg(null)

      try {
        const supabase = createClient()

        // 1. Fetch enrolled students (grades joined with profiles)
        const { data: gradesData, error: gradesError } = await supabase
          .from('grades')
          .select('id, student_id, profiles(name, nim)')
          .eq('course_id', selectedCourseId)

        if (gradesError) throw gradesError

        const enrolled = (gradesData || []).map((g: any) => {
          let profile = null
          if (g.profiles) {
            if (Array.isArray(g.profiles)) {
              profile = g.profiles[0]
            } else {
              profile = g.profiles
            }
          }
          return {
            gradeId: g.id,
            studentId: g.student_id,
            name: profile?.name || 'Mahasiswa',
            nim: profile?.nim || '-',
          }
        })

        // Sort by student name alphabetically
        enrolled.sort((a, b) => a.name.localeCompare(b.name))
        setStudents(enrolled)

        // 2. Fetch existing attendance records
        const gradeIds = enrolled.map((s) => s.gradeId)
        const initialMap: Record<string, 'HADIR' | 'TIDAK HADIR'> = {}

        // Default all to HADIR initially
        enrolled.forEach((s) => {
          initialMap[s.gradeId] = 'HADIR'
        })

        if (gradeIds.length > 0) {
          const { data: attData, error: attError } = await supabase
            .from('attendance')
            .select('grade_id, status')
            .in('grade_id', gradeIds)
            .eq('pertemuan_ke', selectedPertemuan)

          if (attError) throw attError

          if (attData && attData.length > 0) {
            attData.forEach((a: any) => {
              initialMap[a.grade_id] = a.status as 'HADIR' | 'TIDAK HADIR'
            })
          }
        }

        setAttendanceMap(initialMap)
      } catch (err: any) {
        console.error('Error in fetching attendance data:', err)
        setErrorMsg(err.message || 'Gagal memuat data absensi kelas.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedCourseId, selectedPertemuan])

  // Handle single student attendance toggle
  const handleToggle = (gradeId: string, status: 'HADIR' | 'TIDAK HADIR') => {
    setAttendanceMap((prev) => ({
      ...prev,
      [gradeId]: status,
    }))
    setSuccessMsg(null)
    setErrorMsg(null)
  }

  // Handle submit to Supabase
  const handleSaveAttendance = async () => {
    if (!selectedCourseId) return
    setSaving(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const payload: SaveAttendanceItem[] = students.map((s) => ({
        gradeId: s.gradeId,
        status: attendanceMap[s.gradeId] || 'HADIR',
      }))

      const result = await saveAttendanceAction(selectedCourseId, selectedPertemuan, payload)

      if (result?.error) {
        setErrorMsg(result.error)
      } else {
        setSuccessMsg(`Presensi Pertemuan ${selectedPertemuan} berhasil disimpan!`)
        // Auto fade success message after 5 seconds
        setTimeout(() => setSuccessMsg(null), 5000)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan data absensi kelas.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-lg border border-neutral-200 shadow-2xs flex flex-col sm:flex-row gap-4">
        {/* Course Select */}
        <div className="flex-1 flex flex-col gap-1.5">
          <label htmlFor="course-select-input" className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
            Mata Kuliah
          </label>
          <select
            id="course-select-input"
            value={selectedCourseId}
            onChange={(e) => {
              setSelectedCourseId(e.target.value)
              setErrorMsg(null)
              setSuccessMsg(null)
            }}
            className="h-9 w-full rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm shadow-xs transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-neutral-800 font-medium"
          >
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code} - {course.name}
              </option>
            ))}
          </select>
        </div>

        {/* Pertemuan Select */}
        <div className="w-full sm:w-[200px] flex flex-col gap-1.5">
          <label htmlFor="pertemuan-select-input" className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
            Pertemuan Ke-
          </label>
          <select
            id="pertemuan-select-input"
            value={String(selectedPertemuan)}
            onChange={(e) => {
              setSelectedPertemuan(Number(e.target.value))
              setErrorMsg(null)
              setSuccessMsg(null)
            }}
            className="h-9 w-full rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm shadow-xs transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-neutral-800 font-medium"
          >
            {pertemuanList.map((num) => (
              <option key={num} value={String(num)}>
                Pertemuan {num}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid Card */}
      <Card className="bg-white border border-neutral-200 shadow-sm rounded-lg overflow-hidden">
        <CardHeader className="border-b border-neutral-100 bg-neutral-50/50 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-neutral-900 font-semibold text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Roster Presensi Kelas
            </CardTitle>
            <CardDescription className="text-neutral-500 text-sm">
              Input status kehadiran mahasiswa untuk Sesi Pertemuan {selectedPertemuan}.
            </CardDescription>
          </div>
          <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-100 font-semibold self-start sm:self-auto">
            {students.length} Mahasiswa
          </span>
        </CardHeader>
        <CardContent className="p-0">
          {errorMsg && (
            <div className="m-6 p-3 bg-red-50 border border-red-100 text-red-700 rounded-md text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="m-6 p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-md text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              {successMsg}
            </div>
          )}

          {loading ? (
            <div className="p-16 text-center flex flex-col items-center justify-center text-neutral-500">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
              <p className="text-xs">Memuat daftar mahasiswa...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-neutral-50 border border-neutral-200 flex items-center justify-center text-neutral-400 mb-3">
                <Table className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-neutral-800">Tidak ada mahasiswa terdaftar</h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm">
                Belum ada data mahasiswa yang terdaftar untuk kelas mata kuliah ini di database.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50/50 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                      <th className="px-6 py-3 w-[60px] text-center">No</th>
                      <th className="px-6 py-3 w-[150px]">NIM</th>
                      <th className="px-6 py-3">Nama Mahasiswa</th>
                      <th className="px-6 py-3 text-center w-[240px]">Status Kehadiran</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-sm">
                    {students.map((student, idx) => {
                      const currentStatus = attendanceMap[student.gradeId] || 'HADIR'

                      return (
                        <tr key={student.gradeId} className="hover:bg-neutral-50/20 transition-colors">
                          <td className="px-6 py-4 text-center text-neutral-500 font-mono text-xs">
                            {idx + 1}
                          </td>
                          <td className="px-6 py-4 font-mono font-medium text-xs text-neutral-500">
                            {student.nim}
                          </td>
                          <td className="px-6 py-4 font-semibold text-neutral-900">
                            {student.name}
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex items-center justify-center gap-2">
                              {/* Hadir Button */}
                              <button
                                type="button"
                                onClick={() => handleToggle(student.gradeId, 'HADIR')}
                                className={`flex-1 text-center py-1.5 px-3 rounded text-xs font-semibold border transition-all ${
                                  currentStatus === 'HADIR'
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : 'bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50'
                                }`}
                              >
                                Hadir
                              </button>

                              {/* Tidak Hadir Button */}
                              <button
                                type="button"
                                onClick={() => handleToggle(student.gradeId, 'TIDAK HADIR')}
                                className={`flex-1 text-center py-1.5 px-3 rounded text-xs font-semibold border transition-all ${
                                  currentStatus === 'TIDAK HADIR'
                                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                                    : 'bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50'
                                }`}
                              >
                                Tidak Hadir
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Action persistent button row */}
              <div className="flex justify-end p-6 border-t border-neutral-100 bg-neutral-50/30">
                <Button
                  onClick={handleSaveAttendance}
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs transition-colors rounded-md px-6 flex items-center gap-1.5"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-1" />
                      Simpan Absensi
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
