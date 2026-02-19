import type { ItemAttachmentEntry } from "@/lib/types/dnd";

type ItemAttachmentBaseKey =
  | "id"
  | "type"
  | "name"
  | "level"
  | "description";

type ItemAttachmentStructuredKey = Exclude<
  keyof ItemAttachmentEntry,
  ItemAttachmentBaseKey
>;

const ITEM_ATTACHMENT_STRUCTURED_TO_AI_PATCH_KEY: Record<
  ItemAttachmentStructuredKey,
  string
> = {
  school: "school",
  castingTime: "casting_time",
  range: "range",
  components: "components",
  materials: "materials",
  duration: "duration",
  concentration: "concentration",
  ritual: "ritual",
  save: "save",
  damage: "damage",
  actionType: "action_type",
  resourceCost: "resource_cost",
  requirements: "requirements",
  effect: "effect",
};

const ITEM_ATTACHMENT_EXTRA_AI_PATCH_KEYS = ["casting_time_note"] as const;

export const ITEM_ATTACHMENT_STRUCTURED_AI_KEYS = [
  ...Object.values(ITEM_ATTACHMENT_STRUCTURED_TO_AI_PATCH_KEY),
  ...ITEM_ATTACHMENT_EXTRA_AI_PATCH_KEYS,
] as const;

