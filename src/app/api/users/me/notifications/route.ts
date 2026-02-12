// =============================================================================
// /api/users/me/notifications — GET notifications, PATCH mark as read
// =============================================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  apiResponse,
  handleApiError,
  requireAuth,
  validateBody,
  parsePagination,
  ApiError,
} from "@/lib/utils/api";

// ---------------------------------------------------------------------------
// Mark as read schema
// ---------------------------------------------------------------------------

const markReadSchema = z.object({
  notificationIds: z.array(z.string().min(1)).min(1).max(100).optional(),
  markAllRead: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// GET handler — List notifications
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);

    // Parse filters
    const type = searchParams.get("type");
    const isReadParam = searchParams.get("isRead");

    // Build Prisma where clause
    const where: Prisma.NotificationWhereInput = {
      userId: user.id,
    };

    if (type) {
      const types = type.split(",");
      where.type = { in: types as Prisma.EnumNotificationTypeFilter["in"] };
    }

    if (isReadParam !== null) {
      where.isRead = isReadParam === "true";
    }

    // Execute queries in parallel
    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
        select: {
          id: true,
          userId: true,
          type: true,
          title: true,
          message: true,
          data: true,
          isRead: true,
          readAt: true,
          createdAt: true,
        },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId: user.id, isRead: false },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return apiResponse({
      notifications,
      unreadCount,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// ---------------------------------------------------------------------------
// PATCH handler — Mark notifications as read
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await validateBody(request, markReadSchema);

    if ("markAllRead" in body && body.markAllRead) {
      const result = await prisma.notification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true, readAt: new Date() },
      });

      return apiResponse({
        markedRead: result.count,
        message: "All notifications marked as read",
      });
    }

    if ("notificationIds" in body && body.notificationIds) {
      const result = await prisma.notification.updateMany({
        where: {
          id: { in: body.notificationIds },
          userId: user.id,
        },
        data: { isRead: true, readAt: new Date() },
      });

      return apiResponse({
        markedRead: result.count,
        notificationIds: body.notificationIds,
        message: `${result.count} notification(s) marked as read`,
      });
    }

    throw new ApiError("Must provide notificationIds or markAllRead: true", 400);
  } catch (error) {
    return handleApiError(error);
  }
}
