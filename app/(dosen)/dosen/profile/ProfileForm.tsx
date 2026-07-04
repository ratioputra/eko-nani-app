'use client'

import React, { useState } from 'react'
import { updateProfileAction } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { User, CheckCircle2, ShieldAlert, Loader2, Save, Mail, Award, BookOpen, Fingerprint } from 'lucide-react'

interface Profile {
  id: string
  name: string | null
  email: string | null
  nidn: string | null
  faculty: string | null
  department: string | null
}

interface ProfileFormProps {
  initialProfile: Profile
}

export default function ProfileForm({ initialProfile }: ProfileFormProps) {
  const [name, setName] = useState(initialProfile.name || '')
  const [nidn, setNidn] = useState(initialProfile.nidn || '')
  const [faculty, setFaculty] = useState(initialProfile.faculty || '')
  const [department, setDepartment] = useState(initialProfile.department || '')

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    if (!name.trim()) {
      setErrorMsg('Nama lengkap wajib diisi.')
      setLoading(false)
      return
    }

    try {
      const result = await updateProfileAction(name, nidn, faculty, department)
      if (result?.error) {
        setErrorMsg(result.error)
      } else {
        setSuccessMsg('Profil Anda berhasil diperbarui!')
        setTimeout(() => setSuccessMsg(null), 5500)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memperbarui profil.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-md text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-md text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {successMsg}
        </div>
      )}

      <Card className="bg-white border border-neutral-200 shadow-sm rounded-lg overflow-hidden max-w-2xl">
        <CardHeader className="border-b border-neutral-100 bg-neutral-50/50 px-6 py-5">
          <CardTitle className="text-neutral-900 font-semibold text-base flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-600" />
            Informasi Profil Profesional
          </CardTitle>
          <CardDescription className="text-neutral-500 text-sm">
            Perbarui data diri akademik Anda sebagai dosen pengampu. Data ini akan ditampilkan pada Laporan Hasil Studi Mahasiswa.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Read-Only Email & Auth ID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-neutral-150">
              <div className="flex flex-col gap-1.5 opacity-70">
                <Label className="text-neutral-600 font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-neutral-455" />
                  Email Terdaftar (Akun)
                </Label>
                <div className="h-9 w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm text-neutral-500 font-medium">
                  {initialProfile.email || '-'}
                </div>
              </div>
              <div className="flex flex-col gap-1.5 opacity-70">
                <Label className="text-neutral-600 font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Fingerprint className="w-3.5 h-3.5 text-neutral-455" />
                  Dosen ID (UUID)
                </Label>
                <div className="h-9 w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm font-mono text-neutral-500">
                  {initialProfile.id}
                </div>
              </div>
            </div>

            {/* Edit Fields */}
            <div className="space-y-4">
              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lecturer-name" className="text-neutral-700 font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-neutral-400" />
                  Nama Lengkap beserta Gelar <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="lecturer-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Dr. Antigravity, M.Kom."
                  className="border-neutral-300 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/30 text-neutral-900 bg-white"
                />
              </div>

              {/* NIDN */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lecturer-nidn" className="text-neutral-700 font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-neutral-400" />
                  Nomor Induk Dosen Nasional (NIDN)
                </Label>
                <Input
                  id="lecturer-nidn"
                  type="text"
                  value={nidn}
                  onChange={(e) => setNidn(e.target.value)}
                  placeholder="Contoh: 0407062601"
                  className="border-neutral-300 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/30 text-neutral-900 bg-white"
                />
              </div>

              {/* Faculty */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lecturer-faculty" className="text-neutral-700 font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-neutral-400" />
                  Fakultas
                </Label>
                <Input
                  id="lecturer-faculty"
                  type="text"
                  value={faculty}
                  onChange={(e) => setFaculty(e.target.value)}
                  placeholder="Contoh: Fakultas Tarbiyah dan Keguruan"
                  className="border-neutral-300 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/30 text-neutral-900 bg-white"
                />
              </div>

              {/* Department */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lecturer-department" className="text-neutral-700 font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-neutral-400" />
                  Program Studi (Prodi)
                </Label>
                <Input
                  id="lecturer-department"
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Contoh: Pendidikan Agama Islam"
                  className="border-neutral-300 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/30 text-neutral-900 bg-white"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t border-neutral-100 bg-neutral-50/20 -mx-6 -mb-6 p-6">
              <Button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs transition-colors rounded-md px-6 flex items-center gap-1.5 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Simpan Perubahan
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
