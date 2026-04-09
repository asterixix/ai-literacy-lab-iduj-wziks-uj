import fs from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";

import { createMdxComponents } from "@/components/mdx/mdx-components";
import { getModuleBySlug } from "@/lib/modules";
import { extractTocFromMdx } from "@/lib/toc";
import type { Module } from "@/types";

const contentRoot = path.join(process.cwd(), "src", "content");

const mdxCompileOptions = {
  parseFrontmatter: true,
  mdxOptions: {
    remarkPlugins: [remarkGfm],
  },
};

interface MaterialFrontmatter {
  title: string;
  description: string;
}

export interface MaterialDocumentFrontmatter extends MaterialFrontmatter {
  formats?: string[];
  category?: string;
  version?: string;
  lastUpdated?: string;
  author?: string;
  license?: string;
  tags?: string[];
}

export async function getModuleContent(slug: string): Promise<{
  frontmatter: Module;
  content: React.ReactNode;
  toc: ReturnType<typeof extractTocFromMdx>;
}> {
  const moduleMeta = getModuleBySlug(slug);
  const numberedName = moduleMeta
    ? `${String(moduleMeta.number).padStart(2, "0")}-${moduleMeta.slug}.mdx`
    : `${slug}.mdx`;
  const sourcePath = path.join(contentRoot, "modules", numberedName);
  const fallbackPath = path.join(contentRoot, "modules", `${slug}.mdx`);

  const file = await fs.readFile(sourcePath).catch(async () => fs.readFile(fallbackPath));
  const raw = file.toString("utf8");

  const { frontmatter, content } = await compileMDX<Module>({
    source: raw,
    options: mdxCompileOptions,
    components: createMdxComponents(),
  });

  return { frontmatter, content, toc: extractTocFromMdx(raw) };
}

export async function getMaterialOverviewContent(): Promise<{
  frontmatter: MaterialFrontmatter;
  content: React.ReactNode;
}> {
  const sourcePath = path.join(contentRoot, "materials", "index.mdx");
  const raw = await fs.readFile(sourcePath, "utf8");

  const { frontmatter, content } = await compileMDX<MaterialFrontmatter>({
    source: raw,
    options: mdxCompileOptions,
    components: createMdxComponents(),
  });

  return { frontmatter, content };
}

export async function getMaterialDocumentsIndex(): Promise<
  Array<{
    slug: string;
    frontmatter: MaterialDocumentFrontmatter;
  }>
> {
  const materialsDir = path.join(contentRoot, "materials");
  const fileNames = await fs.readdir(materialsDir);
  const contentFiles = fileNames
    .filter((fileName) => fileName.endsWith(".mdx") && fileName !== "index.mdx")
    .sort((a, b) => a.localeCompare(b));

  const documents = await Promise.all(contentFiles.map(async (fileName) => getMaterialDocumentIndexEntry(fileName)));

  return documents;
}

async function getMaterialDocumentIndexEntry(fileName: string): Promise<{
  slug: string;
  frontmatter: MaterialDocumentFrontmatter;
}> {
  const materialsDir = path.join(contentRoot, "materials");
  const sourcePath = path.join(materialsDir, fileName);
  const raw = await fs.readFile(sourcePath, "utf8");
  const parsed = matter(raw);

  return {
    slug: fileName.replace(/\.mdx$/, ""),
    frontmatter: parsed.data as MaterialDocumentFrontmatter,
  };
}

export async function getMaterialDocumentBySlug(slug: string): Promise<{
  slug: string;
  frontmatter: MaterialDocumentFrontmatter;
  content: React.ReactNode;
  toc: ReturnType<typeof extractTocFromMdx>;
} | null> {
  const sourcePath = path.join(contentRoot, "materials", `${slug}.mdx`);
  const raw = await fs.readFile(sourcePath, "utf8").catch(() => null);
  if (!raw) return null;

  const { frontmatter, content } = await compileMDX<MaterialDocumentFrontmatter>({
    source: raw,
    options: mdxCompileOptions,
    components: createMdxComponents(),
  });

  return { slug, frontmatter, content, toc: extractTocFromMdx(raw) };
}
