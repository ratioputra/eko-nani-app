'use client'

import React, { useState } from 'react'
import { Calendar as CalendarIcon, GraduationCap, MapPin, Clock, User, BookMarked, Filter, Calendar } from 'lucide-react'

interface CourseJoined {
  name: string
  code: string
  lecturer_id: string
  profiles: {
    name: string
  } | null
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

interface StudentProfile {
  name: string | null
}

interface StudentScheduleClientProps {
  profile: StudentProfile
  enrolledCourseIds: string[]
  initialSchedules: ScheduleRow[]
}

// Timezone-safe local Indonesian date formatter helper
function formatIndoDate(dateStr: string | null) {
  if (!dateStr) return ''
  try {
    const [year, month, day] = dateStr.split('-')
    const date = new Date(Number(year), Number(month) - 1, Number(day))
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date)
  } catch (e) {
    return dateStr
  }
}

// Helper to construct local Date object combining class date and end time
function getClassEndTime(classDateStr: string | null, endTimeStr: string | null) {
  if (!classDateStr) return new Date(0)
  try {
    const [year, month, day] = classDateStr.split('-')
    const [hours, minutes, seconds] = (endTimeStr || '23:59:00').split(':')
    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hours),
      Number(minutes),
      Number(seconds || 0)
    )
  } catch (e) {
    return new Date(0)
  }
}

