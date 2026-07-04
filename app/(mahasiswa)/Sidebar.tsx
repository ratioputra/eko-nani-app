'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, GraduationCap, LogOut, BookMarked, FileSpreadsheet, FileText, ChevronLeft, ChevronRight, Menu, Calendar } from 'lucide-react'

interface Profile {
  name: string | null
  email: string
  nim?: string | null
}

interface SidebarProps {
  profile: Profile
  onLogout: () => Promise<void>
}

export default function Sidebar({ profile, onLogout }: SidebarProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const stored = localStorage.getItem('sidebar-collapsed-mahasiswa')
    if (stored !== null) {
      setIsCollapsed(stored === 'true')
    } else {
      // Default to collapsed on mobile, expanded on desktop
      setIsCollapsed(window.innerWidth < 768)
    }
  }, [])

  const toggleSidebar = () => {
    const nextState = !isCollapsed
    setIsCollapsed(nextState)
    localStorage.setItem('sidebar-collapsed-mahasiswa', String(nextState))
  }

  const handleLinkClick = () => {
    if (window.innerWidth < 768) {
      setIsCollapsed(true)
    }
  }

  const navItems = [
    {
      name: 'Dashboard',
      href: '/mahasiswa/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Pilih Matkul (KRS)',
      href: '/mahasiswa/courses',
      icon: BookMarked,
    },
    {
      name: 'Tugas Kuliah',
      href: '/mahasiswa/assignments',
      icon: FileText,
    },
    {
      name: 'Jadwal Kuliah',
      href: '/mahasiswa/schedules',
      icon: Calendar,
    },
    {
      name: 'Hasil Studi',
      href: '/mahasiswa/grades',
      icon: FileSpreadsheet,
    },
  ]

  return (
    <>
      {/* Backdrop overlay for mobile */}
      {!isCollapsed && isMounted && (
        <div
          className="fixed inset-0 bg-neutral-900/40 z-40 md:hidden transition-opacity duration-300"
          onClick={toggleSidebar}
        />
      )}

      {/* Floating Hamburger trigger for mobile when collapsed */}
      {isCollapsed && isMounted && (
        <button
          onClick={toggleSidebar}
          className="fixed bottom-6 right-6 z-40 md:hidden flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer border border-indigo-500"
        >
          <Menu className="w-6 h-6" />
        </button>
      )}

      <aside
        className={`bg-white border-r border-neutral-200 flex flex-col h-screen shrink-0 transition-all duration-300 ease-in-out relative z-45 font-sans print:hidden
          ${isCollapsed ? 'w-16' : 'w-64'}
          md:sticky md:top-0
          max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:w-64 max-md:shadow-xl
          ${isMounted ? (isCollapsed ? 'max-md:-translate-x-full' : 'max-md:translate-x-0') : 'max-md:-translate-x-full'}
        `}
      >
        {/* Toggle Button for desktop & expanded mobile */}
        <button
          onClick={toggleSidebar}
          className={`absolute top-5 -right-3 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 hover:text-neutral-900 shadow-2xs transition-colors cursor-pointer ${
            isCollapsed ? 'max-md:hidden' : ''
          }`}
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        {/* Header */}
        <div className={`py-5 border-b border-neutral-100 flex items-center transition-all duration-300 ${isCollapsed ? 'px-3 justify-center' : 'px-6 gap-3'}`}>
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 border border-indigo-100 shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className={`transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
            <span className="font-bold text-base tracking-tight text-neutral-900 block whitespace-nowrap">Portal Mahasiswa</span>
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block whitespace-nowrap">Student Area</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                title={isCollapsed ? item.name : undefined}
                className={`flex items-center rounded-md text-sm transition-all duration-300 ${
                  isCollapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2'
                } ${
                  isActive
                    ? 'bg-neutral-100 text-neutral-900 font-semibold'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 font-medium'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-indigo-600' : 'text-neutral-400'}`} />
                <span className={`transition-all duration-300 origin-left ${
                  isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'
                }`}>
                  {item.name}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Profile Summary & Logout */}
        <div className={`p-4 border-t border-neutral-200 bg-neutral-50/50 flex flex-col gap-3 transition-all duration-300 ${isCollapsed ? 'items-center px-2' : ''}`}>
          <div className={`flex flex-col min-w-0 px-2 gap-0.5 transition-all duration-300 ${isCollapsed ? 'w-0 h-0 opacity-0 overflow-hidden p-0' : 'w-auto opacity-100'}`}>
            <span className="text-sm font-semibold text-neutral-800 truncate" title={profile.name || ''}>
              {profile.name || 'Mahasiswa'}
            </span>
            {profile.nim && (
              <span className="text-[10px] font-bold text-indigo-600 font-mono block whitespace-nowrap">
                NIM: {profile.nim}
              </span>
            )}
            <span className="text-xs text-neutral-500 truncate block whitespace-nowrap" title={profile.email}>
              {profile.email}
            </span>
          </div>
          <form action={onLogout} className="w-full flex justify-center">
            <button
              type="submit"
              title={isCollapsed ? 'Keluar' : undefined}
              className={`flex items-center justify-center border border-neutral-200 hover:border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-600 hover:text-neutral-900 rounded-md transition-all duration-300 cursor-pointer shadow-2xs ${
                isCollapsed ? 'h-9 w-9 p-0' : 'w-full gap-2 px-3 py-2 text-xs font-semibold'
              }`}
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span className={`transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 overflow-hidden hidden' : 'w-auto opacity-100'}`}>
                Keluar
              </span>
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}
