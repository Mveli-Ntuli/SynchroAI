import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Zap,
  Shield,
  BarChart3,
  ArrowRight,
  Check,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Your App — Build Better, Ship Faster" },
      { name: "description", content: "A modern platform to help you build, launch, and scale your next big idea." },
      { property: "og:title", content: "Your App — Build Better, Ship Faster" },
      { property: "og:description", content: "A modern platform to help you build, launch, and scale your next big idea." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="text-xl font-bold tracking-tight text-foreground">
          YourApp
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <a href="#features" className="text-muted-foreground transition-colors hover:text-foreground">
            Features
          </a>
          <a href="#pricing" className="text-muted-foreground transition-colors hover:text-foreground">
            Pricing
          </a>
          <Button size="sm">Get Started</Button>
        </nav>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden px-6 pt-24 pb-32">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl">
          Build better products{" "}
          <span className="text-primary">in record time</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Everything you need to launch, grow, and scale your next big idea.
          Powerful tools, intuitive design, and zero compromise.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Button size="lg">
            Get Started
            <ArrowRight className="size-4" />
          </Button>
          <Button variant="outline" size="lg">
            Learn More
          </Button>
        </div>
      </div>
    </section>
  );
}

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Optimized for speed so you can focus on what matters most — shipping great products.",
  },
  {
    icon: Shield,
    title: "Secure by Default",
    description: "Enterprise-grade security built in from day one. Your data is always protected.",
  },
  {
    icon: BarChart3,
    title: "Built-in Analytics",
    description: "Track everything that matters with powerful, easy-to-understand dashboards.",
  },
];

function FeaturesSection() {
  return (
    <section id="features" className="border-t border-border bg-muted/30 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything you need
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Powerful features designed to help you move faster.
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-border bg-card p-8 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-primary/10 p-3">
                <feature.icon className="size-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-card-foreground">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const tiers = [
  {
    name: "Starter",
    price: "$0",
    period: "/mo",
    description: "Perfect for trying things out.",
    features: ["1 project", "Basic analytics", "Community support"],
    cta: "Get Started",
    variant: "outline" as const,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mo",
    description: "For growing teams and products.",
    features: ["Unlimited projects", "Advanced analytics", "Priority support", "Custom domains"],
    cta: "Start Free Trial",
    variant: "default" as const,
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For organizations at scale.",
    features: ["Everything in Pro", "SSO & SAML", "Dedicated support", "SLA guarantee"],
    cta: "Contact Sales",
    variant: "outline" as const,
  },
];

function PricingSection() {
  return (
    <section id="pricing" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start free, upgrade when you are ready.
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl border p-8 shadow-sm ${
                tier.highlighted
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card"
              }`}
            >
              {tier.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                  Most Popular
                </span>
              )}
              <h3 className="text-lg font-semibold text-foreground">{tier.name}</h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-bold tracking-tight text-foreground">{tier.price}</span>
                <span className="ml-1 text-sm text-muted-foreground">{tier.period}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{tier.description}</p>
              <ul className="mt-6 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                variant={tier.variant}
                className="mt-8 w-full"
                size="lg"
              >
                {tier.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="border-t border-border bg-muted/30 px-6 py-24">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Ready to get started?
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Join thousands of teams already building with us. No credit card required.
        </p>
        <div className="mt-10">
          <Button size="lg">
            Start Building for Free
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-background px-6 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} YourApp. All rights reserved.
        </p>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
          <a href="#" className="hover:text-foreground transition-colors">Terms</a>
          <a href="#" className="hover:text-foreground transition-colors">Contact</a>
        </div>
      </div>
    </footer>
  );
}
