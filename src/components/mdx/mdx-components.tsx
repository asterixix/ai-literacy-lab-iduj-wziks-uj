import type { ComponentPropsWithoutRef } from "react";

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

/** Mapuje natywne elementy Markdown / GFM z sensownym layoutem (tabele, nagłówki komórek). */
export const mdxComponents = {
  table: Table,
  th: Th,
  td: Td,
};
