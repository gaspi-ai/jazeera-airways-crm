import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getDatabaseUrl(): string {
  // If explicitly specified non-relative URL (e.g. Postgres, remote, etc.), use it
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('file:.')) {
    return process.env.DATABASE_URL;
  }

  // Resolve absolute paths for SQLite in serverless / local environments
  const prismaDb = path.join(process.cwd(), 'prisma', 'dev.db');
  const rootDb = path.join(process.cwd(), 'dev.db');

  if (fs.existsSync(prismaDb)) {
    return `file:${prismaDb}`;
  }
  if (fs.existsSync(rootDb)) {
    return `file:${rootDb}`;
  }

  return process.env.DATABASE_URL || `file:${prismaDb}`;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
