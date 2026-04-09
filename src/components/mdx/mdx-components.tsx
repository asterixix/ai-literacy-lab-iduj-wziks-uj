import { isValidElement } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { AiToolLauncher } from "@/components/mdx/AiToolLauncher";
import { createHeadingSlugger } from "@/lib/toc";
import { cn } from "@/lib/utils";

function Table({ className, children, ...props }: ComponentPropsWithoutRef<"table">) {
  return (
    <div className="my-6 w-full max-w-full overflow-x-auto">
      <table
        className={cn("w-full border-collapse border border-border text-left text-sm", className)}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

function Th({ className, ...props }: ComponentPropsWithoutRef<"th">) {
  return (
    <th
      className={cn(
        "border border-border bg-muted px-3 py-2 text-xs font-semibold uppercase tracking-wide text-foreground",
        className,
      )}
      {...props}
    />
  );
}

function Td({ className, ...props }: ComponentPropsWithoutRef<"td">) {
  return <td className={cn("border border-border px-3 py-2 align-top", className)} {...props} />;
}

function getNodeText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map((child) => getNodeText(child)).join("");
  }

  if (isValidElement<{ children?: ReactNode }>(node)) {
    return getNodeText(node.props.children ?? "");
  }

  return "";
}

function H2({ children, className, id, slugify, ...props }: ComponentPropsWithoutRef<"h2"> & {
  slugify: (text: string) => string;
}) {
  const text = getNodeText(children).trim();
  const resolvedId = id ?? (text ? slugify(text) : undefined);

  return (
    <h2 id={resolvedId} className={cn("scroll-mt-28", className)} {...props}>
      {children}
    </h2>
  );
}

function H3({ children, className, id, slugify, ...props }: ComponentPropsWithoutRef<"h3"> & {
  slugify: (text: string) => string;
}) {
  const text = getNodeText(children).trim();
  const resolvedId = id ?? (text ? slugify(text) : undefined);

  return (
    <h3 id={resolvedId} className={cn("scroll-mt-28", className)} {...props}>
      {children}
    </h3>
  );
}

export function createMdxComponents() {
  const slugify = createHeadingSlugger();

  return {
    AiToolLauncher,
    table: Table,
    th: Th,
    td: Td,
    h2: (props: ComponentPropsWithoutRef<"h2">) => <H2 slugify={slugify} {...props} />,
    h3: (props: ComponentPropsWithoutRef<"h3">) => <H3 slugify={slugify} {...props} />,
  };
}
