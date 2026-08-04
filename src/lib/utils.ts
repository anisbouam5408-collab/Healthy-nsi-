import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges class names, resolving Tailwind class conflicts sensibly
 * (e.g. `cn("p-2", condition && "p-4")` keeps only `p-4` when true).
 * Every component in the design system composes classes through this
 * helper instead of raw string concatenation.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
