'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, Video, MapPin, ExternalLink, Clock, Pencil, Trash2, X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface CourseJoined {
  name: string
  code: string
}

interface ScheduleRow {
  id: string
  course_id: string
  day: string
  class_date: string | null
  start_time: string
  end_time: string
  is_online: boolean
  room_number: string | null
  meeting_link: string | null
  courses: CourseJoined | null
}

interface Course {
  id: string
  name: string
  code: string
}

interface ScheduleListTableProps {
  initialSchedules: ScheduleRow[]
  courses: Course[]
}

function formatTime(timeStr: string | null): string {
  if (!timeStr) return ''
  const parts = timeStr.split(':')
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`
  }
  return timeStr
}

function formatClassDate(dateStr: string | null, dayName: string): string {
  if (!dateStr) return dayName
  try {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Jakarta'
    }).format(date)
  } catch {
    return `${dayName}, ${dateStr}`
  }
}

export default function ScheduleListTable({ initialSchedules, courses }: ScheduleListTableProps) {
  const router = useRouter()
  const [schedules, setSchedules] = useState<ScheduleRow[]>(initialSchedules)

  // Edit modal state
  const [editingSchedule, setEditingSchedule] = useState<ScheduleRow | null>(null)
  const [editCourseId, setEditCourseId] = useState('')
  const [editClassDate, setEditClassDate] = useState('')
  const [editStartTime, setEditStartTime] = useState('')
  const [editEndTime, setEditEndTime] = useState('')
  const [editIsOnline, setEditIsOnline] = useState(false)
  const [editRoomNumber, setEditRoomNumber] = useState('')
  const [editMeetingLink, setEditMeetingLink] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // Delete dialog state
  const [deletingSchedule, setDeletingSchedule] = useState<ScheduleRow | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToastMsg = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => {
      setToast(null)
    }, 4000)
  }

  // Keep state synced with server data
  useEffect(() => {
    setSchedules(initialSchedules)
  }, [initialSchedules])

  // Sort local state chronologically by class_date and start time
  const sortedSchedules = [...schedules].sort((a, b) => {
    const dateA = a.class_date || ''
    const dateB = b.class_date || ''
    const dateDiff = dateA.localeCompare(dateB)
    if (dateDiff !== 0) return dateDiff
    return (a.start_time || '').localeCompare(b.start_time || '')
  })

  // Open edit modal
  const handleEditClick = (schedule: ScheduleRow) => {
    setEditingSchedule(schedule)
    setEditCourseId(schedule.course_id)
    setEditClassDate(schedule.class_date || '')
    setEditStartTime(formatTime(schedule.start_time))
    setEditEndTime(formatTime(schedule.end_time))
    setEditIsOnline(schedule.is_online)
    setEditRoomNumber(schedule.room_number || '')
    setEditMeetingLink(schedule.meeting_link || '')
    setEditError(null)
  }

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSchedule) return

    setEditError(null)
    setEditLoading(true)

    // Form validations
    if (!editCourseId) {
      setEditError('Pilih mata kuliah terlebih dahulu.')
      setEditLoading(false)
      return
    }

    if (!editClassDate || editClassDate.trim() === '') {
      setEditError('Tanggal perkuliahan wajib diisi.')
      setEditLoading(false)
      return
    }

    const parsedDate = new Date(editClassDate)
    if (isNaN(parsedDate.getTime())) {
      setEditError('Format tanggal perkuliahan tidak valid.')
      setEditLoading(false)
      return
    }

    // Derive day name in Indonesian (Senin, Selasa, etc.)
    const dayName = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(parsedDate)

    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(editStartTime) || !timeRegex.test(editEndTime)) {
      setEditError('Format waktu tidak valid. Gunakan format HH:MM.')
      setEditLoading(false)
      return
    }

    const [startH, startM] = editStartTime.split(':').map(Number)
    const [endH, endM] = editEndTime.split(':').map(Number)
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM

    if (endMinutes <= startMinutes) {
      setEditError('Jam selesai harus setelah jam mulai.')
      setEditLoading(false)
      return
    }

    if (editIsOnline) {
      if (!editMeetingLink || editMeetingLink.trim() === '') {
        setEditError('Link meeting wajib diisi untuk kelas online.')
        setEditLoading(false)
        return
      }
      if (!editMeetingLink.startsWith('http://') && !editMeetingLink.startsWith('https://')) {
        setEditError('Link meeting harus diawali dengan http:// atau https://')
        setEditLoading(false)
        return
      }
    } else {
      if (!editRoomNumber || editRoomNumber.trim() === '') {
        setEditError('Nomor ruangan wajib diisi untuk kelas offline.')
        setEditLoading(false)
        return
      }
    }

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('schedules')
        .update({
          course_id: editCourseId,
          class_date: editClassDate,
          day: dayName,
          start_time: editStartTime,
          end_time: editEndTime,
          is_online: editIsOnline,
          room_number: editIsOnline ? null : editRoomNumber.trim(),
          meeting_link: editIsOnline ? editMeetingLink.trim() : null
        })
        .eq('id', editingSchedule.id)

      if (error) {
        setEditError(error.message)
      } else {
        showToastMsg('Jadwal perkuliahan berhasil diperbarui!')
        setEditingSchedule(null)
        router.refresh()
      }
    } catch (err: any) {
      setEditError(err.message || 'Gagal memperbarui jadwal perkuliahan.')
    } finally {
      setEditLoading(false)
    }
  }

  // Handle Delete Submit
  const handleDeleteSubmit = async () => {
    if (!deletingSchedule) return

    setDeleteError(null)
    setDeleteLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', deletingSchedule.id)

      if (error) {
        setDeleteError(error.message)
      } else {
        showToastMsg('Jadwal perkuliahan berhasil dihapus!')
        setDeletingSchedule(null)
        router.refresh()
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Gagal menghapus jadwal perkuliahan.')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="bg-white border border-neutral-200 shadow-sm rounded-lg overflow-hidden relative">
      {/* Toast Alert Feedback */}
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

      {/* Header */}
      <div className="border-b border-neutral-100 bg-neutral-50/50 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-neutral-900 font-semibold text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Jadwal Mengajar Anda
          </h2>
          <p className="text-neutral-500 text-xs mt-0.5">
            Tinjau, ubah, atau hapus seluruh jadwal kuliah aktif Anda semester ini.
          </p>
        </div>
        <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-100 font-mono">
          {sortedSchedules.length} Jadwal
        </span>
      </div>

      {/* List content */}
      {sortedSchedules.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-neutral-50 border border-neutral-200 flex items-center justify-center text-neutral-455 mb-3">
            <Calendar className="w-6 h-6 text-neutral-400" />
          </div>
          <h3 className="text-sm font-semibold text-neutral-800">Belum ada jadwal mengajar</h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm">
            Anda belum menambahkan jadwal mengajar untuk mata kuliah Anda. Silakan isi form di atas untuk membuat jadwal baru.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/50 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                <th className="px-6 py-3">Mata Kuliah</th>
                <th className="px-6 py-3">Waktu</th>
                <th className="px-6 py-3">Metode</th>
                <th className="px-6 py-3">Ruangan / Link</th>
                <th className="px-6 py-3 w-[110px] text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-sm">
              {sortedSchedules.map((schedule) => {
                const courseName = schedule.courses?.name || 'Mata Kuliah'
                const courseCode = schedule.courses?.code || '-'
                return (
                  <tr key={schedule.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-neutral-900">{courseName}</span>
                        <span className="text-xs text-neutral-500 font-mono font-medium mt-0.5">{courseCode}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-neutral-800">
                        <Clock className="w-4 h-4 text-neutral-400" />
                        <span className="font-medium">{formatClassDate(schedule.class_date, schedule.day)}</span>
                        <span className="text-neutral-400">•</span>
                        <span className="text-neutral-600">
                          {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {schedule.is_online ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                          <Video className="w-3 h-3" />
                          Online
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-neutral-100 text-neutral-700 border border-neutral-200">
                          <MapPin className="w-3 h-3" />
                          Offline
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {schedule.is_online ? (
                        schedule.meeting_link ? (
                          <a
                            href={schedule.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 hover:underline font-medium"
                          >
                            Gabung Kelas
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-neutral-400 text-xs italic">Link tidak tersedia</span>
                        )
                      ) : (
                        <span className="font-semibold text-neutral-800 flex items-center gap-1">
                          {schedule.room_number || '-'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleEditClick(schedule)}
                          title="Edit Jadwal"
                          className="p-1.5 text-neutral-500 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 rounded-md transition-all cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingSchedule(schedule)}
                          title="Hapus Jadwal"
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
          EDIT SCHEDULE MODAL
          ======================================================== */}
      {editingSchedule && (
        <div className="fixed inset-0 bg-neutral-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 shadow-xl rounded-lg max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-neutral-900 font-semibold text-base flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-indigo-600" />
                  Edit Jadwal Perkuliahan
                </h3>
                <p className="text-neutral-500 text-xs mt-0.5">
                  Ubah data waktu, tanggal, kelas daring/luring, dan ruangan perkuliahan.
                </p>
              </div>
              <button
                onClick={() => setEditingSchedule(null)}
                className="p-1.5 text-neutral-450 hover:text-neutral-800 rounded-md hover:bg-neutral-100 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEditSubmit}>
              <div className="p-6 space-y-4">
                {editError && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-md text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    {editError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {/* Mata Kuliah Dropdown */}
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <Label className="text-neutral-700 font-semibold text-[10px] uppercase tracking-wider">
                      Mata Kuliah
                    </Label>
                    <select
                      value={editCourseId}
                      onChange={(e) => setEditCourseId(e.target.value)}
                      required
                      className="h-9 w-full rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm shadow-xs transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-neutral-805 font-medium"
                    >
                      <option value="" disabled>-- Pilih Mata Kuliah --</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          [{c.code}] {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tanggal Perkuliahan */}
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <Label className="text-neutral-700 font-semibold text-[10px] uppercase tracking-wider">
                      Tanggal Perkuliahan
                    </Label>
                    <Input
                      type="date"
                      value={editClassDate}
                      onChange={(e) => setEditClassDate(e.target.value)}
                      required
                      className="h-9 border-neutral-300 text-neutral-900 bg-white"
                    />
                  </div>

                  {/* Jam Mulai */}
                  <div className="col-span-1 flex flex-col gap-1.5">
                    <Label className="text-neutral-700 font-semibold text-[10px] uppercase tracking-wider">
                      Jam Mulai
                    </Label>
                    <Input
                      type="time"
                      value={editStartTime}
                      onChange={(e) => setEditStartTime(e.target.value)}
                      required
                      className="h-9 border-neutral-300 text-neutral-900 bg-white"
                    />
                  </div>

                  {/* Jam Selesai */}
                  <div className="col-span-1 flex flex-col gap-1.5">
                    <Label className="text-neutral-700 font-semibold text-[10px] uppercase tracking-wider">
                      Jam Selesai
                    </Label>
                    <Input
                      type="time"
                      value={editEndTime}
                      onChange={(e) => setEditEndTime(e.target.value)}
                      required
                      className="h-9 border-neutral-300 text-neutral-900 bg-white"
                    />
                  </div>
                </div>

                {/* Online Toggle */}
                <div className="flex items-center justify-between border-t border-neutral-100 pt-4 pb-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-neutral-800">Kelas Online</span>
                    <span className="text-neutral-500 text-xs">Aktifkan jika kelas diselenggarakan secara daring (Zoom/Meet).</span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={editIsOnline}
                    onClick={() => setEditIsOnline(!editIsOnline)}
                    className={`${
                      editIsOnline ? 'bg-indigo-600' : 'bg-neutral-200'
                    } relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-650`}
                  >
                    <span
                      className={`${
                        editIsOnline ? 'translate-x-5' : 'translate-x-0'
                      } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out`}
                    />
                  </button>
                </div>

                {/* Room / Link Conditional Form */}
                <div className="border-t border-neutral-100 pt-4">
                  {editIsOnline ? (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <Video className="w-4 h-4 text-indigo-600" />
                        <Label className="text-neutral-700 font-semibold text-[10px] uppercase tracking-wider">
                          Link Meeting (Zoom/Google Meet)
                        </Label>
                      </div>
                      <Input
                        type="url"
                        placeholder="https://..."
                        value={editMeetingLink}
                        onChange={(e) => setEditMeetingLink(e.target.value)}
                        required={editIsOnline}
                        className="h-9 border-neutral-300 text-neutral-900 bg-white"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-neutral-600" />
                        <Label className="text-neutral-700 font-semibold text-[10px] uppercase tracking-wider">
                          Nomor Ruangan
                        </Label>
                      </div>
                      <Input
                        type="text"
                        placeholder="Contoh: R.401"
                        value={editRoomNumber}
                        onChange={(e) => setEditRoomNumber(e.target.value)}
                        required={!editIsOnline}
                        className="h-9 border-neutral-300 text-neutral-900 bg-white"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50/50 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingSchedule(null)}
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
          DELETE SCHEDULE DIALOG
          ======================================================== */}
      {deletingSchedule && (
        <div className="fixed inset-0 bg-neutral-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 shadow-xl rounded-lg max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-5 border-b border-neutral-100 flex items-start gap-3 bg-red-50/30">
              <div className="p-2 bg-red-100 text-red-650 rounded-lg shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-neutral-900 font-bold text-base">
                  Hapus Jadwal Kuliah?
                </h3>
                <p className="text-neutral-550 text-xs leading-normal">
                  Konfirmasi penghapusan permanen untuk jadwal kuliah ini.
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
              
              <div className="text-neutral-600 text-sm leading-relaxed">
                <p>
                  Apakah Anda yakin ingin menghapus jadwal kuliah untuk mata kuliah <strong className="text-neutral-900 font-bold">{deletingSchedule.courses?.name || 'Mata Kuliah'}</strong> pada hari <strong className="text-neutral-900 font-bold">{formatClassDate(deletingSchedule.class_date, deletingSchedule.day)} ({formatTime(deletingSchedule.start_time)} - {formatTime(deletingSchedule.end_time)})</strong>?
                </p>
                <p className="text-xs bg-red-50 border border-red-100 p-2.5 rounded text-red-700 font-medium mt-3">
                  ⚠️ Tindakan ini tidak dapat dibatalkan dan jadwal tersebut akan dihapus permanen dari portal.
                </p>
              </div>
            </div>

            {/* Footer actions */}
            <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50/50 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeletingSchedule(null)}
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
                    Menhapus...
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
