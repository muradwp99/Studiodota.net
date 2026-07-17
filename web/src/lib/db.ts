import { PrismaClient } from "@prisma/client";

// Single PrismaClient across dev hot reloads (avoids connection exhaustion).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
