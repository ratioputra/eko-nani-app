'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

interface Course {
  id: string
  name: string
  code: string
}

interface CourseSelectProps {
  courses: Course[]
  selectedCourseId: string
}

export default function CourseSelect({ courses, selectedCourseId }: CourseSelectProps) {
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    if (val) {
      router.push(`/dosen/grades?courseId=${val}`)
    } else {
      router.push('/dosen/grades')
    }
  }

  return (
    <div className="flex flex-col gap-1.5 max-w-sm w-full bg-white p-4 border border-neutral-200 shadow-xs rounded-lg">
      <label htmlFor="course-select" className="text-neutral-700 font-semibold text-xs uppercase tracking-wider">
        Pilih Mata Kuliah
      </label>
      <select
        id="course-select"
        value={selectedCourseId}
        onChange={handleChange}
        className="h-9 w-full rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm shadow-xs transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-neutral-800 font-medium"
      >
        <option value="">-- Pilih Mata Kuliah --</option>
        {courses.map((course) => (
          <option key={course.id} value={course.id}>
            [{course.code}] {course.name}
          </option>
        ))}
      </select>
    </div>
  )
}
