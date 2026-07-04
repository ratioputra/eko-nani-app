'use client'

import React, { useState } from 'react'
import { createScheduleAction } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Video, MapPin, Loader2, Plus } from 'lucide-react'

interface Course {
  id: string
  name: string
  code: string
}

interface ScheduleFormProps {
  courses: Course[]
}

export default function ScheduleForm({ courses }: ScheduleFormProps) {
  const [courseId, setCourseId] = useState('')
  const [classDate, setClassDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [isOnline, setIsOnline] = useState(false)
  const [roomNumber, setRoomNumber] = useState('')
  const [meetingLink, setMeetingLink] = useState('')

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)
    setLoading(true)

    try {
      const result = await createScheduleAction({
        courseId,
        classDate,
        startTime,
        endTime,
        isOnline,
        roomNumber: isOnline ? undefined : roomNumber,
        meetingLink: isOnline ? meetingLink : undefined,
      })

      if (result?.error) {
        setErrorMsg(result.error)
      } else {
        setSuccessMsg('Jadwal berhasil ditambahkan!')
        // Reset form except course selection for convenience
        setClassDate('')
        setStartTime('')
        setEndTime('')
        setRoomNumber('')
        setMeetingLink('')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan jadwal.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-white border border-neutral-200 shadow-sm rounded-lg overflow-hidden">
      <CardHeader className="border-b border-neutral-100 bg-neutral-50/50 px-6 py-4">
        <CardTitle className="text-neutral-900 font-semibold text-lg flex items-center gap-2">
          <Plus className="w-5 h-5 text-indigo-600" />
          Tambah Jadwal Baru
        </CardTitle>
        <CardDescription className="text-neutral-500 text-sm">
          Buat jadwal perkuliahan mingguan baru untuk mata kuliah yang Anda ampu.
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mata Kuliah */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="course" className="text-neutral-700 font-medium text-xs uppercase tracking-wider">
                Mata Kuliah
              </Label>
              <select
                id="course"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                required
                className="h-9 w-full rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm shadow-xs transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="" disabled>-- Pilih Mata Kuliah --</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    [{course.code}] {course.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tanggal Perkuliahan */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="classDate" className="text-neutral-700 font-medium text-xs uppercase tracking-wider">
                Tanggal Perkuliahan
              </Label>
              <Input
                id="classDate"
                type="date"
                value={classDate}
                onChange={(e) => setClassDate(e.target.value)}
                required
                className="border-neutral-300 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/30 text-neutral-900 bg-white h-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Jam Mulai */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="startTime" className="text-neutral-700 font-medium text-xs uppercase tracking-wider">
                Jam Mulai
              </Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="border-neutral-300 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/30 text-neutral-900 bg-white"
              />
            </div>

            {/* Jam Selesai */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="endTime" className="text-neutral-700 font-medium text-xs uppercase tracking-wider">
                Jam Selesai
              </Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="border-neutral-300 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/30 text-neutral-900 bg-white"
              />
            </div>
          </div>

          {/* Toggle Online/Offline */}
          <div className="flex items-center justify-between border-t border-neutral-100 pt-4 pb-2">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-neutral-800">Kelas Online</span>
              <span className="text-neutral-500 text-xs">Aktifkan jika kelas diselenggarakan secara daring (Zoom/Meet).</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isOnline}
              onClick={() => setIsOnline(!isOnline)}
              className={`${
                isOnline ? 'bg-indigo-600' : 'bg-neutral-200'
              } relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2`}
            >
              <span
                aria-hidden="true"
                className={`${
                  isOnline ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out`}
              />
            </button>
          </div>

          {/* Conditional Input based on isOnline */}
          <div className="border-t border-neutral-100 pt-4">
            {isOnline ? (
              <div className="flex flex-col gap-1.5 animate-fadeIn">
                <div className="flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-indigo-600" />
                  <Label htmlFor="meetingLink" className="text-neutral-700 font-medium text-xs uppercase tracking-wider">
                    Link Meeting (Zoom/Google Meet)
                  </Label>
                </div>
                <Input
                  id="meetingLink"
                  type="url"
                  placeholder="https://us06web.zoom.us/j/... atau https://meet.google.com/..."
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  required={isOnline}
                  className="border-neutral-300 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/30 text-neutral-900 bg-white"
                />
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 animate-fadeIn">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-neutral-600" />
                  <Label htmlFor="roomNumber" className="text-neutral-700 font-medium text-xs uppercase tracking-wider">
                    Nomor Ruangan
                  </Label>
                </div>
                <Input
                  id="roomNumber"
                  type="text"
                  placeholder="Contoh: R.401, Lab Komputer A"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  required={!isOnline}
                  className="border-neutral-300 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/30 text-neutral-900 bg-white"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end pt-3">
            <Button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs transition-colors rounded-md px-5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Jadwal'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
