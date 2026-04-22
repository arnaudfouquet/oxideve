import Link from "next/link";
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

type ClassNameProps = {
  className?: string;
};

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

type ContainerProps = ComponentPropsWithoutRef<"div"> & {
  as?: ElementType;
};

export function Container({ as: Component = "div", className, ...props }: ContainerProps) {
  return <Component className={cn("ui-container", className)} {...props} />;
}

type SectionProps = ComponentPropsWithoutRef<"section"> & {
  surface?: "default" | "muted" | "contrast";
};

export function Section({ className, surface = "default", ...props }: SectionProps) {
  return <section className={cn("ui-section", `ui-section-${surface}`, className)} {...props} />;
}

type TitleProps = {
  as?: "h1" | "h2" | "h3";
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  actions?: ReactNode;
  className?: string;
};

export function Title({ as = "h2", eyebrow, title, description, align = "left", actions, className }: TitleProps) {
  const Component = as;

  return (
    <div className={cn("ui-title-block", `ui-title-${align}`, className)}>
      <div>
        {eyebrow ? <span className="ui-eyebrow">{eyebrow}</span> : null}
        <Component className={cn("ui-title", as === "h1" && "ui-title-hero")}>{title}</Component>
        {description ? <p className="ui-text ui-text-muted ui-title-copy">{description}</p> : null}
      </div>
      {actions ? <div className="ui-title-actions">{actions}</div> : null}
    </div>
  );
}

type TextProps = ComponentPropsWithoutRef<"p"> & {
  tone?: "default" | "muted" | "inverse";
  size?: "sm" | "md" | "lg";
};

export function Text({ className, tone = "default", size = "md", ...props }: TextProps) {
  return <p className={cn("ui-text", `ui-text-${tone}`, `ui-text-${size}`, className)} {...props} />;
}

type ButtonBaseProps = ClassNameProps & {
  variant?: "primary" | "secondary" | "ghost";
  children: ReactNode;
};

type ButtonProps = ButtonBaseProps & ComponentPropsWithoutRef<"button">;

export function Button({ className, variant = "primary", type = "button", ...props }: ButtonProps) {
  return <button className={cn("ui-button", `ui-button-${variant}`, className)} type={type} {...props} />;
}

type ButtonLinkProps = ButtonBaseProps & {
  href: string;
};

export function ButtonLink({ className, variant = "primary", href, ...props }: ButtonLinkProps) {
  return <Link className={cn("ui-button", `ui-button-${variant}`, className)} href={href} {...props} />;
}

type CardProps = ComponentPropsWithoutRef<"article"> & {
  tone?: "default" | "highlight" | "dark";
};

export function Card({ className, tone = "default", ...props }: CardProps) {
  return <article className={cn("ui-card", `ui-card-${tone}`, className)} {...props} />;
}

type BadgeProps = ComponentPropsWithoutRef<"span"> & {
  tone?: "default" | "accent" | "soft";
};

export function Badge({ className, tone = "default", ...props }: BadgeProps) {
  return <span className={cn("ui-badge", `ui-badge-${tone}`, className)} {...props} />;
}

type InputProps = ComponentPropsWithoutRef<"input"> & {
  label?: string;
};

export function Input({ className, label, ...props }: InputProps) {
  const input = <input className={cn("ui-field", className)} {...props} />;

  if (!label) {
    return input;
  }

  return (
    <label className="ui-field-wrap">
      <span>{label}</span>
      {input}
    </label>
  );
}

type SelectProps = ComponentPropsWithoutRef<"select"> & {
  label?: string;
  children: ReactNode;
};

export function Select({ className, label, children, ...props }: SelectProps) {
  const select = (
    <select className={cn("ui-field", className)} {...props}>
      {children}
    </select>
  );

  if (!label) {
    return select;
  }

  return (
    <label className="ui-field-wrap">
      <span>{label}</span>
      {select}
    </label>
  );
}