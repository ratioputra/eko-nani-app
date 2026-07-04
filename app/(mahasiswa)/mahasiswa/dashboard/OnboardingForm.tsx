'use client'

import React, { useState } from 'react'
import { saveOnboardingAction } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, GraduationCap, ArrowRight } from 'lucide-react'

interface OnboardingFormProps {
  email: string
}

export default function OnboardingForm({ email }: OnboardingFormProps) {
  const [name, setName] = useState('')
  const [nim, setNim] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setLoading(true)

    try {
      const result = await saveOnboardingAction(name, nim)
      if (result?.error) {
        setErrorMsg(result.error)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan profil.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4 sm:p-6 font-sans">
      <Card className="w-full max-w-md bg-white border border-neutral-200 shadow-sm rounded-lg overflow-hidden">
        <CardHeader className="border-b border-neutral-100 bg-neutral-50/50 p-6 text-center flex flex-col items-center">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100 mb-3 shadow-3xs">
            <GraduationCap className="w-6 h-6" />
          </div>
          <CardTitle className="text-neutral-900 font-bold text-xl">Lengkapi Profil Mahasiswa</CardTitle>
          <CardDescription className="text-neutral-500 text-xs mt-1">
            Akun Google Anda ({email}) berhasil terhubung. Silakan isi detail berikut untuk masuk ke dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-md text-xs font-medium">
                {errorMsg}
                <div className="mt-1 text-[10px] text-red-500 font-normal">
                  Pemberitahuan: Pastikan kolom 'nim' telah terdaftar di database profiles Supabase Anda.
                </div>
              </div>
            )}

            {/* Nama Lengkap */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name" className="text-neutral-700 font-semibold text-[10px] uppercase tracking-wider">
                Nama Lengkap
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Contoh: Ahmad Fauzi"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-10 border-neutral-300 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/30 text-neutral-950 bg-white"
              />
            </div>

            {/* NIM */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nim" className="text-neutral-700 font-semibold text-[10px] uppercase tracking-wider">
                NIM / Nomor Induk Mahasiswa
              </Label>
              <Input
                id="nim"
                type="text"
                placeholder="Contoh: 1207050001"
                value={nim}
                onChange={(e) => setNim(e.target.value)}
                required
                className="h-10 border-neutral-300 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/30 text-neutral-950 bg-white"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold h-10 shadow-xs transition-colors rounded-md flex items-center justify-center gap-1.5 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  Simpan & Masuk Dashboard
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
