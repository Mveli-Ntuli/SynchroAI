import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowDown,
  Brain,
  Calendar,
  Copy,
  FileText,
  Loader2,
  Mail,
  ShieldAlert,
  Sparkles,
  Lock,
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
      { property: "og:title", content: "Flowline — AI Productivity Assistant" },
      {
        property: "og:description",
        content:
          "An assembly-line AI workflow: summarize meetings, plan the week, draft the email.",
      },
    ],
  }),
  component: Home,
});

const SAMPLE_NOTES = `Project Kickoff - Q1 Atlas Launch (Monday 9:30am)
Attendees: Priya (PM), Marcus (Eng Lead), Lina (Design), Daniel (Marketing)

- Priya confirmed launch target Feb 28. Hard deadline due to investor demo.
- Marcus says auth refactor must finish by Feb 10 or it blocks everything. Needs one more engineer.
- Lina will deliver final dashboard mocks by Friday this week. Needs copy by Wednesday.
- Daniel: landing page copy not started yet. Will draft v1 by Wednesday. Needs Lina's hero direction.
- Decision: we will NOT ship the analytics tab in v1. Pushed to v1.1 (March).
- Risk: vendor SSO contract still unsigned, legal review pending. Daniel to chase.
- Next meeting Thursday 2pm.`;

function OutputCard({ markdown, empty }: { markdown?: string; empty: string }) {
  if (!markdown) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
        {empty}
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-border bg-card p-5 prose-output">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  );
}

function HumanInLoopWarning() {
  return (
    <div className="mt-3 flex items-start gap-2 rounded-md border border-warning/40 bg-warning/15 px-3 py-2 text-xs text-warning-foreground">
      <ShieldAlert className="mt-0.5 size-4 shrink-0" />
      <span>
        <strong>Verification required.</strong> AI can hallucinate dates or
        misassign tasks. Verify all owners and deadlines before sending.
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

function copyText(text: string) {
  navigator.clipboard.writeText(text).then(() => toast.success("Copied to clipboard"));
}

function Home() {
  const [notes, setNotes] = useState("");
  const [actionItems, setActionItems] = useState("");
  const [schedule, setSchedule] = useState("");
  const [audience, setAudience] = useState<"Manager" | "Client" | "Team">("Team");
  const [tone, setTone] = useState<"Formal" | "Informal" | "Persuasive">("Formal");

  const summarizeFn = useServerFn(summarizeNotes);
  const planFn = useServerFn(planTasks);
  const emailFn = useServerFn(draftEmail);

  const summary = useMutation({
    mutationFn: (n: string) => summarizeFn({ data: { notes: n } }),
    onSuccess: (r) => {
      setActionItems(r.text);
      toast.success("Summary ready — action items forwarded to Stage 2");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const plan = useMutation({
    mutationFn: (a: string) => planFn({ data: { actionItems: a } }),
    onSuccess: (r) => {
      setSchedule(r.text);
      toast.success("Weekly plan ready — forwarded to Stage 3");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const email = useMutation({
    mutationFn: (ctx: string) => emailFn({ data: { context: ctx, audience, tone } }),
    onError: (e: Error) => toast.error(e.message),
  });

  // Auto-scroll to next stage when output appears
  useEffect(() => {
    if (summary.data) document.getElementById("stage-2")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [summary.data]);
  useEffect(() => {
    if (plan.data) document.getElementById("stage-3")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [plan.data]);

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-center" />

      {/* Hero */}
      <header className="border-b border-border bg-gradient-to-b from-secondary/60 to-background">
        <div className="mx-auto max-w-5xl px-6 pb-12 pt-16">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Sparkles className="size-4" /> Flowline
          </div>
          <h1 className="mt-4 font-display text-5xl font-semibold leading-[1.05] tracking-tight text-foreground md:text-6xl">
            Meeting → Plan → Email,
            <br />
            <span className="text-accent">in one fluid pass.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            A guided three-stage workflow. Drop in raw meeting notes; Flowline
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
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-12 px-6 py-14">
        {/* Stage 1 */}
        <section id="stage-1" className="rounded-2xl border border-border bg-card p-8 shadow-sm">
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
          </div>

          <div className="mt-6">
            <OutputCard
              markdown={summary.data?.text}
              empty="The structured summary will appear here."
            />
            {summary.data?.text && <HumanInLoopWarning />}
          </div>
        </section>

        <div className="flex justify-center">
          <div className="flex size-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm">
            <ArrowDown className="size-4" />
          </div>
        </div>

        {/* Stage 2 */}
        <section id="stage-2" className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <StageHeader
            step={2}
            icon={Calendar}
            title="AI Task Planner"
            description="Eisenhower-prioritized weekly schedule from your action items, with time-optimization tips."
          />
          <Textarea
            value={actionItems}
            onChange={(e) => setActionItems(e.target.value)}
            placeholder="Action items will auto-fill from Stage 1. You can also paste your own."
            className="min-h-40 resize-y bg-background font-mono text-sm"
          />
          <div className="mt-3">
            <Button
              onClick={() => plan.mutate(actionItems)}
              disabled={plan.isPending || actionItems.trim().length < 5}
            >
              {plan.isPending ? (
                <><Loader2 className="size-4 animate-spin" /> Planning…</>
              ) : (
                <><Calendar className="size-4" /> Build Optimized Weekly Schedule</>
              )}
            </Button>
          </div>

          <div className="mt-6">
            <OutputCard
              markdown={plan.data?.text}
              empty="Your prioritized weekly roadmap will appear here."
            />
            {plan.data?.text && <HumanInLoopWarning />}
          </div>
        </section>

        <div className="flex justify-center">
          <div className="flex size-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm">
            <ArrowDown className="size-4" />
          </div>
        </div>

        {/* Stage 3 */}
        <section id="stage-3" className="rounded-2xl border border-border bg-card p-8 shadow-sm">
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
            >
              {email.isPending ? (
                <><Loader2 className="size-4 animate-spin" /> Drafting…</>
              ) : (
                <><Mail className="size-4" /> Draft Contextual Email</>
              )}
            </Button>
            {email.data?.text && (
              <Button variant="secondary" onClick={() => copyText(email.data!.text)}>
                <Copy className="size-4" /> Copy email
              </Button>
            )}
          </div>

          <div className="mt-6">
            <OutputCard
              markdown={email.data?.text}
              empty="Your tailored email draft will appear here."
            />
            {email.data?.text && <HumanInLoopWarning />}
          </div>
        </section>

        <footer className="pt-6 text-center text-xs text-muted-foreground">
          Built with Lovable AI · Default model: Gemini 3 Flash · Always
          review AI output before sending.
        </footer>
      </main>
    </div>
  );
}
