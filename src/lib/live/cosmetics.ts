import { getUnlockItem } from "@/lib/live/catalog";

const THEME_CLASS_MAP: Record<string, string> = {
  "theme-default": "live-theme-default",
  "theme-matrix": "live-theme-matrix",
  "theme-sunrise": "live-theme-sunrise",
  "theme-arctic": "live-theme-arctic",
  "theme-noir": "live-theme-noir",
  "theme-cyber": "live-theme-cyber",
  "theme-solar-flare": "live-theme-solar-flare",
  "theme-ocean-core": "live-theme-ocean-core",
  "theme-auric": "live-theme-auric",
  "theme-diamond": "live-theme-diamond",
};

const FONT_CLASS_MAP: Record<string, string> = {
  "font-default": "live-font-default",
  "font-tech": "live-font-tech",
  "font-neo": "live-font-neo",
  "font-editorial": "live-font-editorial",
  "font-pixel": "live-font-pixel",
  "font-ink": "live-font-ink",
  "font-vector": "live-font-vector",
};

const FRAME_CLASS_MAP: Record<string, string> = {
  "frame-none": "live-frame-none",
  "frame-neon": "live-frame-neon",
  "frame-data": "live-frame-data",
  "frame-crown": "live-frame-crown",
  "frame-holo": "live-frame-holo",
  "frame-legend": "live-frame-legend",
};

const AVATAR_AURA_CLASS_BY_RARITY: Record<string, string> = {
  common: "live-avatar-aura-common",
  rare: "live-avatar-aura-rare",
  epic: "live-avatar-aura-epic",
  legendary: "live-avatar-aura-legendary",
};

export function getLiveThemeClass(themeId?: string): string {
  return THEME_CLASS_MAP[themeId ?? ""] ?? THEME_CLASS_MAP["theme-default"];
}

export function getLiveFontClass(fontId?: string): string {
  return FONT_CLASS_MAP[fontId ?? ""] ?? FONT_CLASS_MAP["font-default"];
}

export function getLiveFrameClass(frameId?: string): string {
  return FRAME_CLASS_MAP[frameId ?? ""] ?? FRAME_CLASS_MAP["frame-none"];
}

export function getLiveAvatarAuraClass(avatarId?: string): string {
  const item = avatarId ? getUnlockItem(avatarId) : undefined;
  if (!item || item.category !== "avatar") {
    return AVATAR_AURA_CLASS_BY_RARITY.common;
  }
  return AVATAR_AURA_CLASS_BY_RARITY[item.rarity] ?? AVATAR_AURA_CLASS_BY_RARITY.common;
}
