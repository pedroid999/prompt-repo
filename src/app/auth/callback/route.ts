import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Validate 'next' param to prevent open redirect
      const isRelative = next.startsWith('/') && !next.startsWith('//') && !next.includes('\\');
      const safeNext = isRelative ? next : '/';
      
      redirect(`${origin}${safeNext}`)
    }
  }

  redirect('/auth/auth-error')
}
