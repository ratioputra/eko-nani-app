import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const pathname = request.nextUrl.pathname

  // Allow safe passage for auth routes
  if (pathname.startsWith('/auth')) {
    return supabaseResponse
  }

  // 1. Refresh Supabase auth token session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 2. Protect routes - Redirect unauthenticated users trying to access /, /dosen/*, or /mahasiswa/*
  if (!user) {
    if (pathname === '/' || pathname.startsWith('/dosen') || pathname.startsWith('/mahasiswa')) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // 3. Fetch user profile role from public.profiles table
  let role: string | null = null
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!error && profile) {
      role = profile.role
    }
  } catch (err) {
    console.error('Error fetching user profile role in middleware:', err)
  }

  // Descriptive logging inside middleware as requested
  console.log('Middleware Check - User:', user ? { id: user.id, email: user.email } : null, 'Role:', role)

  const isStudent = role?.toLowerCase() === 'mahasiswa' || role?.toLowerCase() === 'student'
  const isLecturer = role?.toLowerCase() === 'dosen' || role?.toLowerCase() === 'lecturer'

  // If user is already logged in and attempts to access the login page or the root route
  if (pathname === '/login' || pathname === '/') {
    const url = request.nextUrl.clone()
    if (isLecturer) {
      url.pathname = '/dosen/dashboard'
      return NextResponse.redirect(url)
    } else if (isStudent) {
      url.pathname = '/mahasiswa/dashboard'
      return NextResponse.redirect(url)
    } else if (pathname === '/') {
      // Avoid redirect loops for logged-in users without roles by sending to login
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  // If student (mahasiswa) attempts to access lecturer (dosen) routes
  if (pathname.startsWith('/dosen') && isStudent) {
    const url = request.nextUrl.clone()
    url.pathname = '/mahasiswa/dashboard'
    return NextResponse.redirect(url)
  }

  // If lecturer (dosen) attempts to access student (mahasiswa) routes
  if (pathname.startsWith('/mahasiswa') && isLecturer) {
    const url = request.nextUrl.clone()
    url.pathname = '/dosen/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

// 4. Matcher to only run on /, /dosen/*, /mahasiswa/*, and /login
export const config = {
  matcher: [
    '/',
    '/dosen/:path*',
    '/mahasiswa/:path*',
    '/login',
  ],
}
