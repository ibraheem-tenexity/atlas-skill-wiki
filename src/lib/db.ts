import { PrismaClient } from '@prisma/client'

function createPrismaClient() {
  return new PrismaClient({
    log: ['error'],
  })
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
