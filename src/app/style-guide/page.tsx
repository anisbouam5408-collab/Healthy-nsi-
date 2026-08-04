import type { Metadata } from "next";
import { Mail, Plus, Trash2 } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Style Guide",
  description: "Internal visual QA reference for the design system foundation.",
};

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function Swatch({ name, className }: { name: string; className: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className={`border-border h-14 w-full rounded-md border ${className}`} />
      <span className="text-muted-foreground text-xs">{name}</span>
    </div>
  );
}

export default function StyleGuidePage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-14 px-6 py-16">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-primary text-sm font-medium">Healthy NSI</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Design System — Style Guide
          </h1>
          <p className="text-muted-foreground mt-2 max-w-xl text-sm">
            Internal reference for the foundation primitives. Every component here is composed from
            design tokens defined in{" "}
            <code className="bg-muted rounded px-1 py-0.5 text-xs">globals.css</code> — nothing on
            this page is a one-off style.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <Section
        title="Color"
        description="Brand ramp, neutrals, and semantic colors, driven entirely by CSS variables."
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-6">
          <Swatch name="brand-500 (accent)" className="bg-brand-500" />
          <Swatch name="primary" className="bg-primary" />
          <Swatch name="primary-subtle" className="bg-primary-subtle" />
          <Swatch name="success" className="bg-success" />
          <Swatch name="warning" className="bg-warning" />
          <Swatch name="error" className="bg-error" />
          <Swatch name="info" className="bg-info" />
          <Swatch name="muted" className="bg-muted" />
          <Swatch name="card" className="bg-card" />
          <Swatch name="border" className="bg-border" />
        </div>
      </Section>

      <Section
        title="Typography"
        description="Geist Sans for UI, Geist Mono for numeric/code contexts."
      >
        <div className="flex flex-col gap-3">
          <p className="text-3xl font-semibold tracking-tight">Program overview</p>
          <p className="text-xl font-semibold tracking-tight">Client: Sarah Chen</p>
          <p className="text-foreground text-base">
            Regular body copy sits at 16px with a comfortable line height for long-form notes.
          </p>
          <p className="text-muted-foreground text-sm">
            Secondary text — captions, helper copy, metadata — uses the muted-foreground token.
          </p>
          <p className="font-mono text-sm tabular-nums">2,140 kcal · 142g protein · 68g fat</p>
        </div>
      </Section>

      <Section title="Buttons" description="Every variant, size, and interactive state.">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button size="icon" aria-label="Add client">
            <Plus />
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button>
            <Mail /> Send message
          </Button>
          <Button isLoading>Saving</Button>
          <Button disabled>Disabled</Button>
          <Button variant="destructive">
            <Trash2 /> Delete client
          </Button>
        </div>
      </Section>

      <Section title="Form fields" description="Input, label, and validation state.">
        <div className="grid max-w-sm gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="client-name">Full name</Label>
            <Input id="client-name" placeholder="Sarah Chen" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="client-email">Email</Label>
            <Input id="client-email" type="email" placeholder="sarah@example.com" invalid />
            <p className="text-destructive text-xs">Enter a valid email address.</p>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="client-notes">Disabled field</Label>
            <Input id="client-notes" disabled placeholder="Not editable" />
          </div>
        </div>
      </Section>

      <Section title="Badges" description="Status and metadata indicators.">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Default</Badge>
          <Badge variant="neutral">Draft</Badge>
          <Badge variant="success">Active</Badge>
          <Badge variant="warning">Renewal due</Badge>
          <Badge variant="error">Severe allergy</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </Section>

      <Section title="Avatar">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src="https://i.pravatar.cc/64?img=5" alt="" />
            <AvatarFallback>SC</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>MD</AvatarFallback>
          </Avatar>
        </div>
      </Section>

      <Section
        title="Card"
        description="The base container used throughout the practice workspace."
      >
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle>Sarah Chen</CardTitle>
            <CardDescription>Weight management · Active since Jan 2026</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Current program</span>
              <span className="font-medium">6-week reset</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Next appointment</span>
              <span className="font-medium">Aug 8, 10:00 AM</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button size="sm" className="flex-1">
              View client
            </Button>
            <Button size="sm" variant="secondary" className="flex-1">
              Message
            </Button>
          </CardFooter>
        </Card>
      </Section>
    </div>
  );
}
