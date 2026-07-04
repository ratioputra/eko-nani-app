'use client'

import React, { useState, useEffect } from 'react'
import { updateCourseWeightsAction, saveAllGradesAction } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calculator, Save, ShieldAlert, CheckCircle2, Loader2, Table } from 'lucide-react'

interface StudentGrade {
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

interface GradeManagerProps {
  courseId: string
  initialWeightKehadiran: number
  initialWeightTugas: number
  initialWeightUts: number
  initialWeightUas: number
  initialGrades: StudentGrade[]
}

export default function GradeManager({
  courseId,
  initialWeightKehadiran,
  initialWeightTugas,
  initialWeightUts,
  initialWeightUas,
  initialGrades,
}: GradeManagerProps) {
  // Weights state
  const [weightKehadiran, setWeightKehadiran] = useState(initialWeightKehadiran)
  const [weightTugas, setWeightTugas] = useState(initialWeightTugas)
  const [weightUts, setWeightUts] = useState(initialWeightUts)
  const [weightUas, setWeightUas] = useState(initialWeightUas)

  // Sync state if props change (e.g. course changed)
  useEffect(() => {
    setWeightKehadiran(initialWeightKehadiran)
    setWeightTugas(initialWeightTugas)
    setWeightUts(initialWeightUts)
    setWeightUas(initialWeightUas)
  }, [initialWeightKehadiran, initialWeightTugas, initialWeightUts, initialWeightUas])

  // Grades state
  const [gradesList, setGradesList] = useState<StudentGrade[]>(initialGrades)

  useEffect(() => {
    setGradesList(initialGrades)
  }, [initialGrades])

  // Feedback messages
  const [weightError, setWeightError] = useState<string | null>(null)
  const [weightSuccess, setWeightSuccess] = useState<string | null>(null)
  const [weightLoading, setWeightLoading] = useState(false)

  const [gradesError, setGradesError] = useState<string | null>(null)
  const [gradesSuccess, setGradesSuccess] = useState<string | null>(null)
  const [gradesLoading, setGradesLoading] = useState(false)

  // Handle weight change
  const handleWeightSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setWeightError(null)
    setWeightSuccess(null)
    setWeightLoading(true)

    const sum = Number(weightKehadiran) + Number(weightTugas) + Number(weightUts) + Number(weightUas)
    if (sum !== 100) {
      setWeightError(`Total bobot harus bernilai 100%. Total saat ini: ${sum}%`)
      setWeightLoading(false)
      return
    }

    try {
      const result = await updateCourseWeightsAction(
        courseId,
        weightKehadiran,
        weightTugas,
        weightUts,
        weightUas
      )

      if (result?.error) {
        setWeightError(result.error)
      } else {
        setWeightSuccess('Bobot penilaian berhasil diperbarui!')
      }
    } catch (err: any) {
      setWeightError(err.message || 'Gagal menyimpan bobot.')
    } finally {
      setWeightLoading(false)
    }
  }

  // Handle cell inputs change
  const handleCellChange = (
    index: number,
    field: 'score_kehadiran' | 'score_tugas' | 'score_uts' | 'score_uas',
    valStr: string
  ) => {
    const newList = [...gradesList]
    if (valStr === '') {
      newList[index][field] = null
    } else {
      const num = Number(valStr)
      // Clamp between 0 and 100
      newList[index][field] = Math.min(100, Math.max(0, num))
    }
    setGradesList(newList)
  }

  // Handle bulk save
  const handleSaveGrades = async () => {
    setGradesError(null)
    setGradesSuccess(null)
    setGradesLoading(true)

    try {
      const payload = gradesList.map((g) => ({
        id: g.id,
        studentId: g.student_id,
        courseId: courseId,
        scoreKehadiran: g.score_kehadiran,
        scoreTugas: g.score_tugas,
        scoreUts: g.score_uts,
        scoreUas: g.score_uas,
      }))

      const result = await saveAllGradesAction(courseId, payload)

      if (result?.error) {
        setGradesError(result.error)
      } else {
        setGradesSuccess('Semua nilai mahasiswa berhasil disimpan!')
        // Auto fade success message
        setTimeout(() => setGradesSuccess(null), 5000)
      }
    } catch (err: any) {
      setGradesError(err.message || 'Gagal menyimpan nilai.')
    } finally {
      setGradesLoading(false)
    }
  }

