import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  if (!process.env.DATABASE_URL) {
    console.error("CRITICAL ERROR: DATABASE_URL is not defined in process.env");
  }
  return new PrismaClient()
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma