'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { submitAssignmentAction } from './actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  FileText,
  Upload,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
  Loader2,
  FileCheck2,
  MessageSquareText,
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
  courses: {
    name: string
    code: string
  } | null
}

interface Submission {
  id: string
  assignment_id: string
  student_id: string
  file_url: string
  score_tugas: number | null
  feedback: string | null
  submitted_at: string
}

interface StudentAssignmentListProps {
  enrolledCourses: Course[]
  studentId: string
}

export default function StudentAssignmentList({ enrolledCourses, studentId }: StudentAssignmentListProps) {
  // Sieve Course Filter
  const [filterCourseId, setFilterCourseId] = useState<string>('all')

  // Data states
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])

  // Loading/Feedback states
  const [loading, setLoading] = useState(false)
  const [uploadingMap, setUploadingMap] = useState<Record<string, boolean>>({})
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({})
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Fetch student assignments and submissions
  const fetchData = async () => {
    if (enrolledCourses.length === 0) return
    setLoading(true)
    setErrorMsg(null)
    try {
      const supabase = createClient()
      const enrolledCourseIds = enrolledCourses.map((c) => c.id)

      // 1. Fetch assignments of enrolled courses
      const { data: assignData, error: assignError } = await supabase
        .from('assignments')
        .select('*, courses(name, code)')
        .in('course_id', enrolledCourseIds)
        .order('deadline', { ascending: true })

      if (assignError) throw assignError
      setAssignments(assignData || [])

      // 2. Fetch submissions by this student
      const { data: subData, error: subError } = await supabase
        .from('submissions')
        .select('*')
        .eq('student_id', studentId)

      if (subError) throw subError
      setSubmissions(subData || [])
    } catch (err: any) {
      console.error('Error fetching assignments data:', err)
      setErrorMsg(err.message || 'Gagal memuat tugas kuliah.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [studentId])

  // Handle PDF file selection
  const handleFileSelect = (assignmentId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Hanya berkas berformat PDF (.pdf) yang dapat dikumpulkan.')
      return
    }

    // Limit to 10MB
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Ukuran file maksimal adalah 10MB.')
      return
    }

    setSelectedFiles((prev) => ({ ...prev, [assignmentId]: file }))
    setErrorMsg(null)
    setSuccessMsg(null)
  }

  // Upload to Supabase Storage and submit via Server Action
  const triggerUpload = async (assignmentId: string) => {
    const file = selectedFiles[assignmentId]
    if (!file) return

    setUploadingMap((prev) => ({ ...prev, [assignmentId]: true }))
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const supabase = createClient()
      
      // Explicitly extract the authenticated user's ID to strictly match folder path constraints
      const { data: authData, error: authErr } = await supabase.auth.getUser()
      if (authErr || !authData.user) {
        setErrorMsg('Sesi Anda telah kedaluwarsa. Silakan login kembali.')
        setUploadingMap((prev) => ({ ...prev, [assignmentId]: false }))
        return
      }
      const activeStudentId = authData.user.id

      const fileExt = 'pdf'
      const timestamp = Date.now()
      const filePath = `${activeStudentId}/${assignmentId}_${timestamp}.${fileExt}`

      // Upload file to storage bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('assignments_bucket')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) throw uploadError

      // Retrieve URL
      const { data: publicUrlData } = supabase.storage
        .from('assignments_bucket')
        .getPublicUrl(filePath)

      const fileUrl = publicUrlData.publicUrl

      // Submit via Server Action
      const result = await submitAssignmentAction(assignmentId, fileUrl)

      if (result?.error) {
        setErrorMsg(result.error)
      } else {
        setSuccessMsg('Tugas berhasil dikumpulkan!')
        // Clear selected file state
        setSelectedFiles((prev) => {
          const next = { ...prev }
          delete next[assignmentId]
          return next
        })
        await fetchData()
      }
    } catch (err: any) {
      console.error('File upload submission error:', err)
      setErrorMsg(err.message || 'Gagal mengunggah file tugas.')
    } finally {
      setUploadingMap((prev) => ({ ...prev, [assignmentId]: false }))
    }
  }

  // Filtered assignments
  const filteredAssignments = filterCourseId === 'all'
    ? assignments
    : assignments.filter((a) => a.course_id === filterCourseId)

  return (
    <div className="space-y-6">
      {/* Toast alert banner */}
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

      {/* Toolbar Filter */}
      <div className="bg-white p-4 rounded-lg border border-neutral-200 shadow-2xs flex items-center gap-4">
        <div className="flex-1 flex flex-col gap-1.5 max-w-sm">
          <label htmlFor="student-course-filter" className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
            Filter Mata Kuliah
          </label>
          <select
            id="student-course-filter"
            value={filterCourseId}
            onChange={(e) => setFilterCourseId(e.target.value)}
            className="h-9 w-full rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm shadow-xs transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-neutral-800 font-medium"
          >
            <option value="all">Semua Mata Kuliah</option>
            {enrolledCourses.map((c) => (
              <option key={c.id} value={c.id}>
                [{c.code}] {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Assignment List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-16 text-center flex flex-col items-center justify-center text-neutral-500 bg-white border border-neutral-200 rounded-lg">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
            <p className="text-xs">Memuat tugas kuliah...</p>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="p-16 text-center bg-white border border-neutral-200 rounded-lg flex flex-col items-center justify-center">
            <FileText className="w-12 h-12 text-neutral-300 mb-3" />
            <h3 className="text-sm font-semibold text-neutral-800">Tidak ada tugas kuliah</h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm">
              Saat ini belum ada tugas kuliah yang dirilis untuk mata kuliah terdaftar Anda.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAssignments.map((assign) => {
              const sub = submissions.find((s) => s.assignment_id === assign.id)
              const isUploading = uploadingMap[assign.id] || false
              const isGraded = sub && sub.score_tugas !== null
              const isSubmitted = sub && !isGraded
              const selectedFile = selectedFiles[assign.id]

              // Calculate deadline status
              const deadlineDate = new Date(assign.deadline)
              const isOverdue = new Date() > deadlineDate

              return (
                <Card
                  key={assign.id}
                  className="bg-white border border-neutral-200 shadow-sm rounded-lg overflow-hidden grid grid-cols-1 md:grid-cols-3"
                >
                  {/* Left block: Details (66.6% width on desktop) */}
                  <div className="md:col-span-2 p-5 md:p-6 space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                          [{assign.courses?.code}] {assign.courses?.name}
                        </span>

                        {/* Status Badges */}
                        {isGraded ? (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100">
                            <CheckCircle className="w-3 h-3 shrink-0" />
                            Selesai Dinilai
                          </span>
                        ) : isSubmitted ? (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">
                            <Clock className="w-3 h-3 shrink-0" />
                            Menunggu Penilaian
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded border border-neutral-200">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            Belum Mengumpulkan
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <h3 className="text-neutral-900 font-bold text-lg md:text-xl leading-tight">
                          {assign.title}
                        </h3>
                        <p className="text-neutral-600 text-sm leading-relaxed whitespace-pre-line font-normal">
                          {assign.description || 'Tidak ada deskripsi.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-2 border-t border-neutral-100">
                      {/* Deadline indicator */}
                      <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium bg-neutral-50 border border-neutral-200 px-2.5 py-1 rounded w-fit">
                        <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Tenggat: </span>
                        <span className={`font-semibold ${isOverdue && !sub ? 'text-rose-600 font-bold' : 'text-neutral-700'}`}>
                          {deadlineDate.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                      </div>

                      {/* Graded info block */}
                      {isGraded && (
                        <div className="p-3.5 bg-emerald-50/40 border border-emerald-100 rounded-lg space-y-2">
                          <div className="flex items-center gap-1.5">
                            <FileCheck2 className="w-4 h-4 text-emerald-600" />
                            <span className="text-xs font-bold text-emerald-800">
                              Nilai Tugas: <span className="text-sm font-mono font-black">{sub.score_tugas} / 100</span>
                            </span>
                          </div>
                          {sub.feedback && (
                            <div className="text-xs text-emerald-700 space-y-1">
                              <span className="font-bold flex items-center gap-1">
                                <MessageSquareText className="w-3 h-3 text-emerald-500" />
                                Feedback Dosen:
                              </span>
                              <p className="font-medium whitespace-pre-line italic pl-3.5 border-l-2 border-emerald-200 text-emerald-800">
                                "{sub.feedback}"
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right block: Action Submission Zone (33.3% width on desktop) */}
                  <div className="md:col-span-1 p-5 md:p-6 border-t md:border-t-0 md:border-l border-neutral-200 bg-neutral-50/30 flex flex-col justify-center gap-4">
                    {isGraded ? (
                      <div className="text-center space-y-2 py-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                        <p className="text-xs text-neutral-500 font-medium">Tugas Anda telah dievaluasi.</p>
                        {sub?.file_url && (
                          <a
                            href={sub.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:underline font-semibold"
                          >
                            Buka Berkas PDF <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                          Pengumpulan Tugas
                        </div>

                        {/* File Selected review panel */}
                        {selectedFile ? (
                          <div className="space-y-2.5">
                            <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded text-xs flex flex-col gap-1">
                              <span className="font-bold text-indigo-900 truncate flex items-center gap-1">
                                📎 {selectedFile.name}
                              </span>
                              <span className="text-[10px] text-neutral-400 font-mono">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                              </span>
                            </div>
                            <Button
                              onClick={() => triggerUpload(assign.id)}
                              disabled={isUploading}
                              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-1.5 rounded transition-colors flex items-center justify-center gap-1.5"
                            >
                              {isUploading ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                                  Kirim...
                                </>
                              ) : (
                                'Kirim Tugas'
                              )}
                            </Button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedFiles((prev) => {
                                  const next = { ...prev }
                                  delete next[assign.id]
                                  return next
                                })
                              }}
                              className="text-[10px] text-neutral-400 hover:text-neutral-600 text-center w-full underline font-medium block"
                            >
                              Pilih file lain
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {isSubmitted && sub?.file_url && (
                              <div className="p-2.5 bg-neutral-100 border border-neutral-200 rounded text-xs flex flex-col gap-1.5">
                                <span className="font-semibold text-neutral-600">
                                  Terkirim:
                                </span>
                                <a
                                  href={sub.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
                                >
                                  Buka PDF Pengumpulan <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            )}

                            {/* Slim Dashboard-Friendly Dashed Upload trigger box */}
                            <label className="border-2 border-dashed border-neutral-300 rounded-lg p-3 text-center cursor-pointer transition-all hover:bg-neutral-50 hover:border-indigo-400 flex flex-col items-center justify-center gap-1 text-neutral-500">
                              <Upload className="w-4 h-4 text-neutral-400" />
                              <span className="text-xs font-bold">
                                {isSubmitted ? 'Ganti File PDF' : 'Pilih Berkas PDF'}
                              </span>
                              <span className="text-[9px] text-neutral-400">Format PDF (maks 10MB)</span>
                              <input
                                type="file"
                                accept="application/pdf"
                                className="hidden"
                                onChange={(e) => handleFileSelect(assign.id, e)}
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
