import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PASSWORD = 'Ar954ti42211cu54lix32'

export async function POST(request: NextRequest) {
  const { password } = await request.json()
  
  if (password === PASSWORD) {
    const response = NextResponse.json({ success: true })
    response.cookies.set('articulix-auth', PASSWORD, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/'
    })
    return response
  }
  
  return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 })
}
