import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from './Sidebar'

export const dynamic = 'force-dynamic'

export default async function DosenLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // 1. Authenticate user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // 2. Fetch user profile role and name
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, name, email')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    redirect('/login')
  }

  const role = profile.role?.toUpperCase()
  if (role !== 'DOSEN' && role !== 'LECTURER') {
    redirect('/login')
  }

  // 3. Logout action
  async function handleLogout() {
    'use server'
    const supabaseClient = await createClient()
    await supabaseClient.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex text-[#171717] print:block print:bg-white print:text-black print:static print:w-full print:p-0">
      {/* Sidebar navigation */}
      <Sidebar profile={profile} onLogout={handleLogout} />

      {/* Main page content area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto min-w-0 print:block print:w-full print:static print:p-0 print:overflow-visible">
        {children}
      </div>
    </div>
  )
}
