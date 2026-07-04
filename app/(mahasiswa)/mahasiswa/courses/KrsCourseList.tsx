'use client'

import React, { useState, useTransition } from 'react'
import { Search, Filter, BookOpen, Check, ArrowRight, Loader2 } from 'lucide-react'
import { enrollInCourseAction } from './actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface CourseRow {
  id: string
  name: string
  code: string
  prodi: string | null
  semester: number | null
  kelas: string | null
  tahun_akademik: string | null
}

interface KrsCourseListProps {
  courses: CourseRow[]
  enrolledCourseIds: string[]
}

export default function KrsCourseList({ courses, enrolledCourseIds }: KrsCourseListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProdi, setSelectedProdi] = useState('')
  const [selectedSemester, setSelectedSemester] = useState('')
  const [selectedKelas, setSelectedKelas] = useState('')

  const [isPending, startTransition] = useTransition()
  const [loadingCourseId, setLoadingCourseId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const enrolledSet = new Set(enrolledCourseIds)

  // Dynamically extract unique prodi, semesters, and kelas for dropdown options
  const uniqueProdi = Array.from(new Set(courses.map((c) => c.prodi).filter(Boolean))) as string[]
  const uniqueSemesters = Array.from(new Set(courses.map((c) => c.semester).filter((s) => s !== null))) as number[]
  const uniqueKelas = Array.from(new Set(courses.map((c) => c.kelas).filter(Boolean))) as string[]

  // Sort semesters numerically
  uniqueSemesters.sort((a, b) => a - b)

  // Sieve logic
  const filteredCourses = courses.filter((course) => {
    const query = searchQuery.trim().toLowerCase()
    const matchSearch =
      query === '' ||
      course.code.toLowerCase().includes(query) ||
      course.name.toLowerCase().includes(query)

    const matchProdi = selectedProdi === '' || course.prodi === selectedProdi

    const matchSemester =
      selectedSemester === '' ||
      (course.semester !== null && course.semester.toString() === selectedSemester)

    const matchKelas = selectedKelas === '' || course.kelas === selectedKelas

    return matchSearch && matchProdi && matchSemester && matchKelas
  })

  const handleEnroll = async (courseId: string) => {
    setErrorMsg(null)
    setSuccessMsg(null)
    setLoadingCourseId(courseId)

    startTransition(async () => {
      try {
        const result = await enrollInCourseAction(courseId)
        if (result?.error) {
          setErrorMsg(result.error)
        } else {
          setSuccessMsg('Mata kuliah berhasil diambil!')
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Terjadi kesalahan sistem saat mengambil matkul.')
      } finally {
        setLoadingCourseId(null)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Feedback Alerts */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-md text-sm font-medium">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-md text-sm font-medium">
          {successMsg}
        </div>
      )}

      {/* Filter and Search Bar Card */}
      <div className="bg-white border border-neutral-200 shadow-sm rounded-lg p-4 flex flex-col md:flex-row gap-3 items-center">
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          <Input
            type="text"
            placeholder="Cari kode atau nama matkul..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 border-neutral-300 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/30 text-neutral-950 bg-white placeholder:text-neutral-400 text-sm font-medium w-full"
          />
        </div>

        {/* Prodi dropdown */}
        <div className="w-full md:w-auto flex items-center gap-2 shrink-0">
          <Filter className="w-3.5 h-3.5 text-neutral-400 hidden md:block" />
          <select
            value={selectedProdi}
            onChange={(e) => setSelectedProdi(e.target.value)}
            className="h-9 w-full md:w-[200px] rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm shadow-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-neutral-800 font-medium"
          >
            <option value="">Semua Prodi</option>
            {uniqueProdi.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Semester dropdown */}
        <div className="w-full md:w-auto shrink-0">
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="h-9 w-full md:w-[130px] rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm shadow-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-neutral-800 font-medium"
          >
            <option value="">Semua Sem</option>
            {uniqueSemesters.map((s) => (
              <option key={s} value={s.toString()}>
                Semester {s}
              </option>
            ))}
          </select>
        </div>

        {/* Kelas dropdown */}
        <div className="w-full md:w-auto shrink-0">
          <select
            value={selectedKelas}
            onChange={(e) => setSelectedKelas(e.target.value)}
            className="h-9 w-full md:w-[130px] rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm shadow-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-neutral-800 font-medium"
          >
            <option value="">Semua Kelas</option>
            {uniqueKelas.map((k) => (
              <option key={k} value={k}>
                Kelas {k}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Card Grid */}
      <div className="bg-white border border-neutral-200 shadow-sm rounded-lg overflow-hidden">
        <div className="border-b border-neutral-100 bg-neutral-50/50 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-neutral-900 font-semibold text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              Mata Kuliah Ditawarkan
            </h2>
            <p className="text-neutral-500 text-xs mt-0.5">
              Pilih kelas mata kuliah yang ingin Anda ambil dalam Rencana Studi (KRS) Anda.
            </p>
          </div>
          <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-100 font-mono">
            {filteredCourses.length} Kelas
          </span>
        </div>

        {filteredCourses.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-neutral-50 border border-neutral-200 flex items-center justify-center text-neutral-400 mb-3">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-800">Tidak ada kelas cocok</h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm">
              Tidak ada kelas mata kuliah yang ditawarkan sesuai kriteria pencarian atau saringan filter Anda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/50 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                  <th className="px-6 py-3 w-[120px]">Kode</th>
                  <th className="px-6 py-3">Nama Mata Kuliah</th>
                  <th className="px-6 py-3">Program Studi</th>
                  <th className="px-6 py-3 w-[100px] text-center">Sem</th>
                  <th className="px-6 py-3 w-[100px] text-center">Kelas</th>
                  <th className="px-6 py-3 w-[180px] text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-sm">
                {filteredCourses.map((course) => {
                  const isEnrolled = enrolledSet.has(course.id)
                  const isLoadingThis = loadingCourseId === course.id && isPending

                  return (
                    <tr key={course.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-indigo-600">
                        {course.code}
                      </td>
                      <td className="px-6 py-4 font-semibold text-neutral-900">
                        {course.name}
                      </td>
                      <td className="px-6 py-4 text-neutral-500 font-medium">
                        {course.prodi || '-'}
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-neutral-700 font-mono">
                        {course.semester || '-'}
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-neutral-700 font-mono">
                        {course.kelas || '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isEnrolled ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded bg-neutral-50 text-neutral-450 border border-neutral-200 text-xs font-semibold shadow-3xs select-none">
                            <Check className="w-3.5 h-3.5 text-neutral-400" />
                            Sudah Diambil
                          </span>
                        ) : (
                          <Button
                            onClick={() => handleEnroll(course.id)}
                            disabled={isLoadingThis || isPending}
                            className="bg-white hover:bg-indigo-50 border border-indigo-600 hover:border-indigo-700 text-indigo-600 hover:text-indigo-700 font-semibold px-3.5 py-1.5 rounded-md text-xs shadow-3xs transition-colors shrink-0 h-8 flex items-center gap-1 ml-auto"
                          >
                            {isLoadingThis ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Mengambil...
                              </>
                            ) : (
                              <>
                                Ambil
                                <ArrowRight className="w-3 h-3" />
                              </>
                            )}
                          </Button>
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
    </div>
  )
}
