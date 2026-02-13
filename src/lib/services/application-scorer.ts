// =============================================================================
// Exposure -- Application Scorer Service
// Internal scoring system for evaluating project applications.
// =============================================================================

import type { ProjectApplication } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// =============================================================================
// Types
// =============================================================================

/** Input scores for each dimension (each 0-10). */
export interface ScoreInput {
  /** Team experience, track record, doxxed status. */
  teamScore: number;
  /** Product maturity, audit status, technical quality. */
  productScore: number;
  /** Token distribution, vesting fairness, supply management. */
  tokenomicsScore: number;
  /** Community size, engagement, existing users. */
  tractionScore: number;
}

/** Configurable weight distribution for composite scoring. */
export interface WeightConfig {
  /** Weight for team score (default: 0.30). */
  team: number;
  /** Weight for product score (default: 0.25). */
  product: number;
  /** Weight for tokenomics score (default: 0.25). */
  tokenomics: number;
  /** Weight for traction score (default: 0.20). */
  traction: number;
}

/** A scored application with all dimensions and the composite. */
export interface ScoredApplication {
  applicationId: string;
  scores: ScoreInput;
  weights: WeightConfig;
  compositeScore: number;
  application: ProjectApplication;
}

/** A due diligence note entry stored in the internal notes JSON. */
interface DueDiligenceNote {
  authorId: string;
  note: string;
  createdAt: string;
}

/** Structure of the parsed internal notes JSON. */
interface InternalNotesData {
  scores?: ScoreInput;
  weights?: WeightConfig;
  dueDiligenceNotes?: DueDiligenceNote[];
}

// =============================================================================
// Constants
// =============================================================================

/** Default weight configuration. */
const DEFAULT_WEIGHTS: WeightConfig = {
  team: 0.30,
  product: 0.25,
  tokenomics: 0.25,
  traction: 0.20,
};

/** Min and max bounds for individual score dimensions. */
const SCORE_MIN = 0;
const SCORE_MAX = 10;

// =============================================================================
// Validation Helpers
// =============================================================================

/**
 * Validate that a score value is within the allowed range [0, 10].
 */
