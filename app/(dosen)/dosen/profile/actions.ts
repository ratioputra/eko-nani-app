'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfileAction(
  name: string,
  nidn: string,
  faculty: string,
  department: string
) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'Unauthorized: Please log in again.' }
    }

    // 2. Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        name: name.trim(),
        nidn: nidn.trim(),
        faculty: faculty.trim(),
        department: department.trim(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Update profile error:', updateError)
      return { error: `Gagal memperbarui profil: ${updateError.message}` }
    }

    revalidatePath('/dosen/profile')
    revalidatePath('/dosen/grades')
    return { success: true }
  } catch (error: any) {
    console.error('Unhandled updateProfileAction error:', error)
    return { error: error.message || 'Terjadi kesalahan yang tidak terduga.' }
  }
}

export async function updateInstitutionSettingsAction(
  id: number,
  univName: string,
  facultyDefault: string,
  departmentDefault: string,
  address: string,
  phone: string,
  krsStatus: boolean
) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'Unauthorized: Please log in again.' }
    }

    // 2. Verify lecturer role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return { error: 'Unauthorized: Profile not found.' }
    }

    const role = profile.role?.toUpperCase()
    if (role !== 'DOSEN' && role !== 'LECTURER') {
      return { error: 'Unauthorized: Only lecturers can edit institution settings.' }
    }

    // 3. Update settings
    const { error: updateError } = await supabase
      .from('institution_settings')
      .update({
        univ_name: univName.trim(),
        faculty_default: facultyDefault.trim(),
        department_default: departmentDefault.trim(),
        address: address.trim(),
        phone: phone.trim(),
        krs_status: krsStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      console.error('Update institution settings error:', updateError)
      return { error: `Gagal memperbarui data kampus: ${updateError.message}` }
    }

    revalidatePath('/dosen/profile')
    revalidatePath('/dosen/grades')
    revalidatePath('/mahasiswa/courses')
    return { success: true }
  } catch (error: any) {
    console.error('Unhandled updateInstitutionSettingsAction error:', error)
    return { error: error.message || 'Terjadi kesalahan yang tidak terduga.' }
  }
}
