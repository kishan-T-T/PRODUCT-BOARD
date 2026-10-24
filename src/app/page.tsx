import {
  ArrowRight,
  BellRing,
  Check,
  Columns3,
  FileText,
  History,
  List,
  MessageSquare,
  Minus,
  ShieldCheck,
  SlidersHorizontal,
  SquareKanban,
  SquarePen,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { DemoButton } from "@/components/demo-button";
import { LabelDot, LabelPill, Logo, PriorityIcon, ProjectBadge, StatusIcon } from "@/components/icons";
import { LABELS, PRIORITIES } from "@/lib/constants";
import { getCurrentUser } from "@/lib/server/auth";

const FEATURES = [
  { icon: Users, title: "Manage Members", text: "Invite teammates, see who is working on what and keep everyone on the same page." },
  { icon: BellRing, title: "Realtime Notifications", text: "Know the moment you're assigned, a task moves or someone comments on your work." },
  { icon: ShieldCheck, title: "Role-Based Access", text: "Admins, members and viewers. Give everyone exactly the access they need." },
  { icon: SlidersHorizontal, title: "Advanced Filters", text: "Slice tasks by status, priority, label, assignee or keyword in a single click." },
  { icon: SquareKanban, title: "Boards & Lists", text: "Drag cards across a Kanban board or power through a dense, keyboard-friendly list." },
  { icon: History, title: "Complete History", text: "Every change is tracked per task and per project, so nothing ever gets lost." },
  { icon: FileText, title: "Markdown Descriptions", text: "Write rich task descriptions with checklists, tables and code blocks." },
  { icon: MessageSquare, title: "Comments on Tasks", text: "Discuss work right where it happens and keep every decision in context." },
];

const FLOW = [
  { title: "Sign up or log in", text: "Create your workspace in seconds, or explore the live demo." },
  { title: "Create a project", text: "Give it a name and color. Edit it any time." },
  { title: "Invite your members", text: "Add teammates as admins, members or viewers." },
  { title: "Plan your tasks", text: "Capture work in the list, then move it across the board." },
  { title: "Track the history", text: "Review every change on tasks and the whole project." },
];

const ROLE_MATRIX: Array<[string, boolean, boolean, boolean]> = [
  ["View tasks, boards & history", true, true, true],
  ["Create, edit & move tasks", true, true, false],
  ["Comment on tasks", true, true, false],
  ["Manage members & roles", true, false, false],
  ["Edit or delete the project", true, false, false],
];

const PREVIEW = [
  {
    status: "todo",
    label: "Todo",
    cards: [
      { key: "PB-8", title: "Boards: drag and drop between columns", priority: "high", label: "feature", name: "Masoom Kumar", color: "#0ea5e9" },
      { key: "PB-11", title: "History page shows wrong timestamps", priority: "high", label: "bug", name: "Vishwajeet Raj", color: "#10b981" },
      { key: "PB-10", title: "Avatar overflows in sidebar", priority: "low", label: "bug", name: "Neha Soni", color: "#ec4899" },
    ],
  },
  {
    status: "in_progress",
    label: "In Progress",
    cards: [
      { key: "PB-7", title: "Realtime notifications for members", priority: "urgent", label: "feature", name: "Demo User", color: "#4f46e5" },
      { key: "PB-5", title: "Backend Routing", priority: "high", label: "feature", name: "Vishwajeet Raj", color: "#10b981" },
    ],
  },
  {
    status: "done",
    label: "Done",
    cards: [
      { key: "PB-4", title: "Backend Data Modeling", priority: "high", label: "feature", name: "Vishwajeet Raj", color: "#10b981" },
      { key: "PB-1", title: "Setup Github Repo and Team", priority: "medium", label: "improvement", name: "Masoom Kumar", color: "#0ea5e9" },
    ],
  },
];

export default async function Home() {
  const user = await getCurrentUser();
  const startHref = user ? "/projects" : "/signup";

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm font-medium text-gray-600 md:flex">
            <a href="#features" className="hover:text-gray-900">Features</a>
            <a href="#how-it-works" className="hover:text-gray-900">How it works</a>
            <a href="#roles" className="hover:text-gray-900">Roles</a>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Link href="/projects" className="inline-flex h-9 items-center gap-1.5 rounded-md bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
                Open workspace <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden h-9 items-center rounded-md px-3 text-sm font-medium text-gray-700 hover:bg-gray-100 sm:inline-flex">
                  Sign in
                </Link>
                <Link href="/signup" className="inline-flex h-9 items-center rounded-md bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top_left,black_25%,transparent_70%)]" />
        <div className="absolute -right-40 -top-40 h-[480px] w-[480px] rounded-full bg-indigo-200/40 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
              An all-in-one workspace that handles your work.
            </p>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-gray-900 sm:text-5xl lg:text-[3.6rem]">
              Unlock your team&apos;s potential.{" "}
              <span className="text-indigo-600">Get started with Product Board today.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-600">
              Organize your team and keep track of your work with a single tool. Built for small teams and people working
              alone, so it stays straightforward and maintainable.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href={startHref}
                className="inline-flex h-12 items-center gap-2 rounded-md bg-indigo-600 px-6 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500"
              >
                Get started now <ArrowRight className="h-4 w-4" />
              </Link>
              <DemoButton className="h-12 border-indigo-200 px-6 font-semibold uppercase tracking-wide text-indigo-700 hover:bg-indigo-50">
                Try the live demo
              </DemoButton>
            </div>
            <p className="mt-5 text-sm text-gray-500">Free for individuals and small teams · No credit card required</p>
          </div>

          <div className="relative mx-auto hidden h-[400px] w-full max-w-md lg:block">
            <div className="absolute left-4 top-6 w-72 rotate-[-4deg] rounded-xl border border-gray-200 bg-white p-4 shadow-xl shadow-gray-900/10">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-gray-400">PB-7</span>
                <Avatar name="Demo User" color="#4f46e5" size="sm" />
              </div>
              <p className="mt-1.5 text-sm font-medium text-gray-900">Realtime notifications for members</p>
              <div className="mt-3 flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded border border-gray-200">
                  <PriorityIcon priority="urgent" size={12} />
                </span>
                <LabelPill label="feature" />
                <span className="ml-auto flex items-center gap-1 text-[11px] text-gray-500">
                  <StatusIcon status="in_progress" size={12} /> In Progress
                </span>
              </div>
            </div>
            <div className="absolute right-0 top-36 w-72 rotate-[3deg] rounded-xl border border-gray-200 bg-white p-3 shadow-xl shadow-gray-900/10">
              <div className="flex items-start gap-3">
                <Avatar name="Masoom Kumar" color="#0ea5e9" size="md" />
                <div className="min-w-0">
                  <p className="text-[13px] text-gray-700">
                    <b className="text-gray-900">Masoom Kumar</b> assigned you PB-9: Role-based access for members
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-indigo-600">
                    <BellRing className="h-3 w-3" /> just now
                  </p>
                </div>
              </div>
            </div>
            <div className="absolute bottom-4 left-10 w-64 rotate-[-1deg] rounded-xl border border-gray-200 bg-white p-3 shadow-xl shadow-gray-900/10">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Members</p>
              {[
                ["Demo User", "#4f46e5", "Admin"],
                ["Neha Soni", "#ec4899", "Member"],
                ["Alex Rivera", "#f59e0b", "Viewer"],
              ].map(([name, color, role]) => (
                <div key={name} className="flex items-center gap-2 py-1">
                  <Avatar name={name} color={color} size="sm" />
                  <span className="flex-1 text-[13px] text-gray-700">{name}</span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">{role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Product preview */}
      <section className="relative px-4 sm:px-6">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-indigo-900/10">
          <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
            <span className="ml-3 hidden rounded-md bg-white px-3 py-1 text-[11px] text-gray-400 ring-1 ring-gray-200 sm:block">
              productboard.app/projects/product-board/board
            </span>
          </div>
          <div className="flex h-[440px]">
            <div className="hidden w-52 shrink-0 flex-col border-r border-gray-100 bg-gray-50 p-3 text-[12px] md:flex">
              <div className="flex items-center gap-2 px-1.5 py-1">
                <ProjectBadge title="Product Board" color="#f59e0b" />
                <span className="font-semibold text-gray-900">Product Board</span>
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-md border border-gray-200 bg-white px-2 py-1.5 font-medium text-gray-700 shadow-sm">
                <SquarePen className="h-3.5 w-3.5 text-gray-500" /> New Task
              </div>
              <div className="mt-3 space-y-0.5 font-medium text-gray-600">
                <div className="flex items-center gap-2 px-2 py-1"><History className="h-3.5 w-3.5 text-gray-400" /> History</div>
                <div className="flex items-center gap-2 px-2 py-1"><List className="h-3.5 w-3.5 text-gray-400" /> Tasks</div>
                <div className="flex items-center gap-2 rounded-md bg-gray-200/70 px-2 py-1 text-gray-900"><Columns3 className="h-3.5 w-3.5 text-gray-500" /> Board</div>
              </div>
              <p className="mt-4 px-2 text-[10px] font-medium uppercase tracking-wide text-gray-400">Your Tasks</p>
              <div className="mt-1 space-y-0.5 text-gray-600">
                {PRIORITIES.map((p) => (
                  <div key={p.value} className="flex items-center gap-2 py-0.5 pl-4">
                    <PriorityIcon priority={p.value} size={12} /> {p.label}
                  </div>
                ))}
                {LABELS.map((l) => (
                  <div key={l.value} className="flex items-center gap-2 py-0.5 pl-4">
                    <LabelDot color={l.color} /> {l.label}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-1 gap-3 overflow-hidden bg-white p-4">
              {PREVIEW.map((col) => (
                <div key={col.status} className="flex w-full min-w-[200px] flex-col rounded-xl bg-gray-50 p-2 ring-1 ring-gray-100 sm:min-w-0">
                  <div className="flex items-center gap-2 px-1.5 py-1.5 text-[12px] font-semibold text-gray-800">
                    <StatusIcon status={col.status} /> {col.label}
                    <span className="font-normal text-gray-400">{col.cards.length}</span>
                  </div>
                  <div className="space-y-2">
                    {col.cards.map((c) => (
                      <div key={c.key} className="rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-medium text-gray-400">{c.key}</span>
                          <Avatar name={c.name} color={c.color} size="xs" />
                        </div>
                        <p className="mt-1 text-[12px] font-medium leading-snug text-gray-900">{c.title}</p>
                        <div className="mt-2 flex items-center gap-1.5">
                          <span className="flex h-4 w-4 items-center justify-center rounded border border-gray-200">
                            <PriorityIcon priority={c.priority} size={10} />
                          </span>
                          <LabelPill label={c.label} className="py-0 text-[10px]" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Problem / solution */}
      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">The problem</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-gray-900">The problem of plenty.</h2>
            <p className="mt-3 leading-relaxed text-gray-600">
              Most applications target big teams and end up shipping a dozen features for simple tasks. For individuals and
              small teams it&apos;s tough to manage and direct an effective workflow, and juggling multiple apps makes it
              worse.
            </p>
          </div>
          <div className="rounded-2xl bg-indigo-600 p-8 text-white shadow-xl shadow-indigo-600/20">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200">The solution</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight">Productivity, hassle-free.</h2>
            <p className="mt-3 leading-relaxed text-indigo-100">
              Product Board caters to your needs, whether you&apos;re a small team or working alone. One focused tool for
              projects, tasks, members and history that stays straightforward and maintainable.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20 border-y border-gray-100 bg-gray-50/70 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Features</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need, nothing you don&apos;t.
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Powerful where it matters, simple everywhere else.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold text-gray-900">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">How it works</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">From sign-up to shipped in five steps.</h2>
        </div>
        <ol className="mt-12 grid gap-6 md:grid-cols-5">
          {FLOW.map((step, i) => (
            <li key={step.title} className="relative">
              {i < FLOW.length - 1 && (
                <span className="absolute left-10 right-0 top-5 hidden h-px bg-gradient-to-r from-indigo-200 to-transparent md:block" />
              )}
              <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white shadow-lg shadow-indigo-600/30">
                {i + 1}
              </span>
              <h3 className="mt-4 font-semibold text-gray-900">{step.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-gray-600">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Roles */}
      <section id="roles" className="scroll-mt-20 border-t border-gray-100 bg-gray-50/70 py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Role-based access</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">The right access for every teammate.</h2>
            <p className="mt-4 text-lg leading-relaxed text-gray-600">
              Admins run the project, members get work done, and viewers stay in the loop without accidentally changing
              anything.
            </p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="grid grid-cols-[1fr_repeat(3,72px)] border-b border-gray-100 bg-gray-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 sm:grid-cols-[1fr_repeat(3,88px)]">
              <span>Capability</span>
              <span className="text-center">Admin</span>
              <span className="text-center">Member</span>
              <span className="text-center">Viewer</span>
            </div>
            {ROLE_MATRIX.map(([label, ...allowed]) => (
              <div key={label} className="grid grid-cols-[1fr_repeat(3,72px)] items-center border-b border-gray-100 px-5 py-3.5 text-sm last:border-0 sm:grid-cols-[1fr_repeat(3,88px)]">
                <span className="text-gray-700">{label}</span>
                {allowed.map((ok, i) => (
                  <span key={i} className="flex justify-center">
                    {ok ? (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </span>
                    ) : (
                      <Minus className="h-4 w-4 text-gray-300" />
                    )}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-24 sm:px-6">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-indigo-600 px-6 py-16 text-center shadow-2xl shadow-indigo-600/30 sm:px-16">
          <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
          <h2 className="relative text-3xl font-bold tracking-tight text-white sm:text-4xl">Ready to get your work organized?</h2>
          <p className="relative mx-auto mt-4 max-w-xl text-lg text-indigo-100">
            Spin up a project in seconds, or jump into a fully loaded demo workspace.
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Link href={startHref} className="inline-flex h-12 items-center gap-2 rounded-md bg-white px-6 text-sm font-semibold uppercase tracking-wide text-indigo-700 shadow-sm hover:bg-indigo-50">
              Get started now <ArrowRight className="h-4 w-4" />
            </Link>
            <DemoButton variant="primary" className="h-12 border border-indigo-400 bg-indigo-500 px-6 font-semibold uppercase tracking-wide hover:bg-indigo-400">
              Explore the demo
            </DemoButton>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-100">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-10 text-sm text-gray-500 sm:flex-row sm:px-6">
          <Logo />
          <p className="text-center sm:text-right">
            Built with Next.js, PostgreSQL &amp; Drizzle. Inspired by{" "}
            <a
              href="https://vishwajeetraj11.hashnode.dev/introducing-product-board-a-project-management-platform"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-indigo-600 hover:underline"
            >
              Product Board
            </a>{" "}
            by Vishwajeet Raj &amp; Masoom Kumar.
          </p>
        </div>
      </footer>
    </div>
  );
}
