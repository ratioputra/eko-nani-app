'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Video,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'

interface ScheduleData {
  id: string
  course_id: string
  day: string
  class_date: string | null
  start_time: string | null
  end_time: string | null
  is_online: boolean
  room_number: string | null
  meeting_link: string | null
  courses: {
    name: string
    code: string
  } | null
}

interface DashboardMiddleSectionProps {
  schedules: ScheduleData[]
  todayDayName: string
  todayFormatted: string
}

const dayOrder: Record<string, number> = {
  'Senin': 1,
  'Selasa': 2,
  'Rabu': 3,
  'Kamis': 4,
  'Jumat': 5,
  'Sabtu': 6,
  'Minggu': 7,
}

const monthNames = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

function formatTime(timeStr: string | null): string {
  if (!timeStr) return ''
  const parts = timeStr.split(':')
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`
  }
  return timeStr
}

function checkIsPast(classDate: string | null, endTime: string | null, currentTimestamp: number): boolean {
  if (!classDate) return true
  try {
    const [year, month, day] = classDate.split("-").map(Number)
    const [hours, minutes] = (endTime || "23:59").split(":").map(Number)
    const localClassEndTime = new Date(year, month - 1, day, hours, minutes, 0).getTime()
    return localClassEndTime < currentTimestamp
  } catch (e) {
    return true
  }
}

export default function DashboardMiddleSection({
  schedules,
  todayDayName,
  todayFormatted,
}: DashboardMiddleSectionProps) {
  // Inisialisasi langsung ke waktu acuan simulasi (5 Juli 2026)
  const targetTodayStr = "2026-07-05"
  const currentTimestamp = new Date(2026, 6, 5, 1, 6, 31).getTime()
  const simulatedToday = new Date(2026, 6, 5)

  // Calendar states
  const [selectedDate, setSelectedDate] = useState<Date>(simulatedToday)
  const [currentMonth, setCurrentMonth] = useState<number>(simulatedToday.getMonth())
  const [currentYear, setCurrentYear] = useState<number>(simulatedToday.getFullYear())

  // Handle Month Navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear((y) => y - 1)
    } else {
      setCurrentMonth((m) => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear((y) => y + 1)
    } else {
      setCurrentMonth((m) => m + 1)
    }
  }

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay()

  const calendarDays: (number | null)[] = []
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null)
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d)
  }

  const selectedDayName = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(selectedDate)

  // Format tanggal terpilih ke YYYY-MM-DD agar pencarian di kalender akurat secara spesifik per tanggal
  const formattedSelectedDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`

  // 1. Filter Kelas Hari Ini
  const todayClasses = schedules
    .filter((s) => s.class_date === targetTodayStr)
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))

  // 2. Filter Jadwal Berikutnya (hanya menampilkan kelas yang akan datang setelah hari acuan)
  const upcomingClasses = schedules
    .filter((s) => s.class_date && s.class_date > targetTodayStr)
    .sort((a, b) => {
      const dateA = a.class_date || ''
      const dateB = b.class_date || ''
      if (dateA !== dateB) return dateA.localeCompare(dateB)
      return (a.start_time || '').localeCompare(b.start_time || '')
    })
    .slice(0, 2)

  // 3. Filter kelas berdasarkan TANGGAL yang diklik di kalender (bukan cuma nama hari)
  const calendarSelectedClasses = schedules
    .filter((s) => s.class_date === formattedSelectedDateStr)
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* LEFT PANEL: Kelas Hari Ini */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden flex flex-col justify-between h-full min-h-[480px]">
          <div className="border-b border-neutral-100 px-6 py-4 flex items-center justify-between bg-neutral-50/30">
            <h2 className="text-neutral-900 font-bold text-sm sm:text-base flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
              Kelas Hari Ini
            </h2>
            <span className="text-xs font-semibold text-neutral-500 font-mono">
              {todayFormatted}
            </span>
          </div>

          <div className="p-6 flex-1 space-y-6">
            <div className="space-y-3">
              {todayClasses.length === 0 ? (
                <div className="py-6 text-center text-neutral-500 flex flex-col items-center justify-center">
                  <CalendarIcon className="w-8 h-8 text-neutral-300 mb-2" />
                  <p className="text-xs font-semibold text-neutral-700">Tidak ada jadwal mengajar hari ini.</p>
                  <p className="text-[10px] text-neutral-400">Selamat beristirahat atau persiapkan berkas tugas.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayClasses.map((s) => {
                    const isPast = checkIsPast(s.class_date, s.end_time, currentTimestamp)

                    return (
                      <div
                        key={s.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between border border-neutral-200 rounded-md p-3.5 bg-neutral-50/20 hover:border-neutral-300 transition-colors gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold bg-white border border-neutral-200 text-neutral-500 px-2 py-0.5 rounded font-mono">
                              {s.courses?.code}
                            </span>
                            <span className="text-[10px] font-semibold text-indigo-600 flex items-center gap-0.5 font-mono bg-indigo-50/50 px-1.5 py-0.5 rounded">
                              <Clock className="w-3 h-3 text-indigo-400" />
                              {formatTime(s.start_time)} - {formatTime(s.end_time)}
                            </span>
                            {!isPast && (
                              <span className="flex h-1.5 w-1.5 relative shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                              </span>
                            )}
                          </div>
                          <h4 className={`font-bold text-sm ${isPast ? 'line-through text-neutral-400' : 'text-neutral-900'}`}>
                            {s.courses?.name}
                          </h4>
                        </div>

                        <div className="flex items-center gap-3 self-start sm:self-auto text-xs">
                          {isPast ? (
                            <span className="text-red-600 font-semibold text-xs bg-red-50 border border-red-100 px-2.5 py-1 rounded">Selesai</span>
                          ) : s.is_online ? (
                            <>
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                                <Video className="w-3 h-3" />
                                Daring
                              </span>
                              {s.meeting_link && (
                                <a
                                  href={s.meeting_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-0.5 font-semibold text-indigo-600 hover:underline"
                                >
                                  Join <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </>
                          ) : (
                            <>
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-100 text-neutral-600 border border-neutral-250">
                                <MapPin className="w-3 h-3" />
                                Luring
                              </span>
                              <span className="font-bold text-neutral-800 bg-white border border-neutral-200 px-2 py-0.5 rounded-md shadow-2xs font-mono">
                                Ruang {s.room_number || '-'}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Upcoming Classes Section */}
            <div className="border-t border-neutral-200 pt-5">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">
                Jadwal Berikutnya
              </h3>
              {upcomingClasses.length === 0 ? (
                <p className="text-xs text-neutral-400 italic">Tidak ada jadwal kuliah lain.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {upcomingClasses.map((s) => {
                    const isPast = checkIsPast(s.class_date, s.end_time, currentTimestamp)

                    return (
                      <div
                        key={s.id}
                        className="border border-neutral-200 p-3 rounded-md bg-white space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-neutral-400 uppercase tracking-wide font-mono">
                            {s.day}
                          </span>
                          <span className="font-semibold text-neutral-500 font-mono">
                            {formatTime(s.start_time)}
                          </span>
                        </div>
                        <h4 className={`font-bold text-xs line-clamp-1 ${isPast ? 'line-through text-neutral-400' : 'text-neutral-800'}`}>
                          {s.courses?.name}
                        </h4>
                        <span className="text-[10px] text-neutral-400 block font-mono">
                          {isPast ? (
                            <span className="text-red-600 font-semibold text-xs">Selesai</span>
                          ) : s.is_online ? (
                            'Kelas Daring (Online)'
                          ) : (
                            `Ruang ${s.room_number || '-'}`
                          )}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border-t border-neutral-100 bg-neutral-50/20 text-center">
            <Link
              href="/dosen/schedules"
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold tracking-wide"
            >
              [ Selengkapnya → ]
            </Link>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Kalender */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <h3 className="font-bold text-neutral-900 text-sm flex items-center gap-1.5">
              <CalendarIcon className="w-4 h-4 text-indigo-600" />
              Kalender Mengajar
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="p-1 rounded hover:bg-neutral-100 text-neutral-500"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-neutral-800 font-sans min-w-[80px] text-center">
                {monthNames[currentMonth]} {currentYear}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1 rounded hover:bg-neutral-100 text-neutral-500"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {['Mi', 'Se', 'Se', 'Ra', 'Ka', 'Ju', 'Sa'].map((d, idx) => (
              <span
                key={idx}
                className={`font-semibold py-1 block ${d === 'Mi' ? 'text-red-500' : 'text-neutral-400'
                  }`}
              >
                {d}
              </span>
            ))}

            {calendarDays.map((dayNum, idx) => {
              if (dayNum === null) {
                return <span key={idx} className="py-2" />
              }

              const isSelected =
                selectedDate.getDate() === dayNum &&
                selectedDate.getMonth() === currentMonth &&
                selectedDate.getFullYear() === currentYear

              const isToday =
                simulatedToday.getDate() === dayNum &&
                simulatedToday.getMonth() === currentMonth &&
                simulatedToday.getFullYear() === currentYear

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(new Date(currentYear, currentMonth, dayNum))}
                  className={`py-1.5 text-center transition-all flex items-center justify-center font-semibold rounded-full mx-auto w-7 h-7 text-xs ${isSelected
                      ? 'bg-indigo-600 text-white font-bold'
                      : isToday
                        ? 'bg-neutral-100 border border-neutral-300 text-neutral-900 font-bold'
                        : 'text-neutral-700 hover:bg-neutral-50 cursor-pointer'
                    }`}
                >
                  {dayNum}
                </button>
              )
            })}
          </div>

          {/* Selected Date Agenda */}
          <div className="border-t border-neutral-100 pt-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-neutral-500">
              <span className="uppercase tracking-wider">
                Agenda {selectedDayName} ({selectedDate.getDate()} {monthNames[selectedDate.getMonth()]})
              </span>
              <span className="font-mono text-indigo-600">
                {calendarSelectedClasses.length} Kelas
              </span>
            </div>

            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {calendarSelectedClasses.length === 0 ? (
                <p className="text-xs text-neutral-400 py-3 italic text-center">
                  Tidak ada jadwal mengajar pada tanggal ini.
                </p>
              ) : (
                calendarSelectedClasses.map((s) => {
                  const isPast = checkIsPast(s.class_date, s.end_time, currentTimestamp)

                  return (
                    <div
                      key={s.id}
                      className="p-2.5 bg-neutral-50/50 border border-neutral-200 rounded text-xs space-y-1 hover:border-neutral-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-bold line-clamp-1 max-w-[140px] ${isPast ? 'line-through text-neutral-400' : 'text-neutral-800'}`}>
                          {s.courses?.name}
                        </span>
                        <span className="font-mono font-bold text-[10px] text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded">
                          {formatTime(s.start_time)}
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-400 block font-mono">
                        {isPast ? (
                          <span className="text-red-600 font-semibold text-xs">Selesai</span>
                        ) : s.is_online ? (
                          'Daring (Online)'
                        ) : (
                          `Ruang ${s.room_number || '-'}`
                        )}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}