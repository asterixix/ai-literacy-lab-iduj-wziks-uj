interface AvatarConfig {
  style: string;
  params?: Record<string, string>;
  seedSuffix?: string;
}

const AVATAR_CONFIG_BY_ITEM_ID: Record<string, AvatarConfig> = {
  "avatar-default": {
    style: "adventurer",
    params: { backgroundColor: "d6d3d1,e7e5e4" },
  },
  "avatar-scout": {
    style: "bottts-neutral",
    params: { backgroundColor: "cbd5e1,bfdbfe" },
    seedSuffix: "scout",
  },
  "avatar-neon-fox": {
    style: "lorelei-neutral",
    params: { backgroundColor: "fda4af,fb7185,fdba74" },
    seedSuffix: "fox",
  },
  "avatar-data-wizard": {
    style: "micah",
    params: { backgroundColor: "bae6fd,93c5fd" },
    seedSuffix: "wizard",
  },
  "avatar-cyber-samurai": {
    style: "avataaars-neutral",
    params: { backgroundColor: "a5b4fc,818cf8" },
    seedSuffix: "samurai",
  },
  "avatar-orbit-hacker": {
    style: "shapes",
    params: { backgroundColor: "67e8f9,22d3ee" },
    seedSuffix: "orbit",
  },
  "avatar-phoenix": {
    style: "fun-emoji",
    params: { backgroundColor: "fb923c,f97316,ef4444" },
    seedSuffix: "phoenix",
  },
  "avatar-quantum-owl": {
    style: "pixel-art",
    params: { backgroundColor: "c4b5fd,a78bfa" },
    seedSuffix: "owl",
  },
};

export function buildDiceBearAvatarUrl(seed: string, avatarItemId = "avatar-default"): string {
  const config =
    AVATAR_CONFIG_BY_ITEM_ID[avatarItemId] ?? AVATAR_CONFIG_BY_ITEM_ID["avatar-default"];
  const params = new URLSearchParams({
    seed: config.seedSuffix ? `${seed}-${config.seedSuffix}` : seed,
    ...(config.params ?? {}),
  });
  return `https://api.dicebear.com/9.x/${config.style}/svg?${params.toString()}`;
}
