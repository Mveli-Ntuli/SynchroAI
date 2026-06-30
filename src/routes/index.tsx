import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Brain,
  Calendar,
  Check,
  Copy,
  FileText,
  Loader2,
  Lock,
  Mail,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { summarizeNotes, planTasks, draftEmail } from "@/lib/ai.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Flowline — AI Productivity Assistant" },
      {
        name: "description",
        content:
          "Turn messy meeting notes into a prioritized weekly plan and a polished email — in three guided steps.",
      },
    ],
  }),
  component: Home,
});

const SAMPLE_NOTES = `Project Kickoff - Q1 Atlas Launch (Tuesday Jun 30, 2026, 9:30am)
Attendees: Priya (PM), Marcus (Eng Lead), Lina (Design), Daniel (Marketing)

- Priya confirmed launch target Feb 28. Hard deadline due to investor demo.
- Marcus says auth refactor must finish by Feb 10 or it blocks everything. Needs one more engineer.
- Lina will deliver final dashboard mocks by Friday this week. Needs copy by Wednesday.
- Daniel: landing page copy not started yet. Will draft v1 by Wednesday. Needs Lina's hero direction.
- Decision: we will NOT ship the analytics tab in v1. Pushed to v1.1 (March).
- Risk: vendor SSO contract still unsigned, legal review pending. Daniel to chase.
- Next meeting Thursday 2pm.`;

function MarkdownOutput({ markdown }: { markdown: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 prose-output prose-output-interactive animate-in fade-in slide-in-from-bottom-4 duration-500">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  );
}

function SkeletonOutput() {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-5 animate-in fade-in duration-300">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-11/12" />
      <Skeleton className="h-4 w-9/12" />
      <div className="pt-2 space-y-2">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-4/5" />
      </div>
    </div>
  );
}

function EmptyOutput({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function OutputArea({
  isPending,
  markdown,
  empty,
}: {
  isPending: boolean;
  markdown?: string;
  empty: string;
}) {
  if (isPending) return <SkeletonOutput />;
  if (markdown) return <MarkdownOutput markdown={markdown} />;
  return <EmptyOutput>{empty}</EmptyOutput>;
}

function HumanInLoopWarning() {
  return (
    <div
      role="note"
      className="mt-3 flex items-start gap-2.5 rounded-md border border-warning/50 bg-warning/15 px-3.5 py-2.5 text-xs leading-relaxed text-warning-foreground animate-in fade-in duration-300"
    >
      <ShieldAlert className="mt-0.5 size-4 shrink-0" />
      <span>
        <strong>⚠️ Verification Required:</strong> AI models can misinterpret
        deadlines or owners. Please manually verify all calendar dates and
        tasks before finalizing.
      </span>
    </div>
  );
}

function StageHeader({
  step,
  icon: Icon,
  title,
  description,
}: {
  step: number;
  icon: typeof Brain;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-4">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <Icon className="size-5" />
      </div>
      <div className="flex-1">
        <div className="text-xs font-semibold uppercase tracking-wider text-accent-foreground/80">
          Stage {step}
        </div>
        <h2 className="font-display text-2xl font-semibold leading-tight text-foreground">
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="secondary"
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          toast.success("Email copied to clipboard");
          setTimeout(() => setCopied(false), 1800);
        });
      }}
      className="group relative transition-transform duration-150 active:scale-95"
    >
      {copied ? (
        <>
          <span className="inline-flex items-center justify-center size-4 rounded-full bg-success text-success-foreground animate-in zoom-in duration-200">
            <Check className="size-3" />
          </span>
          Copied!
        </>
      ) : (
        <>
          <Copy className="size-4 transition-transform group-hover:-translate-y-0.5" />
          Copy email
        </>
      )}
    </Button>
  );
}

