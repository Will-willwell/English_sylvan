import { supabase } from "./supabase";

export type ActivityType =
  | "login"
  | "unit_opened"
  | "practice_started"
  | "practice_completed"
  | "dialogue_started"
  | "dialogue_completed"
  | "progress_updated";

export async function recordActivity(input: {
  userId: string;
  activityType: ActivityType;
  unitId?: number;
  metadata?: Record<string, unknown>;
}) {
  if (!supabase) return;

  const { error } = await supabase.from("user_activity").insert({
    user_id: input.userId,
    unit_id: input.unitId ?? null,
    activity_type: input.activityType,
    metadata: input.metadata ?? {},
  });

  if (error) console.warn("Activity could not be saved:", error.message);
}
