export type ReviewRating = "again" | "hard" | "good" | "easy";

export type ReviewState = {
  unitId: number;
  repetitions: number;
  intervalDays: number;
  ease: number;
  lastReviewedAt: string | null;
  nextReviewAt: string;
};

const DEFAULT_INTERVALS = [0.04, 1, 3, 7, 14, 30];

export function reviewStorageKey(userId?: string) {
  return userId ? `lingodesk-review-v1:${userId}` : "lingodesk-review-v1";
}

export function readReviewStates(key: string): Record<number, ReviewState> {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "{}");
    if (!value || typeof value !== "object") return {};
    return value as Record<number, ReviewState>;
  } catch {
    return {};
  }
}

export function isReviewDue(state: ReviewState | undefined, now = Date.now()) {
  return !state || new Date(state.nextReviewAt).getTime() <= now;
}

export function createInitialReview(unitId: number): ReviewState {
  return {
    unitId,
    repetitions: 0,
    intervalDays: 0,
    ease: 2.5,
    lastReviewedAt: null,
    nextReviewAt: new Date().toISOString(),
  };
}

export function applyReview(state: ReviewState | undefined, unitId: number, rating: ReviewRating, now = new Date()): ReviewState {
  const previous = state ?? createInitialReview(unitId);
  let repetitions = previous.repetitions;
  let intervalDays = previous.intervalDays;
  let ease = previous.ease;

  if (rating === "again") {
    repetitions = 0;
    intervalDays = DEFAULT_INTERVALS[0];
    ease = Math.max(1.3, ease - 0.2);
  } else {
    repetitions += 1;
    if (rating === "hard") {
      intervalDays = Math.max(1, intervalDays ? intervalDays * 1.2 : 1);
      ease = Math.max(1.3, ease - 0.15);
    } else if (rating === "good") {
      intervalDays = DEFAULT_INTERVALS[Math.min(repetitions, DEFAULT_INTERVALS.length - 1)] ?? (intervalDays * ease || 3);
    } else {
      intervalDays = Math.max(4, intervalDays ? intervalDays * ease * 1.3 : 4);
      ease += 0.15;
    }
  }

  const nextReviewAt = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
  return {
    unitId,
    repetitions,
    intervalDays: Math.round(intervalDays * 100) / 100,
    ease: Math.round(ease * 100) / 100,
    lastReviewedAt: now.toISOString(),
    nextReviewAt: nextReviewAt.toISOString(),
  };
}

export function formatReviewDue(state: ReviewState | undefined, now = Date.now()) {
  if (isReviewDue(state, now)) return "Due now";
  const hours = Math.max(1, Math.round((new Date(state!.nextReviewAt).getTime() - now) / 3600000));
  if (hours < 24) return `In ${hours}h`;
  const days = Math.ceil(hours / 24);
  return `In ${days}d`;
}