function Home() {
  const [notes, setNotes] = useState("");
  const [actionItems, setActionItems] = useState("");
  const [schedule, setSchedule] = useState("");
  const [audience, setAudience] = useState<"Manager" | "Client" | "Team">("Team");
  const [tone, setTone] = useState<"Formal" | "Informal" | "Persuasive">("Formal");
  const [activeStage, setActiveStage] = useState<"1" | "2" | "3">("1");

  const summarizeFn = useServerFn(summarizeNotes);
  const planFn = useServerFn(planTasks);
  const emailFn = useServerFn(draftEmail);

  const summary = useMutation({
    mutationFn: (n: string) => summarizeFn({ data: { notes: n } }),
    onSuccess: (r) => {
      setActionItems(r.text);
      toast.success("Summary ready — forwarded to Stage 2");
      setActiveStage("2");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const plan = useMutation({
    mutationFn: (a: string) => planFn({ data: { actionItems: a } }),
    onSuccess: (r) => {
      setSchedule(r.text);
      toast.success("Weekly plan ready — forwarded to Stage 3");
      setActiveStage("3");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const email = useMutation({
    mutationFn: (ctx: string) => emailFn({ data: { context: ctx, audience, tone } }),
    onError: (e: Error) => toast.error(e.message),
  });

  // Progress indicator
  const progress =
    (summary.data ? 1 : 0) + (plan.data ? 1 : 0) + (email.data ? 1 : 0);

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-center" />

      {/* Hero */}
      <header className="border-b border-border bg-gradient-to-b from-secondary/60 to-background">
        <div className="mx-auto max-w-5xl px-6 pb-10 pt-14">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Sparkles className="size-4" /> Flowline
          </div>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-foreground md:text-6xl">
            Meeting → Plan → Email,
            <br />
            <span className="text-accent">in one fluid pass.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
            A guided three-stage workspace. Drop in raw meeting notes; Flowline
            extracts action items, builds a prioritized weekly schedule, and
            drafts the follow-up email — each stage feeding the next.
          </p>

          <div className="mt-6 flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
            <Lock className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>
              <strong>Data privacy:</strong> omit or redact passwords,
              financial figures, and personal data before pasting. Notes are
              sent to an AI model for processing.
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-6">
            <div className="flex justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <span>Workflow progress</span>
              <span>{progress}/3 stages</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700 ease-out"
                style={{ width: `${(progress / 3) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <Tabs
          value={activeStage}
          onValueChange={(v) => setActiveStage(v as "1" | "2" | "3")}
        >
          <TabsList className="grid h-auto w-full grid-cols-3 gap-1 bg-secondary/60 p-1.5">
            <TabsTrigger
              value="1"
              className="flex items-center gap-2 py-2.5 data-[state=active]:bg-card data-[state=active]:shadow-sm"
            >
              <FileText className="size-4" />
              <span className="hidden sm:inline">1. Summarize</span>
              <span className="sm:hidden">1</span>
              {summary.data && <Check className="size-3.5 text-success" />}
            </TabsTrigger>
            <TabsTrigger
              value="2"
              className="flex items-center gap-2 py-2.5 data-[state=active]:bg-card data-[state=active]:shadow-sm"
            >
              <Calendar className="size-4" />
              <span className="hidden sm:inline">2. Plan</span>
              <span className="sm:hidden">2</span>
              {plan.data && <Check className="size-3.5 text-success" />}
            </TabsTrigger>
            <TabsTrigger
              value="3"
              className="flex items-center gap-2 py-2.5 data-[state=active]:bg-card data-[state=active]:shadow-sm"
            >
              <Mail className="size-4" />
              <span className="hidden sm:inline">3. Email</span>
              <span className="sm:hidden">3</span>
              {email.data && <Check className="size-3.5 text-success" />}
            </TabsTrigger>
          </TabsList>

          {/* Stage 1 */}
          <TabsContent
            value="1"
            className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8 animate-in fade-in slide-in-from-bottom-2 duration-400"
          >
            <StageHeader
              step={1}
              icon={FileText}
              title="Meeting Notes Summarizer"
              description="Paste raw notes or a transcript. Get a structured summary with action items, owners, and deadlines."
            />
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Paste meeting notes here…"
              className="min-h-44 resize-y bg-background"
            />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button
                onClick={() => summary.mutate(notes)}
                disabled={summary.isPending || notes.trim().length < 10}
                className="transition-transform duration-150 active:scale-95"
              >
                {summary.isPending ? (
                  <><Loader2 className="size-4 animate-spin" /> Summarizing…</>
                ) : (
                  <><Brain className="size-4" /> Generate Smart Summary</>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setNotes(SAMPLE_NOTES)}
                disabled={summary.isPending}
              >
                Load sample notes
              </Button>
              {summary.data && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveStage("2")}
                  className="ml-auto"
                >
                  Continue to Planner →
                </Button>
              )}
            </div>

            <div className="mt-6">
              <OutputArea
                isPending={summary.isPending}
                markdown={summary.data?.text}
                empty="The structured summary will appear here."
              />
              <HumanInLoopWarning />
            </div>
          </TabsContent>

          {/* Stage 2 */}
          <TabsContent
            value="2"
            className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8 animate-in fade-in slide-in-from-bottom-2 duration-400"
          >
            <StageHeader
              step={2}
              icon={Calendar}
              title="AI Task Planner"
              description="Eisenhower-prioritized weekly schedule from your action items. Today is Tuesday Jun 30, 2026 — scheduling starts from today."
            />
            <Textarea
              value={actionItems}
              onChange={(e) => setActionItems(e.target.value)}
              placeholder="Action items will auto-fill from Stage 1. You can also paste your own."
              className="min-h-40 resize-y bg-background font-mono text-sm"
            />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button
                onClick={() => plan.mutate(actionItems)}
                disabled={plan.isPending || actionItems.trim().length < 5}
                className="transition-transform duration-150 active:scale-95"
              >
                {plan.isPending ? (
                  <><Loader2 className="size-4 animate-spin" /> Planning…</>
                ) : (
                  <><Calendar className="size-4" /> Build Optimized Weekly Schedule</>
                )}
              </Button>
              {plan.data && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveStage("3")}
                  className="ml-auto"
                >
                  Continue to Email →
                </Button>
              )}
            </div>

            <div className="mt-6">
              <OutputArea
                isPending={plan.isPending}
                markdown={plan.data?.text}
                empty="Your prioritized weekly roadmap will appear here."
              />
              <HumanInLoopWarning />
            </div>
          </TabsContent>

          {/* Stage 3 */}
          <TabsContent
            value="3"
            className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8 animate-in fade-in slide-in-from-bottom-2 duration-400"
          >
            <StageHeader
              step={3}
              icon={Mail}
              title="Smart Email Generator"
              description="A polished follow-up email, tailored to audience and tone."
            />

            <div className="mb-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Audience
                </label>
                <Select value={audience} onValueChange={(v) => setAudience(v as typeof audience)}>
                  <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Client">Client</SelectItem>
                    <SelectItem value="Team">Team</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Tone
                </label>
                <Select value={tone} onValueChange={(v) => setTone(v as typeof tone)}>
                  <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Formal">Formal</SelectItem>
                    <SelectItem value="Informal">Informal</SelectItem>
                    <SelectItem value="Persuasive">Persuasive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Textarea
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              placeholder="Context will auto-fill from Stage 2. You can edit before drafting."
              className="min-h-40 resize-y bg-background font-mono text-sm"
            />

            <div className="mt-3 flex flex-wrap gap-3">
              <Button
                onClick={() => email.mutate(schedule)}
                disabled={email.isPending || schedule.trim().length < 5}
                className="transition-transform duration-150 active:scale-95"
              >
                {email.isPending ? (
                  <><Loader2 className="size-4 animate-spin" /> Drafting…</>
                ) : (
                  <><Mail className="size-4" /> Draft Contextual Email</>
                )}
              </Button>
              {email.data?.text && <CopyButton text={email.data.text} />}
            </div>

            <div className="mt-6">
              <OutputArea
                isPending={email.isPending}
                markdown={email.data?.text}
                empty="Your tailored email draft will appear here."
              />
              <HumanInLoopWarning />
            </div>
          </TabsContent>
        </Tabs>

        <footer className="pt-10 text-center text-xs text-muted-foreground">
          Built with Lovable AI · Default model: Gemini 3 Flash · Always
          review AI output before sending.
        </footer>
      </main>
    </div>
  );
}
