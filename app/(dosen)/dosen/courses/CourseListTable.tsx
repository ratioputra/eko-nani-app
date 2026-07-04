'use client'

import React, { useState } from 'react'
import { BookOpen, Search, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface CourseRow {
  id: string
  name: string
  code: string
  prodi: string | null
  semester: number | null
  kelas: string | null
  tahun_akademik: string | null
  created_at: string | null
  weight_tugas: number | null
  weight_uts: number | null
  weight_uas: number | null
}

interface CourseListTableProps {
  initialCourses: CourseRow[]
}

export default function CourseListTable({ initialCourses }: CourseListTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProdi, setSelectedProdi] = useState('')
  const [selectedTahun, setSelectedTahun] = useState('')

  // Generate dynamic academic years for the filter dropdown
  const currentYear = new Date().getFullYear()
  const academicYearOptions: string[] = []
  for (let year = currentYear - 2; year <= currentYear + 4; year++) {
    academicYearOptions.push(`${year}/${year + 1} Ganjil`)
    academicYearOptions.push(`${year}/${year + 1} Genap`)
  }

  // Combined live-filtering logic
  const filteredCourses = initialCourses.filter((course) => {
    const query = searchQuery.trim().toLowerCase()
    const matchSearch =
      query === '' ||
      course.code.toLowerCase().includes(query) ||
      course.name.toLowerCase().includes(query)

    const matchProdi = selectedProdi === '' || course.prodi === selectedProdi

    const matchTahun = selectedTahun === '' || course.tahun_akademik === selectedTahun

    return matchSearch && matchProdi && matchTahun
  })

  return (
    <div className="bg-white border border-neutral-200 shadow-sm rounded-lg overflow-hidden">
      {/* Header and Counters */}
      <div className="border-b border-neutral-100 bg-neutral-50/50 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-neutral-900 font-semibold text-lg flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            Daftar Kelas Mata Kuliah Anda
          </h2>
          <p className="text-neutral-500 text-xs mt-0.5">
            Tinjau, cari, dan saring daftar mata kuliah aktif Anda secara real-time.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-100 font-mono">
            {filteredCourses.length} dari {initialCourses.length} Cocok
          </span>
        </div>
      </div>

      {/* Filter Toolbar Section */}
      <div className="border-b border-neutral-100 bg-white p-4 flex flex-col sm:flex-row gap-3 items-center">
        {/* Search Bar Input */}
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          <Input
            type="text"
            placeholder="Cari kode atau nama matkul..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 border-neutral-300 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/30 text-neutral-950 bg-white placeholder:text-neutral-400 text-sm w-full font-medium"
          />
        </div>

        {/* Prodi Dropdown Filter */}
        <div className="w-full sm:w-auto shrink-0 flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-neutral-400 hidden sm:block" />
          <select
            value={selectedProdi}
            onChange={(e) => setSelectedProdi(e.target.value)}
            className="h-9 w-full sm:w-[220px] rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm shadow-xs transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-neutral-800 font-medium"
          >
            <option value="">Semua Prodi</option>
            <option value="S1 - Pendidikan Agama Islam">S1 - Pendidikan Agama Islam</option>
            <option value="S1 - Hukum Keluarga Islam">S1 - Hukum Keluarga Islam</option>
            <option value="S1 - Ekonomi Syariah">S1 - Ekonomi Syariah</option>
            <option value="S1 - Komunikasi Penyiaran Islam">S1 - Komunikasi Penyiaran Islam</option>
          </select>
        </div>

        {/* Tahun Akademik Dropdown Filter */}
        <div className="w-full sm:w-auto shrink-0">
          <select
            value={selectedTahun}
            onChange={(e) => setSelectedTahun(e.target.value)}
            className="h-9 w-full sm:w-[180px] rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm shadow-xs transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-neutral-850 font-medium"
          >
            <option value="">Semua Tahun</option>
            {academicYearOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Display */}
      {filteredCourses.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-neutral-50 border border-neutral-200 flex items-center justify-center text-neutral-450 mb-3">
            <BookOpen className="w-5 h-5 text-neutral-400" />
          </div>
          <h3 className="text-sm font-semibold text-neutral-800">Tidak ada hasil cocok</h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm">
            Tidak ada mata kuliah yang cocok dengan filter. Silakan periksa kembali query pencarian Anda atau reset saringan filter.
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
                <th className="px-6 py-3 w-[130px] text-center">Sem/Kelas</th>
                <th className="px-6 py-3 w-[180px] text-center">Tahun Akademik</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-sm">
              {filteredCourses.map((course) => {
                const semStr = course.semester ? `Sem ${course.semester}` : 'Sem -'
                const kelasStr = course.kelas ? course.kelas : '-'
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
                    <td className="px-6 py-4 text-center font-medium text-neutral-700">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-neutral-100 text-neutral-600 text-xs font-semibold border border-neutral-200">
                        {semStr} - {kelasStr}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-50 text-neutral-700 border border-neutral-200 font-mono shadow-3xs">
                        {course.tahun_akademik || '-'}
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
