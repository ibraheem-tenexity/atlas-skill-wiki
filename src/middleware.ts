import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Block readers from write pages
    if (path.startsWith('/skill/new') || path.endsWith('/edit')) {
      if (token?.role === 'reader') {
        return NextResponse.redirect(new URL('/?error=unauthorized', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token // require login for all protected routes
    }
  }
)

export const config = {
  matcher: ['/skill/new', '/skill/:slug*/edit', '/governance']
}