  // Live calculation of final grade with dynamic course weights
  const calculateFinal = (
    scoreKehadiran: number | null,
    scoreTugas: number | null,
    scoreUts: number | null,
    scoreUas: number | null
  ) => {
    const k = scoreKehadiran ?? 0
    const t = scoreTugas ?? 0
    const ut = scoreUts ?? 0
    const ua = scoreUas ?? 0
    const finalVal = (k * weightKehadiran + t * weightTugas + ut * weightUts + ua * weightUas) / 100
    return parseFloat(finalVal.toFixed(2))
  }

  const weightSum = Number(weightKehadiran) + Number(weightTugas) + Number(weightUts) + Number(weightUas)

  return (
    <div className="space-y-8">
      {/* 1. Weights Card */}
      <Card className="bg-white border border-neutral-200 shadow-sm rounded-lg overflow-hidden">
        <CardHeader className="border-b border-neutral-100 bg-neutral-50/50 px-6 py-4">
          <CardTitle className="text-neutral-900 font-semibold text-base flex items-center gap-2">
            <Calculator className="w-5 h-5 text-indigo-600" />
            Bobot Penilaian (Kontrak Nilai)
          </CardTitle>
          <CardDescription className="text-neutral-500 text-sm">
            Atur bobot persentase nilai Kehadiran, Tugas, UTS, dan UAS. Jumlah keseluruhan bobot harus tepat 100%.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleWeightSubmit} className="space-y-4">
            {weightError && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-md text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                {weightError}
              </div>
            )}
            {weightSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-md text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                {weightSuccess}
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="wKehadiran" className="text-neutral-700 font-medium text-xs uppercase tracking-wider">
                  Kehadiran (%)
                </Label>
                <Input
                  id="wKehadiran"
                  type="number"
                  min="0"
                  max="100"
                  value={weightKehadiran}
                  onChange={(e) => {
                    setWeightKehadiran(Number(e.target.value))
                    setWeightSuccess(null)
                    setWeightError(null)
                  }}
                  required
                  className="border-neutral-300 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/30 text-neutral-900 bg-white"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="wTugas" className="text-neutral-700 font-medium text-xs uppercase tracking-wider">
                  Tugas (%)
                </Label>
                <Input
                  id="wTugas"
                  type="number"
                  min="0"
                  max="100"
                  value={weightTugas}
                  onChange={(e) => {
                    setWeightTugas(Number(e.target.value))
                    setWeightSuccess(null)
                    setWeightError(null)
                  }}
                  required
                  className="border-neutral-300 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/30 text-neutral-900 bg-white"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="wUts" className="text-neutral-700 font-medium text-xs uppercase tracking-wider">
                  UTS (%)
                </Label>
                <Input
                  id="wUts"
                  type="number"
                  min="0"
                  max="100"
                  value={weightUts}
                  onChange={(e) => {
                    setWeightUts(Number(e.target.value))
                    setWeightSuccess(null)
                    setWeightError(null)
                  }}
                  required
                  className="border-neutral-300 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/30 text-neutral-900 bg-white"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="wUas" className="text-neutral-700 font-medium text-xs uppercase tracking-wider">
                  UAS (%)
                </Label>
                <Input
                  id="wUas"
                  type="number"
                  min="0"
                  max="100"
                  value={weightUas}
                  onChange={(e) => {
                    setWeightUas(Number(e.target.value))
                    setWeightSuccess(null)
                    setWeightError(null)
                  }}
                  required
                  className="border-neutral-300 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/30 text-neutral-900 bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-neutral-100 pt-4">
              <span className="text-xs font-semibold text-neutral-500">
                Total Persentase: 
                <span className={`ml-1 font-bold ${weightSum === 100 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {weightSum}%
                </span>
              </span>
              <Button
                type="submit"
                disabled={weightLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs transition-colors rounded-md px-4"
              >
                {weightLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Memproses...
                  </>
                ) : (
                  'Update Bobot'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 2. Spreadsheet Table Card */}
      <Card className="bg-white border border-neutral-200 shadow-sm rounded-lg overflow-hidden">
        <CardHeader className="border-b border-neutral-100 bg-neutral-50/50 px-6 py-4 flex items-center justify-between">
          <div>
            <CardTitle className="text-neutral-900 font-semibold text-base flex items-center gap-2">
              <Table className="w-5 h-5 text-indigo-600" />
              Excel-Style Grade Grid
            </CardTitle>
            <CardDescription className="text-neutral-500 text-sm">
              Ketik nilai Tugas, UTS, dan UAS langsung pada sel tabel. Nilai Akhir akan dihitung secara langsung (live).
            </CardDescription>
          </div>
          <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-100 font-semibold">
            {gradesList.length} Mahasiswa
          </span>
        </CardHeader>
        <CardContent className="p-0">
          {gradesError && (
            <div className="m-6 p-3 bg-red-50 border border-red-100 text-red-700 rounded-md text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
              {gradesError}
            </div>
          )}
          {gradesSuccess && (
            <div className="m-6 p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-md text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              {gradesSuccess}
            </div>
          )}

          {gradesList.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-neutral-50 border border-neutral-200 flex items-center justify-center text-neutral-400 mb-3">
                <Table className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-neutral-800">Tidak ada mahasiswa terdaftar</h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm">
                Belum ada data mahasiswa yang terdaftar di kelas ini di dalam database grades.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50/50 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                      <th className="px-6 py-3 min-w-[200px]">Nama Mahasiswa</th>
                      <th className="px-4 py-3 text-center w-[120px]">Kehadiran ({weightKehadiran}%)</th>
                      <th className="px-4 py-3 text-center w-[120px]">Tugas ({weightTugas}%)</th>
                      <th className="px-4 py-3 text-center w-[120px]">UTS ({weightUts}%)</th>
                      <th className="px-4 py-3 text-center w-[120px]">UAS ({weightUas}%)</th>
                      <th className="px-6 py-3 text-center w-[140px] bg-indigo-50/30">Nilai Akhir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-sm">
                    {gradesList.map((grade, index) => {
                      const studentName = grade.profiles?.name || 'Mahasiswa'
                      const finalGrade = calculateFinal(grade.score_kehadiran, grade.score_tugas, grade.score_uts, grade.score_uas)
                      return (
                        <tr key={grade.id} className="hover:bg-neutral-50/30 transition-colors">
                          <td className="px-6 py-3 font-semibold text-[#171717]">{studentName}</td>
                          
                          {/* Kehadiran input */}
                          <td className="px-2 py-1 text-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="0"
                              value={grade.score_kehadiran ?? ''}
                              onChange={(e) => handleCellChange(index, 'score_kehadiran', e.target.value)}
                              className="w-full text-center bg-transparent border-0 border-b border-transparent focus:border-indigo-500 hover:border-neutral-200 focus:bg-indigo-50/10 rounded-none px-2 py-1 focus:ring-0 focus:outline-none transition-colors font-medium text-neutral-800"
                            />
                          </td>

                          {/* Tugas input */}
                          <td className="px-2 py-1 text-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="0"
                              value={grade.score_tugas ?? ''}
                              onChange={(e) => handleCellChange(index, 'score_tugas', e.target.value)}
                              className="w-full text-center bg-transparent border-0 border-b border-transparent focus:border-indigo-500 hover:border-neutral-200 focus:bg-indigo-50/10 rounded-none px-2 py-1 focus:ring-0 focus:outline-none transition-colors font-medium text-neutral-800"
                            />
                          </td>

                          {/* UTS input */}
                          <td className="px-2 py-1 text-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="0"
                              value={grade.score_uts ?? ''}
                              onChange={(e) => handleCellChange(index, 'score_uts', e.target.value)}
                              className="w-full text-center bg-transparent border-0 border-b border-transparent focus:border-indigo-500 hover:border-neutral-200 focus:bg-indigo-50/10 rounded-none px-2 py-1 focus:ring-0 focus:outline-none transition-colors font-medium text-neutral-800"
                            />
                          </td>

                          {/* UAS input */}
                          <td className="px-2 py-1 text-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="0"
                              value={grade.score_uas ?? ''}
                              onChange={(e) => handleCellChange(index, 'score_uas', e.target.value)}
                              className="w-full text-center bg-transparent border-0 border-b border-transparent focus:border-indigo-500 hover:border-neutral-200 focus:bg-indigo-50/10 rounded-none px-2 py-1 focus:ring-0 focus:outline-none transition-colors font-medium text-neutral-800"
                            />
                          </td>

                          {/* Live Final Grade Display */}
                          <td className="px-6 py-3 text-center bg-indigo-50/30 font-bold text-indigo-700">
                            {finalGrade.toFixed(2)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Save Button Row */}
              <div className="flex justify-end p-6 border-t border-neutral-100 bg-neutral-50/30">
                <Button
                  onClick={handleSaveGrades}
                  disabled={gradesLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs transition-colors rounded-md px-6 flex items-center gap-1.5"
                >
                  {gradesLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Menyimpan Nilai...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Simpan Semua Nilai
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
