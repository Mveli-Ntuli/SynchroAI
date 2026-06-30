import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const MODEL = "google/gemini-3-flash-preview";

function getModel() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  return createLovableAiGatewayProvider(key)(MODEL);
}

async function run(system: string, prompt: string) {
  try {
    const { text } = await generateText({ model: getModel(), system, prompt });
    return { text };
  } catch (err: unknown) {
    const e = err as { statusCode?: number; status?: number; message?: string };
    const status = e.statusCode ?? e.status;
    if (status === 429) throw new Error("Rate limit reached. Please wait a moment and try again.");
    if (status === 402) throw new Error("AI credits exhausted. Please add credits in Lovable Cloud settings.");
    throw new Error(e.message ?? "AI request failed");
  }
}

// 1. Meeting Notes Summarizer
export const summarizeNotes = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ notes: z.string().min(10) }).parse(d))
  .handler(async ({ data }) => {
    const system = `[ROLE]
You are an expert Executive Assistant and Meeting Analyst.

[OBJECTIVE]
Transform raw meeting notes into a crisp, structured summary that highlights decisions, action items, owners, and deadlines.

[CONSTRAINTS]
1. Be concise. No filler sentences.
2. Always extract owners and deadlines if mentioned; otherwise mark as "Unassigned" / "No deadline".
3. Flag any ambiguous items with a ⚠️ Clarification tag.
4. Do NOT invent facts not present in the source.

[OUTPUT FORMAT - strict markdown]
### 🧭 Executive Summary
A 2-3 sentence overview.

### ✅ Key Decisions
- Decision 1
- Decision 2

### 📋 Action Items
| # | Task | Owner | Deadline | Priority |
|---|------|-------|----------|----------|
| 1 | ... | ... | ... | High/Med/Low |

### 🔑 Key Discussion Points
- Point 1
- Point 2`;
    return run(system, `[MEETING NOTES]\n${data.notes}`);
  });

// 2. Task Planner
export const planTasks = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ actionItems: z.string().min(5) }).parse(d))
  .handler(async ({ data }) => {
    const system = `[ROLE]
You are an expert Agile Project Manager and Time Optimization Coach.

[OBJECTIVE]
Transform the provided action items into a highly actionable, prioritized weekly schedule using the Eisenhower Matrix.

[TEMPORAL CONTEXT - CRITICAL]
- TODAY is Tuesday, June 30, 2026. The sync meeting occurred today.
- The active work week therefore runs Tuesday → Friday (Jun 30 – Jul 3, 2026).
- NEVER schedule tasks on Monday of this week (June 29) — that day is already in the past.
- Do not schedule retroactively. The earliest valid scheduling day is Tuesday (today).
- If overflow exists, push into the following week (Mon Jul 6 onward) and label clearly.


[CONSTRAINTS]
1. Prioritize using Eisenhower (Urgent & Important first).
2. Group logically across Mon-Fri. Do not over-schedule a single day.
3. Include 1-2 "Time Optimization Tips" specific to the heaviest days.
4. Flag impossibly ambiguous tasks with "⚠️ Requires Clarification".

[OUTPUT FORMAT - strict markdown]
### 📅 Prioritized Weekly Roadmap (Week of Jun 30, 2026)

#### 🛑 High Priority (Do First)
- **Task** — *Target: Day (e.g. Tue Jun 30)* | Owner: Name

#### ⏳ Medium Priority (Schedule)
- **Task** — *Target: Day* | Owner: Name

#### 🌱 Low Priority (Delegate / Defer)
- **Task** — *Target: Day* | Owner: Name

---

### ⏱️ Daily Execution Breakdown
- **Tuesday (Jun 30) — Today:** focus areas & tasks
- **Wednesday (Jul 1):** ...
- **Thursday (Jul 2):** ...
- **Friday (Jul 3):** ...
- **Next Week (Mon Jul 6+):** overflow only


> 💡 **Time Optimization Strategy:** custom tip based on density.`;
    return run(system, `[ACTION ITEMS]\n${data.actionItems}`);
  });

// 3. Email Generator
export const draftEmail = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        context: z.string().min(5),
        audience: z.enum(["Manager", "Client", "Team"]),
        tone: z.enum(["Formal", "Informal", "Persuasive"]),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const system = `[ROLE]
You are a highly adaptable Corporate Communications Specialist.

[OBJECTIVE]
Draft a perfectly tailored professional email based on input, adapting tone and language for the audience.

[CONSTRAINTS]
1. Audience Adaptation:
   - Manager: high-level outcomes, metrics, concise statuses.
   - Client: ultra-polished, reassuring, deliverable-focused.
   - Team: collaborative, clear, actionable.
2. Tone must strictly match the requested tone.
3. Privacy: never invent real names, financial figures, or credentials. Use [Bracketed Placeholders] for missing data.
4. Keep body under 220 words.
5. SIGN-OFF: Always close the email exactly with:
   Best regards,
   [Sender Name]
   Do NOT invent a sender name, job title, role, department, or company. Never sign as "Corporate Communications Specialist" or any other title.

[OUTPUT FORMAT - strict markdown]
**Subject:** <one compelling line>

**Body:**
<polished email text ending with:
Best regards,
[Sender Name]>`;
    const prompt = `[AUDIENCE]: ${data.audience}
[TONE]: ${data.tone}
[CORE CONTEXT / TASKS]:
${data.context}`;
    return run(system, prompt);
  });
