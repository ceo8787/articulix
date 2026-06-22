import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PASSWORD = 'Ar954ti42211cu54lix32'
const COOKIE_NAME = 'articulix-auth'

export function middleware(request: NextRequest) {
  const cookie = request.cookies.get(COOKIE_NAME)
  const isAuth = cookie?.value === PASSWORD
  const isLoginPage = request.nextUrl.pathname === '/login'
  const isApiLogin = request.nextUrl.pathname === '/api/login'

  if (!isAuth && !isLoginPage && !isApiLogin) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAuth && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
