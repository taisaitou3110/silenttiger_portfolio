import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  const url = process.env.DATABASE_URL;
  
      if (!url) {
        // Throw an error to explicitly stop execution if DATABASE_URL is missing
        throw new Error("CRITICAL ERROR: DATABASE_URL is not defined in environment variables. Please set it in your Vercel project settings.");
      }
  return new PrismaClient({
    datasources: {
      db: {
        url: url, // ここで明示的にURLを流し込む
      },
    },
  })
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma