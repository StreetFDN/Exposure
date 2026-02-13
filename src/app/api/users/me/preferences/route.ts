// =============================================================================
// /api/users/me/preferences — Notification preferences (GET, PUT)
// =============================================================================
//
// The User model does not have dedicated preference columns.
// We store user preferences as JSON in PlatformConfig with a user-scoped key:
//   key = "user_preferences:{userId}"
// This avoids schema migrations while providing full flexibility.
// =============================================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  apiResponse,
  handleApiError,
  requireAuth,
  validateBody,
} from "@/lib/utils/api";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const preferencesSchema = z.object({
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  dealAlerts: z.boolean(),
  vestingAlerts: z.boolean(),
  accountAlerts: z.boolean(),
  marketingEmails: z.boolean(),
  quietHoursEnabled: z.boolean(),
  quietHoursStart: z
    .string()
    .regex(timeRegex, "Must be in HH:mm format (e.g. 22:00)")
    .optional()
    .default("22:00"),
  quietHoursEnd: z
    .string()
    .regex(timeRegex, "Must be in HH:mm format (e.g. 08:00)")
    .optional()
    .default("08:00"),
  digestMode: z.enum(["immediate", "daily", "weekly"]),
});

type UserPreferences = z.infer<typeof preferencesSchema>;

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_PREFERENCES: UserPreferences = {
  emailNotifications: true,
  pushNotifications: true,
  dealAlerts: true,
  vestingAlerts: true,
  accountAlerts: true,
  marketingEmails: false,
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "08:00",
  digestMode: "immediate",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function preferencesKey(userId: string): string {
  return `user_preferences:${userId}`;
}

async function loadPreferences(userId: string): Promise<UserPreferences> {
  const record = await prisma.platformConfig.findUnique({
    where: { key: preferencesKey(userId) },
  });

  if (!record) {
    return { ...DEFAULT_PREFERENCES };
  }

  try {
    const stored = JSON.parse(record.value) as Partial<UserPreferences>;
    // Merge with defaults so that newly added preference fields always have values
    return { ...DEFAULT_PREFERENCES, ...stored };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

// ---------------------------------------------------------------------------
// GET handler — Return current notification preferences
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const preferences = await loadPreferences(session.id);

    return apiResponse({ preferences });
  } catch (error) {
    return handleApiError(error);
  }
}

// ---------------------------------------------------------------------------
// PUT handler — Update notification preferences
// ---------------------------------------------------------------------------

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const body = await validateBody(request, preferencesSchema);

    // Upsert the preferences into PlatformConfig
    const key = preferencesKey(session.id);

    await prisma.platformConfig.upsert({
      where: { key },
      update: {
        value: JSON.stringify(body),
        description: `Notification preferences for user ${session.id}`,
        updatedBy: session.id,
      },
      create: {
        key,
        value: JSON.stringify(body),
        description: `Notification preferences for user ${session.id}`,
        updatedBy: session.id,
      },
    });

    // Log the preference change
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "PREFERENCES_UPDATED",
        resourceType: "UserPreferences",
        resourceId: session.id,
        metadata: {
          digestMode: body.digestMode,
          quietHoursEnabled: body.quietHoursEnabled,
          emailNotifications: body.emailNotifications,
          pushNotifications: body.pushNotifications,
        },
      },
    });

    return apiResponse({
      preferences: body,
      message: "Notification preferences updated successfully",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
