"use client";

import { track } from "@vercel/analytics";
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { Children, isValidElement, useMemo, type ReactNode } from "react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils"

type ButtonClickData = {
  label: string;
  pathname: string;
  variant: string;
  size: string;
};

function extractButtonLabel(children: ReactNode): string | null {
  const parts: string[] = [];

  Children.forEach(children, (child) => {
    if (typeof child === "string" || typeof child === "number") {
      parts.push(String(child));
      return;
    }

    if (isValidElement<{ children?: ReactNode }>(child)) {
      const nested = extractButtonLabel(child.props.children);
      if (nested) {
        parts.push(nested);
      }
    }
  });

  const label = parts.join(" ").replace(/\s+/g, " ").trim();
  return label || null;
}

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-sm border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-sm px-2 text-xs in-data-[slot=button-group]:rounded-sm has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-sm px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-sm has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-sm in-data-[slot=button-group]:rounded-sm [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-sm in-data-[slot=button-group]:rounded-sm",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  children,
  onClick,
  title,
  "aria-label": ariaLabel,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  const pathname = usePathname();
  const label: string = useMemo(
    () => ariaLabel ?? title ?? extractButtonLabel(children) ?? "unknown",
    [ariaLabel, children, title],
  );

  const handleClick: typeof onClick = (event) => {
    track("ui_button_clicked", {
      label,
      pathname,
      variant: variant ?? "default",
      size: size ?? "default",
    } satisfies ButtonClickData);

    onClick?.(event);
  };

  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      onClick={handleClick}
      title={title}
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }
