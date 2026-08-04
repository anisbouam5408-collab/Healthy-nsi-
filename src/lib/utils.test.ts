import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  it("joins simple class names", () => {
    expect(cn("p-2", "text-sm")).toBe("p-2 text-sm");
  });

  it("drops falsy values", () => {
    expect(cn("p-2", false && "hidden", undefined, "text-sm")).toBe("p-2 text-sm");
  });

  it("resolves conflicting Tailwind utilities in favor of the last one", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("lets an explicit override win over a conditional default", () => {
    const isDestructive = true;
    expect(cn("bg-primary", isDestructive && "bg-destructive")).toBe("bg-destructive");
  });
});
