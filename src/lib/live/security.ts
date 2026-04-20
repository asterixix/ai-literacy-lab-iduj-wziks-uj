import { createHash, randomBytes } from "node:crypto";

import { nanoid } from "nanoid";

const ADJECTIVES = [
  "sprytny",
  "odwazny",
  "bystry",
  "zwinny",
  "bystra",
  "kreatywny",
  "cierpliwy",
  "dociekliwy",
  "szybki",
  "spokojny",
  "analityczny",
  "ambitny",
  "pomyslowy",
  "wytrwaly",
  "zdeterminowany",
];

const WORKSHOP_TRAITS = [
  "promptowy",
  "neuronowy",
  "algorytmiczny",
  "iteracyjny",
  "metodyczny",
  "kontekstowy",
  "krytyczny",
  "tworczy",
  "precyzyjny",
  "syntetyczny",
  "eksperymentalny",
  "warsztatowy",
];

const WORKSHOP_ROLES = [
  "badacz",
  "mentor",
  "koder",
  "trener",
  "architekt",
  "analityk",
  "strateg",
  "tester",
  "nawigator",
  "projektant",
  "operator",
  "facylitator",
];

const WORKSHOP_DOMAINS = [
  "promptow",
  "modeli",
  "agentow",
  "danych",
  "tokenow",
  "workflow",
  "eksperymentow",
  "automatyzacji",
  "prototypow",
  "analiz",
  "narzedzi",
  "warsztatu",
];

const ANIMALS = [
  "lis",
  "sowa",
  "wilk",
  "kot",
  "rys",
  "orzel",
  "jezyk",
  "borsuk",
  "zubr",
  "gepard",
  "kruk",
  "delfin",
  "pingwin",
  "fenek",
  "lemur",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateParticipantId(): string {
  return `lab-${nanoid(10)}`;
}

function randomSuffix(): string {
  return Math.floor(100 + Math.random() * 900).toString();
}

export function generateNickname(): string {
  if (Math.random() < 0.5) {
    return `${pick(WORKSHOP_TRAITS)}-${pick(WORKSHOP_ROLES)}-${randomSuffix()}`;
  }

  return `${pick(ADJECTIVES)}-${pick(WORKSHOP_DOMAINS)}-${randomSuffix()}`;
}

export function generateFavoriteAnimal(): string {
  return pick(ANIMALS);
}

export function generateAvatarSeed(): string {
  return nanoid(12);
}

export { buildDiceBearAvatarUrl } from "./avatar";

export function generateReadablePassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let value = "";
  for (let i = 0; i < 14; i += 1) {
    value += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return value;
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashForStreamId(input: string): string {
  return createHash("sha256").update(input).digest("hex").slice(0, 16);
}
