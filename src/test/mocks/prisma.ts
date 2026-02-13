import { vi } from "vitest";

export const prismaMock = {
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
    count: vi.fn(),
  },
  deal: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
  },
  contribution: {
    findMany: vi.fn(),
    create: vi.fn(),
    aggregate: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn(),
  },
  notification: {
    findMany: vi.fn(),
    count: vi.fn(),
    updateMany: vi.fn(),
  },
  stakingPosition: {
    findMany: vi.fn(),
    create: vi.fn(),
    aggregate: vi.fn(),
  },
  investmentGroup: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    count: vi.fn(),
  },
  $transaction: vi.fn((fn: (prisma: typeof prismaMock) => unknown) =>
    fn(prismaMock)
  ),
  $queryRaw: vi.fn(),
};

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