function validateScore(name: string, value: number): void {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${name} must be a finite number.`);
  }
  if (value < SCORE_MIN || value > SCORE_MAX) {
    throw new Error(`${name} must be between ${SCORE_MIN} and ${SCORE_MAX}. Received: ${value}.`);
  }
}

/**
 * Validate all score dimensions.
 */
function validateScoreInput(scores: ScoreInput): void {
  validateScore("teamScore", scores.teamScore);
  validateScore("productScore", scores.productScore);
  validateScore("tokenomicsScore", scores.tokenomicsScore);
  validateScore("tractionScore", scores.tractionScore);
}

/**
 * Validate that weights sum to approximately 1.0.
 */
function validateWeights(weights: WeightConfig): void {
  const sum = weights.team + weights.product + weights.tokenomics + weights.traction;
  if (Math.abs(sum - 1.0) > 0.01) {
    throw new Error(
      `Weights must sum to 1.0. Current sum: ${sum.toFixed(4)}.`
    );
  }

  for (const [key, value] of Object.entries(weights)) {
    if (value < 0 || value > 1) {
      throw new Error(`Weight '${key}' must be between 0 and 1. Received: ${value}.`);
    }
  }
}

// =============================================================================
// Core Functions
// =============================================================================

/**
 * Calculate the weighted composite score from individual dimensions.
 *
 * @param scores - The four score dimensions (each 0-10).
 * @param weights - Optional custom weight configuration. Defaults to
 *   team 30%, product 25%, tokenomics 25%, traction 20%.
 * @returns A composite score between 0 and 10 (rounded to 2 decimal places).
 */
export function getCompositeScore(
  scores: ScoreInput,
  weights: WeightConfig = DEFAULT_WEIGHTS
): number {
  validateScoreInput(scores);
  validateWeights(weights);

  const composite =
    scores.teamScore * weights.team +
    scores.productScore * weights.product +
    scores.tokenomicsScore * weights.tokenomics +
    scores.tractionScore * weights.traction;

  return Math.round(composite * 100) / 100;
}

/**
 * Score a project application with the given dimensions.
 *
 * Updates the application's `internalScore` and stores dimension scores
 * in the `internalNotes` JSON field for audit purposes.
 *
 * @param applicationId - The UUID of the project application.
 * @param scores - The four score dimensions.
 * @param weights - Optional custom weight configuration.
 * @returns The scored application with composite score.
 */
export async function scoreApplication(
  applicationId: string,
  scores: ScoreInput,
  weights: WeightConfig = DEFAULT_WEIGHTS
): Promise<ScoredApplication> {
  validateScoreInput(scores);
  validateWeights(weights);

  const application = await prisma.projectApplication.findUnique({
    where: { id: applicationId },
  });

  if (!application) {
    throw new Error(`Project application not found: ${applicationId}`);
  }

  const compositeScore = getCompositeScore(scores, weights);

  // Parse existing internal notes to preserve due diligence notes
  const existingNotes = parseInternalNotes(application.internalNotes);

  const updatedNotesData: InternalNotesData = {
    ...existingNotes,
    scores,
    weights,
  };

  const updatedApplication = await prisma.projectApplication.update({
    where: { id: applicationId },
    data: {
      internalScore: compositeScore,
      internalNotes: JSON.stringify(updatedNotesData),
    },
  });

  return {
    applicationId,
    scores,
    weights,
    compositeScore,
    application: updatedApplication,
  };
}

/**
 * Update specific score dimensions for an existing scored application.
 *
 * Merges the provided scores with existing scores and recalculates
 * the composite.
 *
 * @param applicationId - The UUID of the project application.
 * @param scores - Partial score dimensions to update.
 * @param weights - Optional custom weight configuration.
 * @returns The updated scored application.
 */
export async function updateScores(
  applicationId: string,
  scores: Partial<ScoreInput>,
  weights?: WeightConfig
): Promise<ScoredApplication> {
  const application = await prisma.projectApplication.findUnique({
    where: { id: applicationId },
  });

  if (!application) {
    throw new Error(`Project application not found: ${applicationId}`);
  }

  const existingNotes = parseInternalNotes(application.internalNotes);
  const existingScores = existingNotes.scores;

  if (!existingScores) {
    throw new Error(
      `Application ${applicationId} has not been scored yet. Use scoreApplication() first.`
    );
  }

  // Merge existing scores with new partial scores
  const mergedScores: ScoreInput = {
    teamScore: scores.teamScore ?? existingScores.teamScore,
    productScore: scores.productScore ?? existingScores.productScore,
    tokenomicsScore: scores.tokenomicsScore ?? existingScores.tokenomicsScore,
    tractionScore: scores.tractionScore ?? existingScores.tractionScore,
  };

  const effectiveWeights = weights ?? existingNotes.weights ?? DEFAULT_WEIGHTS;

  return scoreApplication(applicationId, mergedScores, effectiveWeights);
}

/**
 * Add a due diligence note to a project application.
 *
 * Notes are appended to the `internalNotes` JSON field and include
 * the author ID and timestamp for audit trail purposes.
 *
 * @param applicationId - The UUID of the project application.
 * @param note - The due diligence note text.
 * @param authorId - The UUID of the user writing the note.
 */
export async function addDueDiligenceNote(
  applicationId: string,
  note: string,
  authorId: string
): Promise<void> {
  if (!note.trim()) {
    throw new Error("Due diligence note cannot be empty.");
  }

  const application = await prisma.projectApplication.findUnique({
    where: { id: applicationId },
  });

  if (!application) {
    throw new Error(`Project application not found: ${applicationId}`);
  }

  const existingNotes = parseInternalNotes(application.internalNotes);

  const newNote: DueDiligenceNote = {
    authorId,
    note: note.trim(),
    createdAt: new Date().toISOString(),
  };

  const dueDiligenceNotes = existingNotes.dueDiligenceNotes ?? [];
  dueDiligenceNotes.push(newNote);

  const updatedNotesData: InternalNotesData = {
    ...existingNotes,
    dueDiligenceNotes,
  };

  await prisma.projectApplication.update({
    where: { id: applicationId },
    data: {
      internalNotes: JSON.stringify(updatedNotesData),
    },
  });

  // Log the note addition for audit purposes
  await prisma.auditLog.create({
    data: {
      userId: authorId,
      action: "APPLICATION_DD_NOTE_ADDED",
      resourceType: "ProjectApplication",
      resourceId: applicationId,
      metadata: {
        noteLength: note.trim().length,
        totalNotes: dueDiligenceNotes.length,
      },
    },
  });
}

/**
 * Retrieve the current scores and notes for an application.
 *
 * @param applicationId - The UUID of the project application.
 * @returns The scored application data, or null if not yet scored.
 */
export async function getApplicationScores(
  applicationId: string
): Promise<ScoredApplication | null> {
  const application = await prisma.projectApplication.findUnique({
    where: { id: applicationId },
  });

  if (!application) {
    throw new Error(`Project application not found: ${applicationId}`);
  }

  const notesData = parseInternalNotes(application.internalNotes);

  if (!notesData.scores) {
    return null;
  }

  const weights = notesData.weights ?? DEFAULT_WEIGHTS;
  const compositeScore = getCompositeScore(notesData.scores, weights);

  return {
    applicationId,
    scores: notesData.scores,
    weights,
    compositeScore,
    application,
  };
}

// =============================================================================
// Internal Helpers
// =============================================================================

/**
 * Safely parse the internalNotes field which may be a JSON string,
 * a plain text string, or null.
 */
function parseInternalNotes(raw: string | null): InternalNotesData {
  if (!raw) {
    return {};
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null) {
      return parsed as InternalNotesData;
    }
    return {};
  } catch {
    // If existing notes are plain text, preserve them as a legacy note
    return {
      dueDiligenceNotes: [
        {
          authorId: "system",
          note: raw,
          createdAt: new Date().toISOString(),
        },
      ],
    };
  }
}

/**
 * Get the default weight configuration.
 */
export function getDefaultWeights(): WeightConfig {
  return { ...DEFAULT_WEIGHTS };
}
