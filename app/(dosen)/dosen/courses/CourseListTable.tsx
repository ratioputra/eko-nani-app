'use client'

import React, { useState, useEffect } from 'react'
import { BookOpen, Search, Filter, Pencil, Trash2, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

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
  const router = useRouter()
  const [courses, setCourses] = useState<CourseRow[]>(initialCourses)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProdi, setSelectedProdi] = useState('')
  const [selectedTahun, setSelectedTahun] = useState('')

  // Edit Modal State
  const [editingCourse, setEditingCourse] = useState<CourseRow | null>(null)
  const [editCode, setEditCode] = useState('')
  const [editName, setEditName] = useState('')
  const [editProdi, setEditProdi] = useState('')
  const [editSemester, setEditSemester] = useState('')
  const [editKelas, setEditKelas] = useState('')
  const [editTahunAkademik, setEditTahunAkademik] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // Delete Dialog State
  const [deletingCourse, setDeletingCourse] = useState<CourseRow | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToastMsg = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => {
      setToast(null)
    }, 4000)
  }

  // Sync state when props change
  useEffect(() => {
    setCourses(initialCourses)
  }, [initialCourses])

  // Generate dynamic academic years for the filter and edit dropdowns
  const currentYear = new Date().getFullYear()
  const academicYearOptions: string[] = []
  for (let year = currentYear - 2; year <= currentYear + 4; year++) {
    academicYearOptions.push(`${year}/${year + 1} Ganjil`)
    academicYearOptions.push(`${year}/${year + 1} Genap`)
  }

  // Combined live-filtering logic
  const filteredCourses = courses.filter((course) => {
    const query = searchQuery.trim().toLowerCase()
    const matchSearch =
      query === '' ||
      course.code.toLowerCase().includes(query) ||
      course.name.toLowerCase().includes(query)

    const matchProdi = selectedProdi === '' || course.prodi === selectedProdi

    const matchTahun = selectedTahun === '' || course.tahun_akademik === selectedTahun

    return matchSearch && matchProdi && matchTahun
  })

  // Open Edit Modal
  const handleEditClick = (course: CourseRow) => {
    setEditingCourse(course)
    setEditCode(course.code)
    setEditName(course.name)
    setEditProdi(course.prodi || 'S1 - Pendidikan Agama Islam')
    setEditSemester(String(course.semester || '1'))
    setEditKelas(course.kelas || '')
    setEditTahunAkademik(course.tahun_akademik || `${currentYear}/${currentYear + 1} Ganjil`)
    setEditError(null)
  }

  // Submit Edit Form
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCourse) return

    setEditError(null)
    setEditLoading(true)

    const semNum = parseInt(editSemester, 10)
    if (isNaN(semNum) || semNum < 1 || semNum > 8) {
      setEditError('Semester harus berupa angka antara 1 dan 8.')
      setEditLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('courses')
        .update({
          code: editCode.trim(),
          name: editName.trim(),
          prodi: editProdi.trim(),
          semester: semNum,
          kelas: editKelas.trim(),
          tahun_akademik: editTahunAkademik.trim()
        })
        .eq('id', editingCourse.id)

      if (error) {
        setEditError(error.message)
      } else {
        showToastMsg('Mata kuliah berhasil diperbarui!')
        setEditingCourse(null)
        router.refresh()
      }
    } catch (err: any) {
      setEditError(err.message || 'Gagal memperbarui mata kuliah.')
    } finally {
      setEditLoading(false)
    }
  }

  // Submit Delete Form
  const handleDeleteSubmit = async () => {
    if (!deletingCourse) return

    setDeleteError(null)
    setDeleteLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', deletingCourse.id)

      if (error) {
        setDeleteError(error.message)
      } else {
        showToastMsg('Mata kuliah berhasil dihapus!')
        setDeletingCourse(null)
        router.refresh()
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Gagal menghapus mata kuliah.')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="bg-white border border-neutral-200 shadow-sm rounded-lg overflow-hidden relative">
      {/* Toast Alert Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 p-4 rounded-lg shadow-lg border text-sm flex items-center gap-2 animate-in fade-in slide-in-from-bottom-5 duration-300 ${
          toast.type === 'success' 
            ? 'bg-emerald-50 border-emerald-250 text-emerald-850' 
            : 'bg-red-50 border-red-250 text-red-850'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span className="font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Header and Counters */}
      <div className="border-b border-neutral-100 bg-neutral-50/50 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-neutral-900 font-semibold text-lg flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            Daftar Kelas Mata Kuliah Anda
          </h2>
          <p className="text-neutral-500 text-xs mt-0.5">
            Tinjau, cari, saring, serta edit atau hapus daftar mata kuliah aktif Anda secara real-time.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-100 font-mono">
            {filteredCourses.length} dari {courses.length} Cocok
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
                <th className="px-6 py-3 w-[120px] text-center">Sem/Kelas</th>
                <th className="px-6 py-3 w-[180px] text-center">Tahun Akademik</th>
                <th className="px-6 py-3 w-[110px] text-right">Aksi</th>
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
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleEditClick(course)}
                          title="Edit Mata Kuliah"
                          className="p-1.5 text-neutral-500 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 rounded-md transition-all cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingCourse(course)}
                          title="Hapus Mata Kuliah"
                          className="p-1.5 text-neutral-500 hover:text-red-650 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-md transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================
          EDIT MODAL FORM
          ======================================================== */}
      {editingCourse && (
        <div className="fixed inset-0 bg-neutral-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 shadow-xl rounded-lg max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-neutral-900 font-semibold text-base flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-indigo-600" />
                  Edit Detail Mata Kuliah
                </h3>
                <p className="text-neutral-500 text-xs mt-0.5">
                  Ubah data informasi kelas atau program studi akademik.
                </p>
              </div>
              <button
                onClick={() => setEditingCourse(null)}
                className="p-1.5 text-neutral-450 hover:text-neutral-800 rounded-md hover:bg-neutral-100 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleEditSubmit}>
              <div className="p-6 space-y-4">
                {editError && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-md text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    {editError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {/* Kode */}
                  <div className="col-span-2 sm:col-span-1 flex flex-col gap-1.5">
                    <Label className="text-neutral-700 font-semibold text-[10px] uppercase tracking-wider">
                      Kode Mata Kuliah
                    </Label>
                    <Input
                      type="text"
                      value={editCode}
                      onChange={(e) => setEditCode(e.target.value)}
                      required
                      className="h-9 border-neutral-300 text-neutral-900 bg-white"
                    />
                  </div>

                  {/* Nama */}
                  <div className="col-span-2 sm:col-span-1 flex flex-col gap-1.5">
                    <Label className="text-neutral-700 font-semibold text-[10px] uppercase tracking-wider">
                      Nama Mata Kuliah
                    </Label>
                    <Input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                      className="h-9 border-neutral-300 text-neutral-900 bg-white"
                    />
                  </div>

                  {/* Prodi */}
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <Label className="text-neutral-700 font-semibold text-[10px] uppercase tracking-wider">
                      Program Studi
                    </Label>
                    <select
                      value={editProdi}
                      onChange={(e) => setEditProdi(e.target.value)}
                      required
                      className="h-9 w-full rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm shadow-xs transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-neutral-850 font-medium"
                    >
                      <option value="S1 - Pendidikan Agama Islam">S1 - Pendidikan Agama Islam</option>
                      <option value="S1 - Hukum Keluarga Islam">S1 - Hukum Keluarga Islam</option>
                      <option value="S1 - Ekonomi Syariah">S1 - Ekonomi Syariah</option>
                      <option value="S1 - Komunikasi Penyiaran Islam">S1 - Komunikasi Penyiaran Islam</option>
                    </select>
                  </div>

                  {/* Semester */}
                  <div className="col-span-1 flex flex-col gap-1.5">
                    <Label className="text-neutral-700 font-semibold text-[10px] uppercase tracking-wider">
                      Semester
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      max="8"
                      value={editSemester}
                      onChange={(e) => setEditSemester(e.target.value)}
                      required
                      className="h-9 border-neutral-300 text-neutral-900 bg-white"
                    />
                  </div>

                  {/* Kelas */}
                  <div className="col-span-1 flex flex-col gap-1.5">
                    <Label className="text-neutral-700 font-semibold text-[10px] uppercase tracking-wider">
                      Kelas
                    </Label>
                    <Input
                      type="text"
                      value={editKelas}
                      onChange={(e) => setEditKelas(e.target.value)}
                      required
                      className="h-9 border-neutral-300 text-neutral-900 bg-white"
                    />
                  </div>

                  {/* Tahun Akademik */}
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <Label className="text-neutral-700 font-semibold text-[10px] uppercase tracking-wider">
                      Tahun Akademik
                    </Label>
                    <select
                      value={editTahunAkademik}
                      onChange={(e) => setEditTahunAkademik(e.target.value)}
                      required
                      className="h-9 w-full rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm shadow-xs transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-neutral-850 font-medium"
                    >
                      {academicYearOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50/50 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingCourse(null)}
                  disabled={editLoading}
                  className="h-9 text-xs font-semibold cursor-pointer border border-neutral-250 text-neutral-700"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={editLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold h-9 px-4 text-xs shadow-2xs cursor-pointer"
                >
                  {editLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Perubahan'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          DELETE CONFIRMATION DIALOG
          ======================================================== */}
      {deletingCourse && (
        <div className="fixed inset-0 bg-neutral-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 shadow-xl rounded-lg max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-5 border-b border-neutral-100 flex items-start gap-3 bg-red-50/30">
              <div className="p-2 bg-red-100 text-red-650 rounded-lg shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-neutral-900 font-bold text-base">
                  Hapus Mata Kuliah?
                </h3>
                <p className="text-neutral-550 text-xs leading-normal">
                  Konfirmasi penghapusan permanen untuk mata kuliah ini.
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-3">
              {deleteError && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-md text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  {deleteError}
                </div>
              )}
              
              <div className="text-neutral-600 text-sm leading-relaxed space-y-2">
                <p>
                  Apakah Anda yakin ingin menghapus mata kuliah <strong className="text-neutral-950 font-bold">[{deletingCourse.code}] {deletingCourse.name}</strong>?
                </p>
                <p className="text-xs bg-red-50 border border-red-100 p-2.5 rounded text-red-700 font-medium">
                  ⚠️ <strong>PENTING:</strong> Semua data nilai, presensi, jadwal mengajar, dan tugas kuliah mahasiswa terkait dengan mata kuliah ini akan ikut terhapus secara permanen dari database.
                </p>
              </div>
            </div>

            {/* Footer actions */}
            <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50/50 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeletingCourse(null)}
                disabled={deleteLoading}
                className="h-9 text-xs font-semibold cursor-pointer border border-neutral-250 text-neutral-700"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleDeleteSubmit}
                disabled={deleteLoading}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold h-9 px-4 text-xs shadow-2xs cursor-pointer"
              >
                {deleteLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                    Menghapus...
                  </>
                ) : (
                  'Hapus Permanen'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

