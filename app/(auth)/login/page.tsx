'use client'

import React, { useActionState, useState } from 'react'
import { Loader2, Mail, Lock, AlertCircle, Shield } from 'lucide-react'
import { loginAction } from './actions'
import { createClient } from '@/lib/supabase/client'

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) {
        console.error('Google login error:', error.message)
        setGoogleLoading(false)
      }
    } catch (err) {
      console.error('OAuth initiation exception:', err)
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#FAFAFA] px-4 font-sans antialiased text-[#171717]">
      <Card className="w-full max-w-md bg-white border border-neutral-200 shadow-md rounded-lg overflow-hidden p-3">
        
        <CardHeader className="space-y-1.5 text-center pt-6">
          <div className="mx-auto inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 mb-2 shadow-3xs">
            <Shield className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-neutral-900">
            Academic Portal
          </CardTitle>
          <CardDescription className="text-neutral-500 text-xs">
            Masuk dengan Google atau akun email Anda untuk melanjutkan.
          </CardDescription>
        </CardHeader>

        {/* Display error message */}
        {state?.error && (
          <div className="mx-6 mt-3 flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-700 text-xs rounded-md p-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="font-semibold leading-normal">{state.error}</div>
          </div>
        )}

        {/* Google Authentication Button */}
        <div className="px-6 pt-4">
          <Button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isPending || googleLoading}
            className="w-full bg-white hover:bg-neutral-50 border border-neutral-300 text-neutral-800 hover:text-neutral-900 font-semibold h-10 rounded-md transition duration-200 shadow-3xs active:scale-[0.99] flex items-center justify-center cursor-pointer"
          >
            {googleLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2 text-neutral-500" />
                Menghubungkan...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2.5 shrink-0" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Masuk dengan Google
              </>
            )}
          </Button>
        </div>

        {/* Separator "atau" */}
        <div className="relative my-4 px-6">
          <div className="absolute inset-0 flex items-center px-6">
            <div className="w-full border-t border-neutral-200"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
            <span className="bg-white px-2 text-neutral-400 font-bold">atau</span>
          </div>
        </div>

        <form action={formAction}>
          <CardContent className="space-y-4 pt-1 px-6">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="nama@university.ac.id"
                  required
                  className="border-neutral-300 placeholder:text-neutral-300 pl-9 h-9 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/30 text-neutral-900 bg-white font-medium"
                  disabled={isPending || googleLoading}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  className="border-neutral-300 placeholder:text-neutral-300 pl-9 h-9 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/30 text-neutral-900 bg-white font-medium"
                  disabled={isPending || googleLoading}
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 pb-6 pt-3 px-6">
            <Button
              type="submit"
              disabled={isPending || googleLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold h-9 rounded-md transition duration-200 shadow-3xs active:scale-[0.99] cursor-pointer"
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  Mengecek...
                </span>
              ) : (
                'Sign In dengan Email'
              )}
            </Button>
            <div className="text-center pt-2">
              <span className="text-[10px] text-neutral-400 font-mono">
                Independent Academic Portal Portal Dosen/Mahasiswa
              </span>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
