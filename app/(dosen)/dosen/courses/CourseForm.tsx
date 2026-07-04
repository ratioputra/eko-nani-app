'use client'

import React, { useState } from 'react'
import { createCourseAction } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Plus } from 'lucide-react'

export default function CourseForm() {
  // 1. Get the current year dynamically
  const currentYear = new Date().getFullYear();

  // 2. Loop from (currentYear - 2) up to (currentYear + 4)
  const academicYearOptions: string[] = [];
  for (let year = currentYear - 2; year <= currentYear + 4; year++) {
    academicYearOptions.push(`${year}/${year + 1} Ganjil`);
    academicYearOptions.push(`${year}/${year + 1} Genap`);
  }

  // 3. Define the default selected value option to the current ongoing period
  const defaultTahunAkademik = `${currentYear}/${currentYear + 1} Ganjil`;

  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [prodi, setProdi] = useState('S1 - Pendidikan Agama Islam')
  const [semester, setSemester] = useState('1')
  const [kelas, setKelas] = useState('')
  const [tahunAkademik, setTahunAkademik] = useState(defaultTahunAkademik)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)
    setLoading(true)

    const semNum = parseInt(semester, 10)
    if (isNaN(semNum) || semNum < 1 || semNum > 8) {
      setErrorMsg('Semester harus berupa angka antara 1 dan 8.')
      setLoading(false)
      return
    }

    try {
      const result = await createCourseAction(
        code,
        name,
        prodi,
        semNum,
        kelas,
        tahunAkademik
      )

      if (result?.error) {
        setErrorMsg(result.error)
      } else {
        setSuccessMsg('Mata kuliah berhasil didaftarkan!')
        setCode('')
        setName('')
        setKelas('')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menambahkan mata kuliah.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-white border border-neutral-200 shadow-sm rounded-lg overflow-hidden">
      <CardHeader className="border-b border-neutral-100 bg-neutral-50/50 px-6 py-4">
        <CardTitle className="text-neutral-900 font-semibold text-lg flex items-center gap-2">
          <Plus className="w-5 h-5 text-indigo-600" />
          Daftarkan Mata Kuliah Baru
        </CardTitle>
        <CardDescription className="text-neutral-500 text-sm">
          Lengkapi detail akademik mata kuliah yang akan Anda ampu semester ini.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-md text-sm">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-md text-sm">
              {successMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Kode Mata Kuliah */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="code" className="text-neutral-700 font-semibold text-[10px] uppercase tracking-wider">
                Kode Mata Kuliah
              </Label>
              <Input
                id="code"
                type="text"
                placeholder="Contoh: PAI-301, HKI-202"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                className="h-9 border-neutral-300 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/30 text-neutral-900 bg-white"
              />
            </div>

            {/* Nama Mata Kuliah */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name" className="text-neutral-700 font-semibold text-[10px] uppercase tracking-wider">
                Nama Mata Kuliah
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Contoh: Ushul Fiqh, Ilmu Kalam"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-9 border-neutral-300 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/30 text-neutral-900 bg-white"
              />
            </div>

            {/* Program Studi */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="prodi" className="text-neutral-700 font-semibold text-[10px] uppercase tracking-wider">
                Program Studi
              </Label>
              <select
                id="prodi"
                value={prodi}
                onChange={(e) => setProdi(e.target.value)}
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
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="semester" className="text-neutral-700 font-semibold text-[10px] uppercase tracking-wider">
                Semester
              </Label>
              <Input
                id="semester"
                type="number"
                min="1"
                max="8"
                placeholder="1-8"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                required
                className="h-9 border-neutral-300 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/30 text-neutral-900 bg-white"
              />
            </div>

            {/* Kelas */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="kelas" className="text-neutral-700 font-semibold text-[10px] uppercase tracking-wider">
                Kelas
              </Label>
              <Input
                id="kelas"
                type="text"
                placeholder="Contoh: A, B, Eksekutif"
                value={kelas}
                onChange={(e) => setKelas(e.target.value)}
                required
                className="h-9 border-neutral-300 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/30 text-neutral-900 bg-white"
              />
            </div>

            {/* Tahun Akademik */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tahunAkademik" className="text-neutral-700 font-semibold text-[10px] uppercase tracking-wider">
                Tahun Akademik
              </Label>
              <select
                id="tahunAkademik"
                value={tahunAkademik}
                onChange={(e) => setTahunAkademik(e.target.value)}
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

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs transition-colors rounded-md px-5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Memproses...
                </>
              ) : (
                'Tambah Mata Kuliah'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
