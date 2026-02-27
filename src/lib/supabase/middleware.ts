import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Create an initial response object.
  // We can modify this response's cookies directly.
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Set cookies on the request for subsequent logic
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          
          // Re-create the response to include updated request cookies
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })

          // Set cookies on the response to be sent to the browser
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes logic
  // Matches checks in src/middleware.ts config or specific protected paths
  // If the user is NOT logged in and the path IS protected (not auth, not public assets)
  // we redirect.
  // Note: The matcher in src/middleware.ts already filters out many static assets,
  // so we can focus on specific logical exclusions.
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    !request.nextUrl.pathname.startsWith('/_next') &&
    !request.nextUrl.pathname.startsWith('/p')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  return response
}
