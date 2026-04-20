# AI Literacy Lab — platforma szkoleniowa

Szkielet platformy edukacyjnej dla projektu:

**AI Literacy Lab – Warsztaty kompetencyjne ze sztucznej inteligencji dla studentów UJ**  
WZiKS UJ · ID.UJ · 2026

## Stack

- Next.js 15 (App Router)
- TypeScript (strict)
- Tailwind CSS v4
- shadcn/ui
- Framer Motion v11
- MDX (`@next/mdx` + `next-mdx-remote`)
- pnpm

## Uruchomienie lokalne

```bash
pnpm install
pnpm dev
```

Aplikacja będzie dostępna pod `http://localhost:3000`.

## Struktura projektu

```text
src/
├── app/
│   ├── page.tsx
│   ├── program/
│   ├── materialy/
│   ├── harmonogram/
│   └── o-projekcie/
├── components/
│   ├── layout/
│   ├── sections/
│   └── ui/
├── content/
│   ├── modules/
│   └── materials/
├── lib/
│   ├── mdx.ts
│   ├── modules.ts
│   └── materials.ts
└── types/
```

## Dodawanie treści MDX

### Moduły programu

1. Dodaj plik do `src/content/modules/` w formacie:
   `NN-slug.mdx` (np. `07-nowy-modul.mdx`)
2. Uzupełnij frontmatter (`slug`, `number`, `title`, `duration`, `tags`, itd.).
3. Dodaj odpowiadający wpis do `src/lib/modules.ts`.

### Materiały OER

- Treść sekcji informacyjnej edytuj w `src/content/materials/index.mdx`.
- Karty materiałów są definiowane w `src/lib/materials.ts`.

## Jakość kodu

```bash
pnpm lint
pnpm typecheck
pnpm format
pnpm build
```

## Konfiguracja środowiska

Skopiuj `.env.local.example` do `.env.local` i podmień placeholdery:

- `NEXT_PUBLIC_REGISTRATION_URL`
- `NEXT_PUBLIC_GITHUB_URL`

## Licencja materiałów

Docelowo treści OER publikowane są na licencji **CC BY-SA 4.0**.
