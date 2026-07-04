'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Calendar, GraduationCap, LogOut, BookOpen, Megaphone, Users, ClipboardList, FileText } from 'lucide-react'

interface Profile {
  name: string
  email: string
}

interface SidebarProps {
  profile: Profile
  onLogout: () => Promise<void>
}

export default function Sidebar({ profile, onLogout }: SidebarProps) {
  const pathname = usePathname()

  const navItems = [
    {
      name: 'Dashboard',
      href: '/dosen/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Mata Kuliah',
      href: '/dosen/courses',
      icon: BookOpen,
    },
    {
      name: 'Jadwal Kuliah',
      href: '/dosen/schedules',
      icon: Calendar,
    },
    {
      name: 'Daftar Mahasiswa',
      href: '/dosen/students',
      icon: Users,
    },
    {
      name: 'Presensi Kelas',
      href: '/dosen/attendance',
      icon: ClipboardList,
    },
    {
      name: 'Tugas Kuliah',
      href: '/dosen/assignments',
      icon: FileText,
    },
    {
      name: 'Kelola Nilai',
      href: '/dosen/grades',
      icon: GraduationCap,
    },
    {
      name: 'Pengumuman',
      href: '/dosen/announcements',
      icon: Megaphone,
    },
  ]

  return (
    <aside className="w-64 border-r border-neutral-200 bg-white flex flex-col h-screen sticky top-0 shrink-0">
      {/* Header */}
      <div className="px-6 py-5 border-b border-neutral-100 flex items-center gap-3">
        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 border border-indigo-100">
          <GraduationCap className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-base tracking-tight text-neutral-900 block">Portal Dosen</span>
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Lecturer Area</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-neutral-100 text-neutral-900 font-semibold'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 font-medium'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600' : 'text-neutral-400'}`} />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Profile Summary & Logout */}
      <div className="p-4 border-t border-neutral-200 bg-neutral-50/50 flex flex-col gap-3">
        <div className="flex flex-col min-w-0 px-2">
          <span className="text-sm font-semibold text-neutral-800 truncate" title={profile.name}>
            {profile.name}
          </span>
          <span className="text-xs text-neutral-500 truncate" title={profile.email}>
            {profile.email}
          </span>
        </div>
        <form action={onLogout} className="w-full">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-neutral-200 hover:border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-600 hover:text-neutral-900 rounded-md text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Keluar
          </button>
        </form>
      </div>
    </aside>
  )
}
