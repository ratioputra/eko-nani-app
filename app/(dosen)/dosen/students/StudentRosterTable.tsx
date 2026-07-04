'use client'

import React, { useState } from 'react'
import { Users, Search, Filter, GraduationCap, Mail } from 'lucide-react'
import { Input } from '@/components/ui/input'

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

interface StudentEnrollment {
  id: string
  course_id: string
  student_id: string
  courses: CourseData | null
  profiles: ProfileData | null
}

interface StudentRosterTableProps {
  initialEnrollments: StudentEnrollment[]
}

export default function StudentRosterTable({ initialEnrollments }: StudentRosterTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedProdi, setSelectedProdi] = useState('')
  const [selectedKelas, setSelectedKelas] = useState('')

  // Extract unique filter options from the list
  const uniqueCourses = Array.from(
    new Map(
      initialEnrollments
        .map((e) => e.courses)
        .filter((c): c is CourseData => c !== null)
        .map((c) => [c.id, c])
    ).values()
  )

  const uniqueProdi = Array.from(
    new Set(
      initialEnrollments
        .map((e) => e.courses?.prodi)
        .filter((p): p is string => p !== null && p !== '')
    )
  )

  const uniqueKelas = Array.from(
    new Set(
      initialEnrollments
        .map((e) => e.courses?.kelas)
        .filter((k): k is string => k !== null && k !== '')
    )
  )

  // Filtering Logic
  const filteredEnrollments = initialEnrollments.filter((row) => {
    const student = row.profiles
    const course = row.courses

    if (!student || !course) return false

    const query = searchQuery.trim().toLowerCase()
    const matchSearch =
      query === '' ||
      (student.nim && student.nim.toLowerCase().includes(query)) ||
      student.name.toLowerCase().includes(query) ||
      student.email.toLowerCase().includes(query)

    const matchCourse = selectedCourse === '' || row.course_id === selectedCourse
    const matchProdi = selectedProdi === '' || course.prodi === selectedProdi
    const matchKelas = selectedKelas === '' || course.kelas === selectedKelas

    return matchSearch && matchCourse && matchProdi && matchKelas
  })

  return (
    <div className="bg-white border border-neutral-200 shadow-sm rounded-lg overflow-hidden font-sans">
      {/* Header and counter */}
      <div className="border-b border-neutral-100 bg-neutral-50/50 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-neutral-900 font-semibold text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Daftar Roster Mahasiswa
          </h2>
          <p className="text-neutral-500 text-xs mt-0.5">
            Daftar mahasiswa terdaftar di mata kuliah yang Anda ampu semester ini.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-100 font-mono">
            {filteredEnrollments.length} Mahasiswa
          </span>
        </div>
      </div>

      {/* Sifting Controls Bar */}
      <div className="border-b border-neutral-100 bg-white p-4 flex flex-col md:flex-row gap-3 items-center">
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          <Input
            type="text"
            placeholder="Cari NIM, nama, atau email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 border-neutral-300 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/30 text-neutral-955 bg-white placeholder:text-neutral-400 text-sm font-medium w-full"
          />
        </div>

        {/* Mata Kuliah select */}
        <div className="w-full md:w-auto flex items-center gap-2 shrink-0">
          <Filter className="w-3.5 h-3.5 text-neutral-400 hidden md:block" />
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="h-9 w-full md:w-[180px] rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm shadow-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-neutral-800 font-medium"
          >
            <option value="">Semua Matkul</option>
            {uniqueCourses.map((c) => (
              <option key={c.id} value={c.id}>
                [{c.code}] {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Prodi select */}
        <div className="w-full md:w-auto shrink-0">
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

        {/* Kelas select */}
        <div className="w-full md:w-auto shrink-0">
          <select
            value={selectedKelas}
            onChange={(e) => setSelectedKelas(e.target.value)}
            className="h-9 w-full md:w-[120px] rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm shadow-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-neutral-850 font-medium"
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

      {/* Table Display */}
      {filteredEnrollments.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-neutral-50 border border-neutral-200 flex items-center justify-center text-neutral-400 mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-neutral-800">Tidak ada mahasiswa</h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm">
            Tidak ada data mahasiswa terdaftar yang cocok dengan kriteria pencarian dan filter Anda.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/50 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                <th className="px-6 py-3 w-[150px]">NIM</th>
                <th className="px-6 py-3">Nama Mahasiswa</th>
                <th className="px-6 py-3">Program Studi</th>
                <th className="px-6 py-3">Mata Kuliah yang Diikuti</th>
                <th className="px-6 py-3 w-[120px] text-center">Kelas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-sm">
              {filteredEnrollments.map((row) => {
                const student = row.profiles
                const course = row.courses

                if (!student || !course) return null

                return (
                  <tr key={row.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-neutral-700">
                      {student.nim || '-'}
                    </td>
                    <td className="px-6 py-4 font-bold text-neutral-900">
                      <div className="flex flex-col">
                        <span>{student.name}</span>
                        <span className="text-[10px] text-neutral-450 font-mono font-semibold flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3" />
                          {student.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-neutral-500 font-medium">
                      {course.prodi || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-indigo-600 font-mono bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 shrink-0">
                          {course.code}
                        </span>
                        <span className="font-semibold text-neutral-800 text-xs sm:text-sm">
                          {course.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-neutral-700 font-mono">
                      <span className="inline-flex px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 text-xs border border-neutral-200">
                        {course.kelas || '-'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
