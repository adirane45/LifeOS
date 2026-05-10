import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || 'file:./dev.db',
});

// Cast to `any` to avoid TypeScript errors when the generated client
// types are not yet available in the environment. At runtime this is
// the real PrismaClient instance.
export const prisma = (globalForPrisma.prisma ?? new PrismaClient({ adapter })) as any;

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}