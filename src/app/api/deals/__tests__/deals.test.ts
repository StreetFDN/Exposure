import { describe, it, expect, beforeEach } from "vitest";
import { prismaMock } from "@/test/mocks/prisma";
import { GET, POST } from "../route";
import { NextRequest } from "next/server";
import { createSessionCookie } from "@/lib/utils/api";

// =============================================================================
// Helpers
// =============================================================================

function makeGetRequest(params: Record<string, string> = {}) {
  const url = new URL("http://localhost:3000/api/deals");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new NextRequest(url);
}

function makePostRequest(
  body: Record<string, unknown>,
  cookie?: string
) {
  const request = new NextRequest("http://localhost:3000/api/deals", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: `exposure_session=${cookie}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return request;
}

function makeAdminCookie() {
  return createSessionCookie({
    id: "admin-123",
    walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
    role: "ADMIN",
    kycStatus: "APPROVED",
    tierLevel: "DIAMOND",
  });
}

const sampleDeal = {
  id: "deal-1",
  title: "Test Deal",
  slug: "test-deal",
  shortDescription: "A test deal",
  projectName: "TestProject",
  category: "DEFI",
  status: "OPEN",
  chain: "ETHEREUM",
  tokenPrice: "0.01",
  totalRaise: "1000000",
  totalRaised: 500000,
  hardCap: "1000000",
  softCap: "500000",
  contributorCount: 100,
  allocationMethod: "FCFS",
  minTierRequired: null,
  registrationOpenAt: null,
  contributionOpenAt: "2025-01-01T00:00:00.000Z",
  contributionCloseAt: "2025-02-01T00:00:00.000Z",
  featuredImageUrl: null,
  bannerImageUrl: null,
  isFeatured: false,
  requiresKyc: true,
  requiresAccreditation: false,
  distributionTokenSymbol: "TEST",
  raiseTokenSymbol: "USDC",
  description: "Full description",
  projectWebsite: "https://test.com",
  projectTwitter: null,
  projectDiscord: null,
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z",
};

// =============================================================================
// GET /api/deals
// =============================================================================

describe("GET /api/deals", () => {
  beforeEach(() => {
    prismaMock.deal.count.mockReset();
    prismaMock.deal.findMany.mockReset();
  });

  it("returns a paginated list of deals", async () => {
    prismaMock.deal.count.mockResolvedValue(1);
    prismaMock.deal.findMany.mockResolvedValue([sampleDeal]);

    const response = await GET(makeGetRequest());
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.deals).toHaveLength(1);
    expect(body.data.total).toBe(1);
    expect(body.data.page).toBe(1);
    expect(body.data.limit).toBe(20);
    expect(body.data.totalPages).toBe(1);
  });

  it("passes pagination params to Prisma", async () => {
    prismaMock.deal.count.mockResolvedValue(50);
    prismaMock.deal.findMany.mockResolvedValue([]);

    await GET(makeGetRequest({ page: "2", limit: "10" }));

    expect(prismaMock.deal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
      })
    );
  });

  it("filters by status", async () => {
    prismaMock.deal.count.mockResolvedValue(0);
    prismaMock.deal.findMany.mockResolvedValue([]);

    await GET(makeGetRequest({ status: "OPEN,FILLED" }));

    expect(prismaMock.deal.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { in: ["OPEN", "FILLED"] },
        }),
      })
    );
  });

  it("filters by category", async () => {
    prismaMock.deal.count.mockResolvedValue(0);
    prismaMock.deal.findMany.mockResolvedValue([]);

    await GET(makeGetRequest({ category: "DEFI" }));

    expect(prismaMock.deal.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          category: { in: ["DEFI"] },
        }),
      })
    );
  });

  it("filters by chain", async () => {
    prismaMock.deal.count.mockResolvedValue(0);
    prismaMock.deal.findMany.mockResolvedValue([]);

    await GET(makeGetRequest({ chain: "ETHEREUM,BASE" }));

    expect(prismaMock.deal.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          chain: { in: ["ETHEREUM", "BASE"] },
        }),
      })
    );
  });

  it("applies search filter to title and projectName", async () => {
    prismaMock.deal.count.mockResolvedValue(0);
    prismaMock.deal.findMany.mockResolvedValue([]);

    await GET(makeGetRequest({ search: "alpha" }));

    expect(prismaMock.deal.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { title: { contains: "alpha", mode: "insensitive" } },
            { projectName: { contains: "alpha", mode: "insensitive" } },
          ],
        }),
      })
    );
  });

  it("returns empty results gracefully", async () => {
    prismaMock.deal.count.mockResolvedValue(0);
    prismaMock.deal.findMany.mockResolvedValue([]);

    const response = await GET(makeGetRequest());
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.data.deals).toEqual([]);
    expect(body.data.total).toBe(0);
    expect(body.data.totalPages).toBe(0);
  });
});

// =============================================================================
// POST /api/deals
// =============================================================================

describe("POST /api/deals", () => {
  beforeEach(() => {
    prismaMock.deal.create.mockReset();
  });

  it("rejects unauthenticated requests with 401", async () => {
    const response = await POST(makePostRequest({ title: "Test" }));
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("rejects non-admin users with 403", async () => {
    const userCookie = createSessionCookie({
      id: "user-123",
      walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
      role: "USER",
      kycStatus: "APPROVED",
      tierLevel: "GOLD",
    });

    const request = new NextRequest("http://localhost:3000/api/deals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `exposure_session=${userCookie}`,
      },
      body: JSON.stringify({ title: "Test" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(403);

    const body = await response.json();
    expect(body.error.code).toBe("FORBIDDEN");
  });
});
