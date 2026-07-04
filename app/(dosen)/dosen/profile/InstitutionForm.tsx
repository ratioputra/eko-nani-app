'use client'

import React, { useState } from 'react'
import { updateInstitutionSettingsAction } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { School, CheckCircle2, ShieldAlert, Loader2, Save, MapPin, Phone } from 'lucide-react'

interface InstitutionSettings {
  id: number
  univ_name: string | null
  faculty_default: string | null
  department_default: string | null
  address: string | null
  phone: string | null
  krs_status: boolean
}

interface InstitutionFormProps {
  initialSettings: InstitutionSettings | null
}

export default function InstitutionForm({ initialSettings }: InstitutionFormProps) {
  const settingsId = initialSettings?.id || 1
  const [univName, setUnivName] = useState(initialSettings?.univ_name || '')
  const [facultyDefault, setFacultyDefault] = useState(initialSettings?.faculty_default || '')
  const [departmentDefault, setDepartmentDefault] = useState(initialSettings?.department_default || '')
  const [address, setAddress] = useState(initialSettings?.address || '')
  const [phone, setPhone] = useState(initialSettings?.phone || '')
  const [krsStatus, setKrsStatus] = useState<boolean>(initialSettings?.krs_status || false)

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    if (!univName.trim()) {
      setErrorMsg('Nama universitas wajib diisi.')
      setLoading(false)
      return
    }

    try {
      const result = await updateInstitutionSettingsAction(
        settingsId,
        univName,
        facultyDefault,
        departmentDefault,
        address,
        phone,
        krsStatus
      )
      if (result?.error) {
        setErrorMsg(result.error)
      } else {
        setSuccessMsg('Data Kampus berhasil diperbarui!')
        setTimeout(() => setSuccessMsg(null), 5500)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memperbarui data kampus.')
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
            <School className="w-5 h-5 text-indigo-600" />
            Pengaturan Data Kampus / Prodi
          </CardTitle>
          <CardDescription className="text-neutral-500 text-sm">
            Atur nama institusi, alamat, nomor telepon, serta fakultas/prodi bawaan. Data ini dicetak di KOP laporan hasil studi mahasiswa.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nama Universitas */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="univ-name" className="text-neutral-700 font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <School className="w-3.5 h-3.5 text-neutral-400" />
                Nama Universitas <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="univ-name"
                type="text"
                required
                value={univName}
                onChange={(e) => setUnivName(e.target.value)}
                placeholder="Contoh: UNIVERSITAS ANTIGRAVITY"
                className="border-neutral-300 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/30 text-neutral-900 bg-white"
              />
            </div>

            {/* Fakultas Default */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="faculty-default" className="text-neutral-700 font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5">
                Fakultas Bawaan (Default)
              </Label>
              <Input
                id="faculty-default"
                type="text"
                value={facultyDefault}
                onChange={(e) => setFacultyDefault(e.target.value)}
                placeholder="Contoh: Fakultas Tarbiyah dan Keguruan"
                className="border-neutral-300 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/30 text-neutral-900 bg-white"
              />
            </div>

            {/* Prodi Default */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="department-default" className="text-neutral-700 font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5">
                Program Studi Bawaan (Default)
              </Label>
              <Input
                id="department-default"
                type="text"
                value={departmentDefault}
                onChange={(e) => setDepartmentDefault(e.target.value)}
                placeholder="Contoh: Program Studi Pendidikan Agama Islam"
                className="border-neutral-300 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/30 text-neutral-900 bg-white"
              />
            </div>

            {/* Alamat Kampus */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="campus-address" className="text-neutral-700 font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                Alamat Kampus
              </Label>
              <Input
                id="campus-address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Contoh: Gedung Rektorat Lt. 2, Kampus Terpadu, Sleman, Yogyakarta"
                className="border-neutral-300 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/30 text-neutral-900 bg-white"
              />
            </div>

            {/* Nomor Telepon */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="campus-phone" className="text-neutral-700 font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-neutral-400" />
                Nomor Telepon
              </Label>
              <Input
                id="campus-phone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Contoh: (0274) 123456"
                className="border-neutral-300 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/30 text-neutral-900 bg-white"
              />
            </div>

            {/* Status Pengisian KRS Mahasiswa */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="krs-status" className="text-neutral-700 font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5">
                Status Pengisian KRS Mahasiswa
              </Label>
              <select
                id="krs-status"
                value={krsStatus ? 'true' : 'false'}
                onChange={(e) => setKrsStatus(e.target.value === 'true')}
                className="h-9 w-full rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm shadow-3xs transition-colors focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-neutral-800 font-medium cursor-pointer"
              >
                <option value="true">Dibuka (Mahasiswa Bebas Memilih)</option>
                <option value="false">Dikunci (Fitur KRS Ditutup)</option>
              </select>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t border-neutral-100 bg-neutral-50/20 -mx-6 -mb-6 p-6 mt-6">
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
                    Simpan Data Kampus
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
