'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createAssignmentAction, gradeSubmissionAction } from './actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  FileText,
  Plus,
  ArrowLeft,
  Calendar,
  User,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Loader2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react'

interface Course {
  id: string
  name: string
  code: string
}

interface Assignment {
  id: string
  course_id: string
  title: string
  description: string | null
  deadline: string
  created_at: string
}

interface StudentSubmissionRow {
  gradeId: string
  studentId: string
  name: string
  nim: string
  submissionId: string | null
  fileUrl: string | null
  scoreTugas: number | null
  feedback: string | null
  submittedAt: string | null
}

interface AssignmentManagerProps {
  courses: Course[]
}

export default function AssignmentManager({ courses }: AssignmentManagerProps) {
  // Navigation & Sifting states
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '')
  const [currentView, setCurrentView] = useState<'level1' | 'level2' | 'level3'>('level1')

  // Selected entities
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmissionRow | null>(null)

  // Data states
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [studentsSubmissions, setStudentsSubmissions] = useState<StudentSubmissionRow[]>([])

  // Modal / Form states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newDeadline, setNewDeadline] = useState('')

  // Grading states
  const [inputScore, setInputScore] = useState<string>('')
  const [inputFeedback, setInputFeedback] = useState<string>('')

  // Loading/Feedback states
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // 1. Fetch assignments when selectedCourseId changes
  const fetchAssignments = async (courseId: string) => {
    if (!courseId) return
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAssignments(data || [])
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memuat daftar tugas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssignments(selectedCourseId)
  }, [selectedCourseId])

  // 2. Fetch student roster & submissions for selected assignment (Level 2)
  const fetchSubmissions = async (assignment: Assignment) => {
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const supabase = createClient()

      // Fetch grades (enrolled students)
      const { data: gradesData, error: gradesError } = await supabase
        .from('grades')
        .select('id, student_id, profiles(name, nim)')
        .eq('course_id', selectedCourseId)

      if (gradesError) throw gradesError

      // Fetch submissions
      const { data: subData, error: subError } = await supabase
        .from('submissions')
        .select('*')
        .eq('assignment_id', assignment.id)

      if (subError) throw subError

      // Map profiles and submissions
      const roster: StudentSubmissionRow[] = (gradesData || []).map((g: any) => {
        let profile = null
        if (g.profiles) {
          if (Array.isArray(g.profiles)) {
            profile = g.profiles[0]
          } else {
            profile = g.profiles
          }
        }

        const sub = (subData || []).find((s) => s.student_id === g.student_id)

        return {
          gradeId: g.id,
          studentId: g.student_id,
          name: profile?.name || 'Mahasiswa',
          nim: profile?.nim || '-',
          submissionId: sub ? sub.id : null,
          fileUrl: sub ? sub.file_url : null,
          scoreTugas: sub ? sub.score_tugas : null,
          feedback: sub ? sub.feedback : null,
          submittedAt: sub ? sub.submitted_at : null,
        }
      })

      roster.sort((a, b) => a.name.localeCompare(b.name))
      setStudentsSubmissions(roster)
      setSelectedAssignment(assignment)
      setCurrentView('level2')
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memuat status pengumpulan tugas.')
    } finally {
      setLoading(false)
    }
  }

  // 3. Handle Create Assignment Submit
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCourseId) return
    setActionLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const result = await createAssignmentAction(
        selectedCourseId,
        newTitle,
        newDescription,
        newDeadline
      )

      if (result?.error) {
        setErrorMsg(result.error)
      } else {
        setSuccessMsg('Tugas baru berhasil dirilis!')
        setShowCreateModal(false)
        setNewTitle('')
        setNewDescription('')
        setNewDeadline('')
        await fetchAssignments(selectedCourseId)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal merilis tugas baru.')
    } finally {
      setActionLoading(false)
    }
  }

  // 4. Enter Level 3 (Reviewing PDF Submission)
  const handleStartReview = (subRow: StudentSubmissionRow) => {
    setSelectedSubmission(subRow)
    setInputScore(subRow.scoreTugas !== null ? String(subRow.scoreTugas) : '')
    setInputFeedback(subRow.feedback || '')
    setErrorMsg(null)
    setSuccessMsg(null)
    setCurrentView('level3')
  }

  // 5. Submit Submission Grade
  const handleSaveGrade = async () => {
    if (!selectedSubmission?.submissionId) return
    setActionLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    const scoreNum = Number(inputScore)
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      setErrorMsg('Nilai harus berupa angka antara 0 dan 100.')
      setActionLoading(false)
      return
    }

    try {
      const result = await gradeSubmissionAction(
        selectedSubmission.submissionId,
        scoreNum,
        inputFeedback
      )

      if (result?.error) {
        setErrorMsg(result.error)
      } else {
        setSuccessMsg('Penilaian tugas berhasil disimpan!')
        // Refresh Level 2 list first
        if (selectedAssignment) {
          await fetchSubmissions(selectedAssignment)
        }
        setCurrentView('level2')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan penilaian tugas.')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast Alert Feedback Banner */}
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-md text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-md text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* ======================================================
          LEVEL 1 VIEW: List assignments of selected course
          ====================================================== */}
      {currentView === 'level1' && (
        <div className="space-y-6">
          {/* Top Course selector toolbar */}
          <div className="bg-white p-4 rounded-lg border border-neutral-200 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 flex flex-col gap-1.5 max-w-sm">
              <label htmlFor="course-select-assignments" className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                Pilih Mata Kuliah
              </label>
              <select
                id="course-select-assignments"
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="h-9 w-full rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm shadow-xs transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-neutral-800 font-medium"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    [{c.code}] {c.name}
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={() => {
                setErrorMsg(null)
                setSuccessMsg(null)
                setShowCreateModal(true)
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs self-start sm:self-auto flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Buat Tugas Baru
            </Button>
          </div>

          {/* List Card Assignments */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-neutral-500 uppercase tracking-wider">
              Daftar Tugas Dirilis
            </h2>

            {loading ? (
              <div className="p-16 text-center flex flex-col items-center justify-center text-neutral-500 bg-white border border-neutral-200 rounded-lg">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
                <p className="text-xs">Memuat daftar tugas...</p>
              </div>
            ) : assignments.length === 0 ? (
              <div className="p-16 text-center bg-white border border-neutral-200 rounded-lg flex flex-col items-center justify-center">
                <FileText className="w-10 h-10 text-neutral-300 mb-3" />
                <h3 className="text-sm font-semibold text-neutral-800">Belum ada tugas dirilis</h3>
                <p className="text-xs text-neutral-500 mt-1 max-w-sm">
                  Gunakan tombol "Buat Tugas Baru" di atas untuk merilis evaluasi tugas bagi mahasiswa kelas ini.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assignments.map((assign) => (
                  <Card
                    key={assign.id}
                    className="bg-white border border-neutral-200 hover:border-neutral-300 hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
                    onClick={() => fetchSubmissions(assign)}
                  >
                    <CardHeader className="p-5 pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <CardTitle className="text-neutral-900 group-hover:text-indigo-600 font-bold text-base transition-colors line-clamp-1">
                          {assign.title}
                        </CardTitle>
                        <span className="text-[10px] text-neutral-400 font-mono shrink-0">
                          {new Date(assign.created_at).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                      <CardDescription className="text-neutral-500 text-xs line-clamp-2 mt-1.5">
                        {assign.description || 'Tidak ada deskripsi.'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-5 pt-0 flex items-center justify-between border-t border-neutral-100 mt-3 text-xs bg-neutral-50/50 rounded-b-lg py-3">
                      <span className="flex items-center gap-1 text-neutral-500 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                        Tenggat: <span className="font-semibold text-rose-600">{new Date(assign.deadline).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </span>
                      <span className="text-indigo-600 font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                        Detail & Roster <ChevronRight className="w-4 h-4" />
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* CREATE ASSIGNMENT MODAL OVERLAY */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="bg-white border border-neutral-200 rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <h3 className="font-bold text-neutral-900 text-base">Buat Tugas Baru</h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-neutral-400 hover:text-neutral-600 text-lg font-bold"
                  >
                    ×
                  </button>
                </div>
                <form onSubmit={handleCreateAssignment} className="space-y-4 text-sm">
                  {/* Title */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="new-title" className="font-semibold text-neutral-700 text-xs">
                      Judul Tugas <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="new-title"
                      type="text"
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Masukkan judul tugas..."
                      className="h-9 w-full rounded border border-neutral-300 px-3 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-neutral-900"
                    />
                  </div>

                  {/* Description */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="new-desc" className="font-semibold text-neutral-700 text-xs">
                      Deskripsi / Instruksi
                    </label>
                    <textarea
                      id="new-desc"
                      rows={3}
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="Berikan instruksi detail tugas..."
                      className="w-full rounded border border-neutral-300 p-2.5 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-neutral-900"
                    />
                  </div>

                  {/* Deadline */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="new-deadline" className="font-semibold text-neutral-700 text-xs">
                      Tenggat Waktu (Deadline) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="new-deadline"
                      type="datetime-local"
                      required
                      value={newDeadline}
                      onChange={(e) => setNewDeadline(e.target.value)}
                      className="h-9 w-full rounded border border-neutral-300 px-3 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-neutral-900"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2 border-t border-neutral-100 pt-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateModal(false)}
                      className="border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      disabled={actionLoading}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                    >
                      {actionLoading ? 'Menyimpan...' : 'Rilis Tugas'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================
          LEVEL 2 VIEW: Enrolled student list table & submissions
          ====================================================== */}
      {currentView === 'level2' && selectedAssignment && (
        <div className="space-y-6 animate-fade-in">
          {/* Header row with back trigger */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-neutral-200 pb-4 gap-4">
            <div className="space-y-1.5">
              <button
                onClick={() => {
                  setErrorMsg(null)
                  setSuccessMsg(null)
                  setCurrentView('level1')
                }}
                className="text-neutral-500 hover:text-neutral-800 text-xs flex items-center gap-1 group font-semibold"
              >
                <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                Kembali ke Daftar Tugas
              </button>
              <h2 className="text-xl font-bold text-neutral-900">
                Status Pengumpulan: {selectedAssignment.title}
              </h2>
              <p className="text-xs text-neutral-500">
                Deadline: <span className="font-semibold text-neutral-700">{new Date(selectedAssignment.deadline).toLocaleString('id-ID')}</span>
              </p>
            </div>
            <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-100 font-semibold self-start sm:self-auto font-mono">
              {studentsSubmissions.filter((s) => s.submissionId !== null).length} / {studentsSubmissions.length} Dikumpulkan
            </span>
          </div>

          {/* Roster Table */}
          <Card className="bg-white border border-neutral-200 shadow-sm rounded-lg overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50/50 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                      <th className="px-6 py-3 w-[60px] text-center">No</th>
                      <th className="px-6 py-3 w-[150px]">NIM</th>
                      <th className="px-6 py-3">Nama Mahasiswa</th>
                      <th className="px-6 py-3 text-center w-[160px]">Status</th>
                      <th className="px-6 py-3 text-center w-[100px]">Nilai</th>
                      <th className="px-6 py-3 text-center w-[120px]">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-sm">
                    {studentsSubmissions.map((sub, idx) => {
                      let statusBadge = (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded border border-neutral-200">
                          <Clock className="w-3 h-3 shrink-0" />
                          Not Submitted
                        </span>
                      )

                      if (sub.submissionId) {
                        if (sub.scoreTugas !== null) {
                          statusBadge = (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100">
                              <CheckCircle className="w-3 h-3 shrink-0" />
                              Graded
                            </span>
                          )
                        } else {
                          statusBadge = (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">
                              <Eye className="w-3 h-3 shrink-0" />
                              Submitted
                            </span>
                          )
                        }
                      }

                      return (
                        <tr key={sub.studentId} className="hover:bg-neutral-50/20 transition-colors">
                          <td className="px-6 py-4 text-center text-neutral-500 font-mono text-xs">
                            {idx + 1}
                          </td>
                          <td className="px-6 py-4 font-mono font-medium text-xs text-neutral-500">
                            {sub.nim}
                          </td>
                          <td className="px-6 py-4 font-semibold text-neutral-900">
                            {sub.name}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {statusBadge}
                          </td>
                          <td className="px-6 py-4 text-center font-mono font-bold text-neutral-700">
                            {sub.scoreTugas !== null ? sub.scoreTugas : '-'}
                          </td>
                          <td className="px-6 py-3 text-center">
                            {sub.submissionId ? (
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => handleStartReview(sub)}
                                className="border-neutral-200 hover:bg-indigo-50 hover:text-indigo-700 text-xs px-2.5 py-1 rounded"
                              >
                                Review
                              </Button>
                            ) : (
                              <span className="text-xs text-neutral-400">-</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ======================================================
          LEVEL 3 VIEW: PDF Submission Grading Review Side Panel
          ====================================================== */}
      {currentView === 'level3' && selectedAssignment && selectedSubmission && (
        <div className="space-y-6 animate-fade-in">
          {/* Header row with back trigger */}
          <div className="border-b border-neutral-200 pb-4">
            <button
              onClick={() => {
                setErrorMsg(null)
                setSuccessMsg(null)
                setCurrentView('level2')
              }}
              className="text-neutral-500 hover:text-neutral-800 text-xs flex items-center gap-1 group font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              Kembali ke Roster Tugas
            </button>
            <h2 className="text-xl font-bold text-neutral-900 mt-2">
              Evaluasi Berkas: {selectedSubmission.name} ({selectedSubmission.nim})
            </h2>
            <p className="text-xs text-neutral-500">
              Mata Kuliah: <span className="font-semibold text-neutral-700">{selectedAssignment.title}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left Col: PDF View Embed */}
            <div className="lg:col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1">
                  Berkas PDF Pengumpulan
                </span>
                {selectedSubmission.fileUrl && (
                  <a
                    href={selectedSubmission.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    Buka Tab Baru <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
              <div className="border border-neutral-200 bg-neutral-100 rounded-lg overflow-hidden">
                {selectedSubmission.fileUrl ? (
                  <iframe
                    src={selectedSubmission.fileUrl}
                    className="w-full h-[580px] bg-white"
                    title="PDF Submission Viewer"
                  />
                ) : (
                  <div className="p-16 text-center text-neutral-400">
                    Gagal membaca URL berkas.
                  </div>
                )}
              </div>
            </div>

            {/* Right Col: Grading Panel Form */}
            <div className="space-y-4">
              <Card className="bg-white border border-neutral-200 shadow-sm rounded-lg">
                <CardHeader className="border-b border-neutral-100 bg-neutral-50/50 p-5">
                  <CardTitle className="text-neutral-900 font-bold text-sm flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    Penilaian Evaluasi
                  </CardTitle>
                  <CardDescription className="text-neutral-500 text-xs">
                    Berikan nilai tugas dan catatan feedback koreksi di bawah ini.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4 text-sm">
                  {/* Score */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="score-input" className="font-semibold text-neutral-700 text-xs">
                      Nilai Tugas (0 - 100) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="score-input"
                      type="number"
                      min={0}
                      max={100}
                      value={inputScore}
                      onChange={(e) => setInputScore(e.target.value)}
                      placeholder="Contoh: 85"
                      className="h-9 w-full rounded border border-neutral-300 px-3 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-neutral-900 text-sm font-bold font-mono"
                    />
                  </div>

                  {/* Feedback */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="feedback-input" className="font-semibold text-neutral-700 text-xs">
                      Feedback / Catatan Evaluasi
                    </label>
                    <textarea
                      id="feedback-input"
                      rows={5}
                      value={inputFeedback}
                      onChange={(e) => setInputFeedback(e.target.value)}
                      placeholder="Masukkan catatan perbaikan berkas di sini..."
                      className="w-full rounded border border-neutral-300 p-2.5 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-neutral-900 text-xs"
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    onClick={handleSaveGrade}
                    disabled={actionLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded py-2 transition-colors flex items-center justify-center gap-1.5"
                  >
                    {actionLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      'Simpan Nilai & Selesai'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
