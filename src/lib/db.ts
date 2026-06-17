import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

function buildPool() {
  const rawUrl = process.env.DATABASE_URL!
  // Strip sslmode — we handle SSL via pool options
  const connectionString = rawUrl.replace(/[?&]sslmode=[^&]*/g, '').replace(/\?$/, '')
  return new pg.Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    // Force IPv4 family so pg doesn't attempt IPv6-only direct hosts
    family: 4,
  })
}

function createPrismaClient() {
  const pool = buildPool()
  const adapter = new PrismaPg(pool)
  return new PrismaClient({
    adapter,
    log: ['error'],
  } as any)
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
