import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const rootDomain = 'webidex.in'

  if (hostname === rootDomain || hostname === `www.${rootDomain}` ||!hostname.includes(rootDomain)) {
    return NextResponse.next()
  }

  const subdomain = hostname.replace(`.${rootDomain}`, '').split(':')[0]

  if (subdomain && subdomain!== 'www') {
    return NextResponse.rewrite(new URL(`/p/${subdomain}`, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|api|_vercel|favicon.ico).*)'],
}