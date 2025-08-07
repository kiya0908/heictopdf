// Conditional Prisma client - use real client in production, mock for build
import "server-only";

// Global type declaration must be at top level
declare global {
  // eslint-disable-next-line no-var
  var cachedPrisma: any;
}

let prisma: any;

// Check if we should use real Prisma client or mock
const isVercelBuild = process.env.VERCEL === '1' && process.env.VERCEL_ENV === undefined;
const hasDatabase = process.env.DATABASE_URL && process.env.DATABASE_URL.length > 0;
const shouldUseMock = isVercelBuild || !hasDatabase;

if (shouldUseMock) {
  // Use mock Prisma client for Vercel build or when no database
  console.log("Using mock Prisma client for build environment");
  prisma = createMockPrisma();
} else {
  // Use real Prisma client when database is available
  try {
    const { PrismaClient } = require("@prisma/client");

    if (process.env.NODE_ENV === "production") {
      prisma = new PrismaClient();
    } else {
      if (!global.cachedPrisma) {
        global.cachedPrisma = new PrismaClient();
      }
      prisma = global.cachedPrisma;
    }
    console.log("Using real Prisma client");
  } catch (error) {
    console.warn("Failed to initialize Prisma client, using mock:", error);
    prisma = createMockPrisma();
  }
}

function createMockPrisma() {
  return {
    userConversionUsage: {
      findUnique: async () => ({
        id: 1,
        userId: "mock-user",
        dailyConversionCount: 0,
        lastConversionDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      create: async (data: any) => ({ id: 1, ...data }),
      update: async (data: any) => ({ id: 1, ...data }),
      upsert: async (data: any) => ({ id: 1, ...data }),
    },
    conversionHistory: {
      findMany: async () => [],
      count: async () => 0,
      create: async (data: any) => ({ 
        id: 1, 
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      update: async (data: any) => ({ id: 1, ...data }),
      findFirst: async () => null,
      findUnique: async () => null,
    },
    chargeOrder: {
      findMany: async () => [],
      findUnique: async () => null,
      findFirst: async () => null,
      create: async (data: any) => ({ 
        id: 1, 
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      update: async (data: any) => ({ id: 1, ...data }),
    },
    chargeProduct: {
      findMany: async () => [],
      findUnique: async () => null,
      findFirst: async () => null,
    },
    userPaymentInfo: {
      findUnique: async () => null,
      findFirst: async () => null,
      create: async (data: any) => ({ id: 1, ...data }),
      update: async (data: any) => ({ id: 1, ...data }),
      upsert: async (data: any) => ({ id: 1, ...data }),
    },
  };
}

export { prisma };
