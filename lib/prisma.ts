import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  // Ensure DATABASE_URL is set. In Next.js, this is typically handled by
  // environment variables loaded from .env.local, etc.
  // If not set, PrismaClient will throw an error when trying to connect,
  // which is preferable to an undefined 'prisma' object.
  return new PrismaClient()
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma