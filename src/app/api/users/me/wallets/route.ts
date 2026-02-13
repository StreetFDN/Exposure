// =============================================================================
// /api/users/me/wallets — Link and unlink wallets (GET, POST, DELETE)
// =============================================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { verifyMessage } from "viem";
import { prisma } from "@/lib/prisma";
import {
  apiResponse,
  apiError,
  handleApiError,
  requireAuth,
  validateBody,
} from "@/lib/utils/api";
import { walletAddressSchema } from "@/lib/utils/validation";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const linkWalletSchema = z.object({
  address: walletAddressSchema,
  chain: z.enum(["ETHEREUM", "BASE", "ARBITRUM"]),
  signature: z.string().min(1, "Signature is required"),
  message: z.string().min(1, "Message is required"),
});

const unlinkWalletSchema = z.object({
  walletId: z.string().uuid("Invalid wallet ID"),
});

// ---------------------------------------------------------------------------
// GET handler — List user's linked wallets
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);

    // Fetch the user's primary wallet + LinkedWallet records
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        walletAddress: true,
        wallets: {
          select: {
            id: true,
            address: true,
            chain: true,
            isPrimary: true,
            linkedAt: true,
          },
          orderBy: { isPrimary: "desc" },
        },
      },
    });

    if (!user) {
      return apiError("User not found", 404, "NOT_FOUND");
    }

    return apiResponse({
      primaryWallet: user.walletAddress,
      wallets: user.wallets,
      totalWallets: user.wallets.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// ---------------------------------------------------------------------------
// POST handler — Link a new wallet (with signature verification)
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const body = await validateBody(request, linkWalletSchema);

    // Verify the signature proves ownership of the wallet address
    const isValidSignature = await verifyMessage({
      address: body.address as `0x${string}`,
      message: body.message,
      signature: body.signature as `0x${string}`,
    });

    if (!isValidSignature) {
      return apiError(
        "Invalid signature. Could not verify wallet ownership.",
        400,
        "INVALID_SIGNATURE"
      );
    }

    // Verify the message contains the user's ID or primary wallet to prevent replay attacks
    const messageContainsUserId = body.message.includes(session.id);
    const messageContainsWallet = body.message
      .toLowerCase()
      .includes(session.walletAddress.toLowerCase());

    if (!messageContainsUserId && !messageContainsWallet) {
      return apiError(
        "Signature message must reference your account to prevent replay attacks",
        400,
        "INVALID_MESSAGE"
      );
    }

    // Check if wallet is already linked to any account
    const existingWallet = await prisma.linkedWallet.findUnique({
      where: { address: body.address },
    });

    if (existingWallet) {
      if (existingWallet.userId === session.id) {
        return apiError(
          "This wallet is already linked to your account",
          409,
          "ALREADY_LINKED"
        );
      }
      return apiError(
        "This wallet is already linked to another account",
        409,
        "CONFLICT"
      );
    }

    // Also check if the address matches another user's primary wallet
    const existingUser = await prisma.user.findUnique({
      where: { walletAddress: body.address },
    });

    if (existingUser) {
      return apiError(
        "This wallet address is already registered as a primary wallet on another account",
        409,
        "CONFLICT"
      );
    }

    // Create the linked wallet record
    const linkedWallet = await prisma.linkedWallet.create({
      data: {
        userId: session.id,
        address: body.address,
        chain: body.chain,
        isPrimary: false,
      },
      select: {
        id: true,
        address: true,
        chain: true,
        isPrimary: true,
        linkedAt: true,
      },
    });

    // Log the wallet linking event
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "WALLET_LINKED",
        resourceType: "LinkedWallet",
        resourceId: linkedWallet.id,
        metadata: {
          address: body.address,
          chain: body.chain,
        },
      },
    });

    return apiResponse({ wallet: linkedWallet }, 201);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return apiError(
          "This wallet address is already linked to an account",
          409,
          "CONFLICT"
        );
      }
    }
    return handleApiError(error);
  }
}

// ---------------------------------------------------------------------------
// DELETE handler — Unlink a wallet
// ---------------------------------------------------------------------------

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const body = await validateBody(request, unlinkWalletSchema);

    // Fetch the wallet to unlink
    const wallet = await prisma.linkedWallet.findUnique({
      where: { id: body.walletId },
    });

    if (!wallet) {
      return apiError("Wallet not found", 404, "NOT_FOUND");
    }

    // Ensure the wallet belongs to the requesting user
    if (wallet.userId !== session.id) {
      return apiError("You can only unlink your own wallets", 403, "FORBIDDEN");
    }

    // Cannot unlink the primary wallet
    if (wallet.isPrimary) {
      return apiError(
        "Cannot unlink your primary wallet. It is used for authentication.",
        400,
        "CANNOT_UNLINK_PRIMARY"
      );
    }

    // Must have at least 1 wallet remaining (the primary wallet in User table always exists,
    // but ensure at least one LinkedWallet record remains if they have them)
    const walletCount = await prisma.linkedWallet.count({
      where: { userId: session.id },
    });

    if (walletCount <= 1) {
      return apiError(
        "You must have at least one wallet linked to your account",
        400,
        "MINIMUM_WALLETS"
      );
    }

    // Delete the wallet
    await prisma.linkedWallet.delete({
      where: { id: body.walletId },
    });

    // Log the wallet unlinking event
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "WALLET_UNLINKED",
        resourceType: "LinkedWallet",
        resourceId: body.walletId,
        metadata: {
          address: wallet.address,
          chain: wallet.chain,
        },
      },
    });

    return apiResponse({
      message: "Wallet unlinked successfully",
      unlinkedWalletId: body.walletId,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
