import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { getMaterialDocumentBySlug, getMaterialDocumentsIndex } from "@/lib/mdx";

export const dynamicParams = false;

export async function generateStaticParams() {
  const documents = await getMaterialDocumentsIndex();
  return documents.map((document) => ({ slug: document.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const document = await getMaterialDocumentBySlug(slug);
  if (!document) {
    return {
      title: "Materiał",
      description: "Szczegóły materiału edukacyjnego.",
    };
  }

  return {
    title: document.frontmatter.title,
    description: document.frontmatter.description,
  };
}

export default async function MaterialDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const document = await getMaterialDocumentBySlug(slug);
  if (!document) notFound();

  return (
    <div className="container-wide py-12">
      <PageViewTracker
        eventName="material_markdown_opened"
        data={{ slug, title: document.frontmatter.title }}
      />
      <Link href="/materialy" className="mb-6 inline-block text-sm text-muted-foreground hover:text-foreground">
        ← Wróć do materiałów
      </Link>

      <article className="rounded-3xl border border-border p-6 text-muted-foreground [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-black [&_h2]:text-foreground [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-foreground [&_p]:leading-relaxed">
        <header className="mb-8 border-b border-border pb-5">
          <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">
            {document.frontmatter.title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm">{document.frontmatter.description}</p>
          {document.frontmatter.formats?.length ? (
            <p className="mt-3 font-mono text-xs uppercase text-muted-foreground">
              {document.frontmatter.formats.join(" · ")}
            </p>
          ) : null}
        </header>
        {document.content}
      </article>
    </div>
  );
}
