import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

let databaseAvailable = false;
let databaseLastError: string | null = null;

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export async function connectDatabase() {
  try {
    await prisma.$connect();
    databaseAvailable = true;
    databaseLastError = null;
    console.log('✅ PostgreSQL connected successfully via Prisma');
    return true;
  } catch (error: any) {
    databaseAvailable = false;
    databaseLastError = error.message;
    console.error('❌ PostgreSQL connection error:', error.message);
    console.error('Database connection failed. Ensure PostgreSQL container is running.');
    throw error;
  }
}

export function isDatabaseAvailable() {
  return databaseAvailable;
}

export function markDatabaseUnavailable(error: unknown) {
  databaseAvailable = false;
  databaseLastError = error instanceof Error ? error.message : String(error);
}

export function getPersistenceStatus() {
  if (databaseAvailable) return { mode: 'live' as const, label: 'Live database', durable: true, detail: 'Changes are stored in PostgreSQL.' };
  return { mode: 'degraded' as const, label: 'Database offline', durable: false, detail: databaseLastError || 'PostgreSQL connection failed.' };
}
