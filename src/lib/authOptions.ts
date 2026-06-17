import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import bcrypt from 'bcryptjs'
import type { AuthOptions } from 'next-auth'

function getPrisma() {
  const rawUrl = process.env.DATABASE_URL!
  // Strip sslmode from URL — we handle SSL via pool options
  const connectionString = rawUrl.replace(/[?&]sslmode=[^&]*/g, '').replace(/\?$/, '')
  const pool = new pg.Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter } as any)
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const prisma = getPrisma()
        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: { department: true },
          })
          if (!user) return null
          const valid = await bcrypt.compare(credentials.password, user.password)
          if (!valid) return null
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            departmentId: user.departmentId,
          }
        } finally {
          await prisma.$disconnect()
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.departmentId = (user as any).departmentId
        token.userId = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role
        ;(session.user as any).departmentId = token.departmentId
        ;(session.user as any).userId = token.userId
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
}
