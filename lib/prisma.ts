import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Supabase Transaction Pooler (Port 6543) for Vercel Serverless & Next.js Lambdas
const SUPABASE_TRANSACTION_POOLER_URL =
  'postgresql://postgres.uhqblcxuohbuirglzsga:m6gIgkeQRUmJvGxT@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1';

function resolveDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL;
  // If not configured in Vercel project settings or set to obsolete SQLite 'file:./dev.db'
  if (!envUrl || envUrl.startsWith('file:') || !envUrl.startsWith('postgres')) {
    return SUPABASE_TRANSACTION_POOLER_URL;
  }
  return envUrl;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: resolveDatabaseUrl(),
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
