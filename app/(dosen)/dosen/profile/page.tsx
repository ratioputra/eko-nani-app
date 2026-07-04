import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GraduationCap, User } from 'lucide-react'
import ProfileForm from './ProfileForm'
import InstitutionForm from './InstitutionForm'

export const dynamic = 'force-dynamic'

export default async function LecturerProfilePage() {
  const supabase = await createClient()

  // 1. Authenticate user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // 2. Fetch user profile role and details
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, name, email, nidn, faculty, department')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    redirect('/login')
  }

  const role = profile.role?.toUpperCase()
  if (role !== 'DOSEN' && role !== 'LECTURER') {
    redirect('/login')
  }

  // 3. Fetch institution settings
  const { data: instSettings } = await supabase
    .from('institution_settings')
    .select('*')
    .single()

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#171717] flex flex-col font-sans antialiased">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white px-6 py-4 flex items-center justify-between shadow-2xs print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 border border-indigo-100">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight block">Portal Dosen</span>
            <span className="text-xs text-neutral-500 font-medium">Pengaturan Profil Akademik</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-neutral-500 font-mono bg-neutral-100 px-2 py-1 rounded border border-neutral-200">
            {profile.name}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-8 space-y-8">
        {/* Page Title */}
        <div className="flex flex-col gap-1.5 border-b border-neutral-200 pb-5">
          <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Dosen Profil</div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 flex items-center gap-2">
            <User className="w-8 h-8 text-indigo-600 shrink-0" />
            Pengaturan Akun & Profil
          </h1>
          <p className="text-neutral-500 text-sm max-w-2xl">
            Lengkapi data profesional Anda serta informasi institusi kampus untuk keperluan cetak laporan resmi hasil studi mahasiswa.
          </p>
        </div>

        {/* Form Cards Stack */}
        <div className="space-y-8">
          {/* Profile Editor Form */}
          <ProfileForm initialProfile={profile} />

          {/* Institution Editor Form */}
          <InstitutionForm initialSettings={instSettings || null} />
        </div>
      </main>
    </div>
  )
}
