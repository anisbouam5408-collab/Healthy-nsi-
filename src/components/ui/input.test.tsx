import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Input } from "./input";
import { Label } from "./label";

describe("Input", () => {
  it("accepts typed input", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Label htmlFor="email">Email</Label>
        <Input id="email" />
      </>
    );

    const input = screen.getByLabelText("Email");
    await user.type(input, "hello@healthy-nsi.com");

    expect(input).toHaveValue("hello@healthy-nsi.com");
  });

  it("marks itself invalid via aria-invalid", () => {
    render(<Input aria-label="Weight" invalid />);
    expect(screen.getByLabelText("Weight")).toHaveAttribute("aria-invalid", "true");
  });

  it("is disableable", () => {
    render(<Input aria-label="Weight" disabled />);
    expect(screen.getByLabelText("Weight")).toBeDisabled();
  });
});
