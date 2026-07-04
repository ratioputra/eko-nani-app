'use client'

import React, { useState } from 'react'
import { createAnnouncementAction } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Megaphone, Loader2, Send } from 'lucide-react'

interface Course {
  id: string
  name: string
  code: string
}

interface AnnouncementFormProps {
  courses: Course[]
}

export default function AnnouncementForm({ courses }: AnnouncementFormProps) {
  const [courseId, setCourseId] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)
    setLoading(true)

    try {
      const result = await createAnnouncementAction(courseId, title, content)

      if (result?.error) {
        setErrorMsg(result.error)
      } else {
        setSuccessMsg('Pengumuman kelas berhasil dipublikasikan!')
        setTitle('')
        setContent('')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengirim pengumuman.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-white border border-neutral-200 shadow-sm rounded-lg overflow-hidden">
      <CardHeader className="border-b border-neutral-100 bg-neutral-50/50 px-6 py-4">
        <CardTitle className="text-neutral-900 font-semibold text-lg flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-indigo-600" />
          Kirim Pengumuman Baru
        </CardTitle>
        <CardDescription className="text-neutral-500 text-sm">
          Publikasikan pesan atau pengumuman penting untuk mahasiswa di kelas Anda.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
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

          {/* Target Course Select */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="course" className="text-neutral-700 font-medium text-xs uppercase tracking-wider">
              Mata Kuliah Target
            </Label>
            <select
              id="course"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              required
              className="h-9 w-full rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm shadow-xs transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-neutral-800 font-medium"
            >
              <option value="" disabled>-- Pilih Mata Kuliah Target --</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  [{course.code}] {course.name}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title" className="text-neutral-700 font-medium text-xs uppercase tracking-wider">
              Judul Pengumuman
            </Label>
            <Input
              id="title"
              type="text"
              placeholder="Contoh: Perubahan Jadwal Kuliah, Pengumpulan Tugas Akhir"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="border-neutral-300 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/30 text-neutral-900 bg-white"
            />
          </div>

          {/* Content Textarea */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="content" className="text-neutral-700 font-medium text-xs uppercase tracking-wider">
              Konten / Isi Pengumuman
            </Label>
            <textarea
              id="content"
              rows={4}
              placeholder="Ketik isi pengumuman kelas di sini secara detail..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-xs transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-neutral-900 placeholder:text-neutral-400 font-medium font-sans"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs transition-colors rounded-md px-5 flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Kirim Pengumuman
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
