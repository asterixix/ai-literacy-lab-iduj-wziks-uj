import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { MarkdownToc } from "@/components/mdx/MarkdownToc";
import { getModuleContent } from "@/lib/mdx";
import { getModuleBySlug, modules } from "@/lib/modules";

export const dynamicParams = false;

export function generateStaticParams() {
  return modules.map((module) => ({ slug: module.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const fallback = getModuleBySlug(slug);
  if (!fallback) {
    return {
      title: "Moduł",
      description: "Szczegóły modułu warsztatowego.",
    };
  }

  const { frontmatter } = await getModuleContent(slug).catch(() => ({ frontmatter: fallback }));
  const moduleItem = frontmatter ?? fallback;

  return {
    title: `Moduł ${moduleItem.number}: ${moduleItem.title}`,
    description: moduleItem.description,
  };
}

export default async function WarsztatyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const moduleItem = getModuleBySlug(slug);

  if (!moduleItem) {
    notFound();
  }

  const moduleContent = await getModuleContent(slug).catch(() => null);
  if (!moduleContent) {
    notFound();
  }

  const { frontmatter, content, toc } = moduleContent;
  const activeModule = frontmatter ?? moduleItem;

  return (
    <div className="container-wide py-12">
      <PageViewTracker
        eventName="workshop_markdown_opened"
        data={{ slug, title: activeModule.title, number: activeModule.number }}
      />
      <Link href="/warsztaty" className="mb-8 inline-block text-sm text-muted-foreground hover:text-foreground">
        ← Wróć do warsztatów
      </Link>

      <header className="space-y-3 border-b border-border pb-8">
        <p className="font-mono text-xs uppercase text-muted-foreground">
          Moduł {activeModule.number} · {activeModule.duration}
        </p>
        <h1 className="text-3xl font-black tracking-tight md:text-5xl">{activeModule.title}</h1>
        {activeModule.date ? <p className="text-sm text-muted-foreground">{activeModule.date}</p> : null}
        <div className="flex flex-wrap gap-2">
          {activeModule.tags.map((tag) => (
            <span key={tag} className="border border-border px-2 py-1 font-mono text-[11px] uppercase">
              {tag}
            </span>
          ))}
        </div>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_280px] lg:items-start">
        <article className="space-y-6 leading-relaxed text-muted-foreground [&_h2]:text-2xl [&_h2]:font-black [&_h2]:text-foreground [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-foreground [&_p]:max-w-3xl">
          {content}
        </article>

        <aside className="h-fit space-y-8 border border-border p-5 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
          <MarkdownToc items={toc} />
          <section className="space-y-3">
            <h2 className="text-sm font-black uppercase tracking-tight">Efekty uczenia się</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {activeModule.objectives.map((objective) => (
                <li key={objective}>• {objective}</li>
              ))}
            </ul>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-black uppercase tracking-tight">Narzędzia</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {activeModule.tools.map((tool) => (
                <li key={tool}>• {tool}</li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
