import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * Temporary placeholder root route.
 *
 * The real marketing/landing page is its own future module. This exists
 * so `/` isn't the Next.js starter boilerplate while Module 0 is being
 * reviewed, and links to the style guide used for that review.
 */
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-primary text-sm font-medium">Healthy NSI</p>
      <h1 className="max-w-lg text-3xl font-semibold tracking-tight text-balance">
        The operating system for the modern nutrition practice.
      </h1>
      <p className="text-muted-foreground max-w-md text-sm">
        Foundation module — design system and tooling. Feature modules land next, one at a time.
      </p>
      <Button asChild>
        <Link href="/style-guide">View style guide</Link>
      </Button>
    </main>
  );
}
