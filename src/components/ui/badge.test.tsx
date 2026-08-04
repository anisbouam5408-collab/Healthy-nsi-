import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Badge } from "./badge";

describe("Badge", () => {
  it("renders its label", () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("applies the semantic variant class", () => {
    render(<Badge variant="success">Verified</Badge>);
    expect(screen.getByText("Verified").className).toContain("text-success");
  });
});
