// Temporary mock Prisma client to fix build issues
// TODO: Re-enable real Prisma client after fixing Windows permission issues

import "server-only";

// Mock Prisma client for build purposes
const mockPrisma = {
  userConversionUsage: {
    findUnique: async () => null,
    create: async () => ({}),
    update: async () => ({}),
  },
  conversionHistory: {
    findMany: async () => [],
    count: async () => 0,
    create: async () => ({}),
    update: async () => ({}),
  },
  chargeOrder: {
    findMany: async () => [],
    findUnique: async () => null,
    create: async () => ({}),
    update: async () => ({}),
  },
  chargeProduct: {
    findMany: async () => [],
    findUnique: async () => null,
  },
  userPaymentInfo: {
    findUnique: async () => null,
    create: async () => ({}),
    update: async () => ({}),
  },
};

export const prisma = mockPrisma as any;