export default function StudentScheduleClient({
  profile,
  enrolledCourseIds,
  initialSchedules,
}: StudentScheduleClientProps) {
  const [selectedCourse, setSelectedCourse] = useState<string>('all')

  // Establish the current exact baseline time (July 4, 2026, 23:53:36 WIB)
  const currentTime = new Date(2026, 6, 4, 23, 53, 36)

  // 1. Get unique course names for dropdown
  const uniqueCourseNames = Array.from(
    new Set(
      initialSchedules
        .map((s) => s.courses?.name)
        .filter((name): name is string => typeof name === 'string' && name.trim() !== '')
    )
  ).sort()

  // 2. Filter schedules based on course selection
  const filteredSchedules = selectedCourse === 'all'
    ? initialSchedules
    : initialSchedules.filter((s) => s.courses?.name === selectedCourse)

  // 3. Group and sort schedules dynamically (closest upcoming first, past sessions last)
  const row1Days = ['Senin', 'Selasa', 'Rabu', 'Kamis']
  const row2Days = ['Jumat', 'Sabtu', 'Minggu']
  const allDays = [...row1Days, ...row2Days]

  const groupedSchedules: { [key: string]: ScheduleRow[] } = {
    Senin: [],
    Selasa: [],
    Rabu: [],
    Kamis: [],
    Jumat: [],
    Sabtu: [],
    Minggu: [],
  }

  filteredSchedules.forEach((sched) => {
    const day = sched.day
    if (groupedSchedules[day]) {
      groupedSchedules[day].push(sched)
    }
  })

  // Sort logic: Upcoming/Today classes sorted ascending (closest first), followed by Past classes sorted descending (most recent past first)
  allDays.forEach((day) => {
    groupedSchedules[day].sort((a, b) => {
      const endTimeA = getClassEndTime(a.class_date, a.end_time)
      const endTimeB = getClassEndTime(b.class_date, b.end_time)

      const isPastA = endTimeA.getTime() < currentTime.getTime()
      const isPastB = endTimeB.getTime() < currentTime.getTime()

      // Upcoming first, past second
      if (!isPastA && isPastB) return -1
      if (isPastA && !isPastB) return 1

      // Both are upcoming: sort ascending (closest date first)
      if (!isPastA && !isPastB) {
        const diff = endTimeA.getTime() - endTimeB.getTime()
        if (diff !== 0) return diff
        return (a.start_time || '').localeCompare(b.start_time || '')
      }

      // Both are past: sort descending (most recent past first)
      const diff = endTimeB.getTime() - endTimeA.getTime()
      if (diff !== 0) return diff
      return (a.start_time || '').localeCompare(b.start_time || '')
    })
  })

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#171717] flex flex-col font-sans antialiased">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white px-6 py-4 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 border border-indigo-100">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight block">Portal Mahasiswa</span>
            <span className="text-xs text-neutral-500 font-medium">Jadwal Kuliah Mingguan</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-neutral-500 font-mono bg-neutral-100 px-2 py-1 rounded border border-neutral-200">
            {profile.name}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8 space-y-6">
        {/* Page Title & Filter Control */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-200 pb-5">
          <div className="space-y-1.5">
            <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest font-sans">Schedules</div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 flex items-center gap-2">
              <CalendarIcon className="w-8 h-8 text-indigo-600 shrink-0" />
              Jadwal Kuliah Saya
            </h1>
            <p className="text-neutral-500 text-sm max-w-xl">
              Kalender matriks jadwal kuliah mingguan. Sesi yang sudah selesai ditandai redup, sesi terdekat diurutkan di bagian teratas.
            </p>
          </div>

          {/* Minimalist Filter Select Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 text-neutral-500 text-xs font-semibold uppercase tracking-wider bg-white border border-neutral-200 px-3 py-2 rounded-md shadow-3xs">
              <Filter className="w-3.5 h-3.5 text-neutral-400" />
              <span>Saring Matkul:</span>
            </div>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="text-xs font-medium text-neutral-800 bg-white border border-neutral-200 rounded-md py-2 px-3 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 shadow-3xs cursor-pointer min-w-[200px]"
            >
              <option value="all">Semua Mata Kuliah</option>
              {uniqueCourseNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {enrolledCourseIds.length === 0 ? (
          /* Empty KRS state */
          <div className="bg-white border border-neutral-200 rounded-lg p-16 text-center flex flex-col items-center justify-center shadow-xs">
            <div className="w-12 h-12 rounded-full bg-neutral-50 border border-neutral-200 flex items-center justify-center text-neutral-400 mb-3">
              <BookMarked className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-800">KRS Belum Diisi</h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm">
              Anda belum memilih mata kuliah untuk semester ini. Silakan kunjungi menu <strong>Pilih Matkul (KRS)</strong> terlebih dahulu.
            </p>
          </div>
        ) : (
          /* Dual-Row Weekly Grid Matrix */
          <div className="space-y-8">
            {/* ROW 1: Monday - Thursday (4 Columns) */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Hari Kerja (Senin - Kamis)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
                {row1Days.map((day) => {
                  const dayClasses = groupedSchedules[day]
                  return (
                    <div
                      key={day}
                      className="flex flex-col space-y-4 bg-white border border-neutral-200 p-4 rounded-xl shadow-3xs min-h-[280px]"
                    >
                      {/* Day Header */}
                      <div className="pb-3 border-b border-neutral-100 flex items-center justify-between">
                        <span className="font-bold text-neutral-900 text-sm tracking-wide">{day}</span>
                        <span className="text-[10px] bg-neutral-100 text-neutral-500 font-bold px-2 py-0.5 rounded-full">
                          {dayClasses.length} Sesi
                        </span>
                      </div>

                      {/* Day Classes List */}
                      <div className="flex-1 flex flex-col space-y-3">
                        {dayClasses.length === 0 ? (
                          <div className="flex-1 flex items-center justify-center p-6 text-center border border-dashed border-neutral-200 rounded-lg bg-neutral-50/30">
                            <span className="text-[11px] text-neutral-450 italic leading-relaxed">
                              Tidak ada jadwal
                            </span>
                          </div>
                        ) : (
                          dayClasses.map((sched) => {
                            const courseName = sched.courses?.name || 'Mata Kuliah'
                            const courseCode = sched.courses?.code || '-'
                            const lecturerName = sched.courses?.profiles?.name || 'Dosen Pengampu'

                            // Precise Date-Time Combiner Logic
                            const classEndTime = getClassEndTime(sched.class_date, sched.end_time)
                            const isPast = classEndTime.getTime() < currentTime.getTime()

                            return (
                              <div
                                key={sched.id}
                                className={`border p-3 rounded-lg transition-all flex flex-col space-y-2.5 group relative overflow-hidden ${isPast
                                    ? 'opacity-40 bg-neutral-50/70 border-neutral-200 line-through filter grayscale text-neutral-400'
                                    : 'bg-white border-neutral-150 hover:border-indigo-200 hover:shadow-2xs'
                                  }`}
                              >
                                {/* Active Indicator or Date */}
                                <div className="flex items-center justify-between gap-2">
                                  {/* Class Date */}
                                  {sched.class_date && (
                                    <div className="text-[11px] font-medium flex items-center gap-1">
                                      <Calendar className="w-3 h-3 text-neutral-400 shrink-0" />
                                      <span>{formatIndoDate(sched.class_date)}</span>
                                    </div>
                                  )}

                                  {/* Remove top-right badge if in the past */}
                                  {!isPast && (
                                    <span className="flex h-1.5 w-1.5 relative shrink-0">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                    </span>
                                  )}
                                </div>

                                {/* Class Time */}
                                <div className={`flex items-center gap-1.5 text-[10px] font-semibold font-mono ${isPast ? 'text-neutral-400' : 'text-indigo-600'}`}>
                                  <Clock className="w-3 h-3 text-indigo-500 shrink-0" />
                                  <span>
                                    {sched.start_time.slice(0, 5)} - {sched.end_time.slice(0, 5)}
                                  </span>
                                </div>

                                {/* Course info */}
                                <div className="space-y-0.5">
                                  <span className="text-[9px] font-mono text-neutral-400 block tracking-wider uppercase font-semibold">
                                    {courseCode}
                                  </span>
                                  <h4 className={`text-xs font-bold transition-colors line-clamp-2 leading-tight ${isPast ? 'text-neutral-400' : 'text-neutral-900 group-hover:text-indigo-600'}`}>
                                    {courseName}
                                  </h4>
                                </div>

                                {/* Method/Room Conditional Swapping */}
                                <div className="text-[10px] flex items-center gap-1">
                                  {isPast ? (
                                    <span className="text-red-600 font-semibold text-xs flex items-center gap-1">
                                      Kelas Sudah Selesai
                                    </span>
                                  ) : sched.is_online ? (
                                    sched.meeting_link ? (
                                      <a
                                        href={sched.meeting_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1 font-semibold text-[10px]"
                                      >
                                        Kelas Online (Zoom)
                                      </a>
                                    ) : (
                                      <span className="font-medium italic text-neutral-500">Kelas Online (Zoom)</span>
                                    )
                                  ) : (
                                    <div className="flex items-center gap-1 font-medium text-neutral-500">
                                      <MapPin className="w-3 h-3 text-neutral-450 shrink-0" />
                                      <span>{sched.room_number || '-'}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Lecturer name */}
                                <div className="pt-2 border-t border-neutral-100 flex items-center gap-1.5 text-[9px]">
                                  <User className="w-2.5 h-2.5 text-neutral-400 shrink-0" />
                                  <span className="font-medium line-clamp-1">{lecturerName}</span>
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ROW 2: Friday - Sunday (3 Columns) */}
            <div className="space-y-3 mt-6">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Akhir Pekan (Jumat - Minggu)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                {row2Days.map((day) => {
                  const dayClasses = groupedSchedules[day]
                  return (
                    <div
                      key={day}
                      className="flex flex-col space-y-4 bg-white border border-neutral-200 p-4 rounded-xl shadow-3xs min-h-[280px]"
                    >
                      {/* Day Header */}
                      <div className="pb-3 border-b border-neutral-100 flex items-center justify-between">
                        <span className="font-bold text-neutral-900 text-sm tracking-wide">{day}</span>
                        <span className="text-[10px] bg-neutral-100 text-neutral-500 font-bold px-2 py-0.5 rounded-full">
                          {dayClasses.length} Sesi
                        </span>
                      </div>

                      {/* Day Classes List */}
                      <div className="flex-1 flex flex-col space-y-3">
                        {dayClasses.length === 0 ? (
                          <div className="flex-1 flex items-center justify-center p-6 text-center border border-dashed border-neutral-200 rounded-lg bg-neutral-50/30">
                            <span className="text-[11px] text-neutral-400 italic leading-relaxed">
                              Tidak ada jadwal
                            </span>
                          </div>
                        ) : (
                          dayClasses.map((sched) => {
                            const courseName = sched.courses?.name || 'Mata Kuliah'
                            const courseCode = sched.courses?.code || '-'
                            const lecturerName = sched.courses?.profiles?.name || 'Dosen Pengampu'

                            // Precise Date-Time Combiner Logic
                            const classEndTime = getClassEndTime(sched.class_date, sched.end_time)
                            const isPast = classEndTime.getTime() < currentTime.getTime()

                            return (
                              <div
                                key={sched.id}
                                className={`border p-3 rounded-lg transition-all flex flex-col space-y-2.5 group relative overflow-hidden ${isPast
                                    ? 'opacity-40 bg-neutral-50/70 border-neutral-200 line-through filter grayscale text-neutral-400'
                                    : 'bg-white border-neutral-150 hover:border-indigo-200 hover:shadow-2xs'
                                  }`}
                              >
                                {/* Active Indicator or Date */}
                                <div className="flex items-center justify-between gap-2">
                                  {/* Class Date */}
                                  {sched.class_date && (
                                    <div className="text-[11px] font-medium flex items-center gap-1">
                                      <Calendar className="w-3 h-3 text-neutral-400 shrink-0" />
                                      <span>{formatIndoDate(sched.class_date)}</span>
                                    </div>
                                  )}

                                  {/* Remove top-right badge if in the past */}
                                  {!isPast && (
                                    <span className="flex h-1.5 w-1.5 relative shrink-0">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                    </span>
                                  )}
                                </div>

                                {/* Class Time */}
                                <div className={`flex items-center gap-1.5 text-[10px] font-semibold font-mono ${isPast ? 'text-neutral-400' : 'text-indigo-600'}`}>
                                  <Clock className="w-3 h-3 text-indigo-550 shrink-0" />
                                  <span>
                                    {sched.start_time.slice(0, 5)} - {sched.end_time.slice(0, 5)}
                                  </span>
                                </div>

                                {/* Course info */}
                                <div className="space-y-0.5">
                                  <span className="text-[9px] font-mono text-neutral-400 block tracking-wider uppercase font-semibold">
                                    {courseCode}
                                  </span>
                                  <h4 className={`text-xs font-bold transition-colors line-clamp-2 leading-tight ${isPast ? 'text-neutral-400' : 'text-neutral-900 group-hover:text-indigo-600'}`}>
                                    {courseName}
                                  </h4>
                                </div>

                                {/* Method/Room Conditional Swapping */}
                                <div className="text-[10px] flex items-center gap-1">
                                  {isPast ? (
                                    <span className="text-red-600 font-semibold text-xs flex items-center gap-1">
                                      Kelas Sudah Selesai
                                    </span>
                                  ) : sched.is_online ? (
                                    sched.meeting_link ? (
                                      <a
                                        href={sched.meeting_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1 font-semibold text-[10px]"
                                      >
                                        Kelas Online (Zoom)
                                      </a>
                                    ) : (
                                      <span className="font-medium italic text-neutral-500">Kelas Online (Zoom)</span>
                                    )
                                  ) : (
                                    <div className="flex items-center gap-1 font-medium text-neutral-500">
                                      <MapPin className="w-3 h-3 text-neutral-450 shrink-0" />
                                      <span>{sched.room_number || '-'}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Lecturer name */}
                                <div className="pt-2 border-t border-neutral-100 flex items-center gap-1.5 text-[9px]">
                                  <User className="w-2.5 h-2.5 text-neutral-400 shrink-0" />
                                  <span className="font-medium line-clamp-1">{lecturerName}</span>
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
