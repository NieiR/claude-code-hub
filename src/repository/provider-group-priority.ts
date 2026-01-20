"use server";

import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { providerGroupPriorities } from "@/drizzle/schema";
import { logger } from "@/lib/logger";
import type { ProviderPriorityOverrides } from "@/types/provider";

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

interface OverrideRow {
  providerId: number;
  groupTag: string;
  priority: number;
}

function normalizePriorityOverrides(
  overrides: ProviderPriorityOverrides | null | undefined,
  context?: { providerId?: number; source?: string }
): ProviderPriorityOverrides {
  if (!overrides || typeof overrides !== "object") {
    return {};
  }

  const normalized: ProviderPriorityOverrides = Object.create(null);

  const dangerousKeys = ["__proto__", "constructor", "prototype"];

  for (const [groupTag, priority] of Object.entries(overrides)) {
    const trimmed = groupTag.trim();

    if (!trimmed || trimmed.length > 50) {
      logger.warn("ProviderGroupPriority: invalid group tag ignored", {
        providerId: context?.providerId,
        groupTag: trimmed,
        reason: !trimmed ? "empty" : "too long",
        source: context?.source,
      });
      continue;
    }

    if (dangerousKeys.includes(trimmed)) {
      logger.warn("ProviderGroupPriority: dangerous key rejected", {
        providerId: context?.providerId,
        groupTag: trimmed,
        source: context?.source,
      });
      continue;
    }

    const parsed = Number(priority);
    if (!Number.isFinite(parsed) || parsed < 0) {
      logger.warn("ProviderGroupPriority: invalid priority ignored", {
        providerId: context?.providerId,
        groupTag: trimmed,
        value: priority,
        source: context?.source,
      });
      continue;
    }

    normalized[trimmed] = Math.trunc(parsed);
  }

  return normalized;
}

function buildOverrideRows(
  providerId: number,
  overrides: ProviderPriorityOverrides
): OverrideRow[] {
  return Object.entries(overrides).map(([groupTag, priority]) => ({
    providerId,
    groupTag,
    priority,
  }));
}

export async function findProviderGroupPriorityMap(
  providerIds: number[]
): Promise<Map<number, ProviderPriorityOverrides>> {
  if (providerIds.length === 0) {
    return new Map();
  }

  const rows = await db
    .select({
      providerId: providerGroupPriorities.providerId,
      groupTag: providerGroupPriorities.groupTag,
      priority: providerGroupPriorities.priority,
    })
    .from(providerGroupPriorities)
    .where(inArray(providerGroupPriorities.providerId, providerIds));

  const map = new Map<number, ProviderPriorityOverrides>();
  for (const row of rows) {
    const existing = map.get(row.providerId) ?? {};
    existing[row.groupTag] = row.priority;
    map.set(row.providerId, existing);
  }

  return map;
}

export async function replaceProviderGroupPriorities(
  tx: DbTransaction,
  providerId: number,
  overrides: ProviderPriorityOverrides | null | undefined,
  context?: { source?: string }
): Promise<ProviderPriorityOverrides> {
  const normalized = normalizePriorityOverrides(overrides, {
    providerId,
    source: context?.source,
  });

  await tx
    .delete(providerGroupPriorities)
    .where(eq(providerGroupPriorities.providerId, providerId));

  const rows = buildOverrideRows(providerId, normalized);
  if (rows.length > 0) {
    await tx.insert(providerGroupPriorities).values(rows);
  }

  logger.debug("ProviderGroupPriority: overrides replaced", {
    providerId,
    count: rows.length,
    source: context?.source,
  });

  return normalized;
}
