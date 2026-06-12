import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

export default function Home() {
  return (
    <div className="space-y-16 sm:space-y-20">
      {/* ---------------- Hero ---------------- */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-900 px-6 py-14 text-white shadow-xl shadow-brand-900/20 sm:px-10 sm:py-16">
        {/* decorative blobs + grid */}
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-70" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-brand-400/30 blur-3xl" />

        <div className="relative grid items-center gap-10 lg:grid-cols-2">
          {/* copy */}
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold ring-1 ring-white/20 backdrop-blur">
              <span className="h-2 w-2 animate-pulse-ring rounded-full bg-accent-400" />
              Typing practice • Tests • Reports
            </span>
            <h1 className="mt-5 text-4xl font-black leading-[1.1] tracking-tight sm:text-5xl">
              Master the keyboard.{' '}
              <span className="bg-gradient-to-r from-amber-300 to-accent-400 bg-clip-text text-transparent">
                Type faster
              </span>{' '}
              with fewer mistakes.
            </h1>
            <p className="mt-4 max-w-xl text-base text-brand-100/90 sm:text-lg">
              Step-by-step lessons, real exam-style typing tests, and number drills — in English
              and Hindi — with live speed, accuracy and error tracking.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/learn/home-row-1"
                className="btn bg-white px-5 py-2.5 text-brand-700 shadow-lg shadow-brand-900/20 hover:bg-brand-50"
              >
                Start learning
                <ArrowIcon />
              </Link>
              <Link
                to="/test"
                className="btn bg-white/10 px-5 py-2.5 text-white ring-1 ring-white/30 backdrop-blur hover:bg-white/20"
              >
                Take a test
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-brand-100/80">
              <Tick>No sign-up required to practise</Tick>
              <Tick>English &amp; Hindi</Tick>
              <Tick>Free certificates</Tick>
            </div>
          </div>

          {/* visual: live typing card */}
          <div className="relative hidden animate-fade-up justify-self-end lg:block" style={{ animationDelay: '120ms' }}>
            <div className="w-[22rem] rotate-1 rounded-2xl bg-white p-5 text-slate-800 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-rose-400" />
                  <span className="h-3 w-3 rounded-full bg-amber-400" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400" />
                </div>
                <span className="text-xs font-semibold text-slate-400">Live test</span>
              </div>
              <p className="mt-4 font-mono text-sm leading-relaxed">
                <span className="text-emerald-600">The quick brown fox </span>
                <span className="rounded bg-brand-100 text-brand-700">jumps</span>
                <span className="text-slate-400"> over the lazy dog.</span>
              </p>
              <div className="mt-5 grid grid-cols-3 gap-2">
                <MiniStat label="WPM" value="62" accent="text-brand-600" />
                <MiniStat label="Accuracy" value="98%" accent="text-emerald-600" />
                <MiniStat label="Errors" value="2" accent="text-rose-500" />
              </div>
            </div>
            {/* floating key chips */}
            <div className="absolute -left-8 top-8 animate-float rounded-xl bg-white/95 px-3 py-2 font-mono text-sm font-bold text-brand-700 shadow-lg">
              A S D F
            </div>
            <div
              className="absolute -bottom-6 right-6 animate-float rounded-xl bg-accent-500 px-3 py-2 font-mono text-sm font-bold text-white shadow-lg"
              style={{ animationDelay: '1.2s' }}
            >
              अ क म
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Stats strip ---------------- */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatBox value="3" label="Scripts supported" />
        <StatBox value="20+" label="Guided lessons" />
        <StatBox value="Live" label="Speed & accuracy" />
        <StatBox value="Exam" label="Style mock tests" />
      </section>

      {/* ---------------- English Typing ---------------- */}
      <Section
        eyebrow="English"
        title="English Typing"
        subtitle="Latin script • QWERTY keyboard layout"
      >
        <CardGrid>
          <ModuleCard
            to="/learn/home-row-1"
            color="from-amber-400 to-orange-500"
            icon={<AbcIcon />}
            title="Learn Typing"
            desc="Lesson-wise key practice with a virtual keyboard and finger guidance."
          />
          <ModuleCard
            to="/test"
            color="from-sky-400 to-blue-600"
            icon={<TestIcon />}
            title="Take Tests"
            desc="Timed, exam-style paragraph tests with printout & exam modes."
          />
          <ModuleCard
            to="/numbers"
            color="from-emerald-400 to-green-600"
            icon={<NumIcon />}
            title="Number Typing"
            desc="Build speed and accuracy on the number row and numpad."
          />
        </CardGrid>
      </Section>

      {/* ---------------- Hindi KrutiDev & DevLys ---------------- */}
      <Section
        eyebrow="Hindi"
        title="Hindi Typing — KrutiDev & DevLys"
        subtitle="Devanagari script • legacy fonts"
      >
        <CardGrid>
          <ModuleCard
            to="/hindi/krutidev/learn/kd-home-1"
            color="from-fuchsia-400 to-purple-600"
            icon={<HiIcon />}
            title="Learn Typing"
            desc="Lesson-wise KrutiDev/DevLys key practice with a Devanagari virtual keyboard."
          />
          <ModuleCard
            to="/hindi/krutidev/test"
            color="from-rose-400 to-pink-600"
            icon={<TestIcon />}
            title="Take Tests"
            desc="Timed Hindi typing tests in KrutiDev/DevLys with printout & exam modes."
          />
        </CardGrid>
      </Section>

      {/* ---------------- Hindi Mangal Unicode ---------------- */}
      <Section
        eyebrow="Hindi • Unicode"
        title="Hindi Typing — Mangal Unicode"
        subtitle="Real Unicode Devanagari • works everywhere"
      >
        <div className="grid gap-4 md:grid-cols-3">
          <LayoutBox name="Remington GAIL" slug="remington-gail" />
          <LayoutBox name="INSCRIPT" slug="inscript" />
          <LayoutBox name="Remington CBI" slug="remington-cbi" />
        </div>
      </Section>

      {/* ---------------- Features ---------------- */}
      <Section
        eyebrow="Why TypeMaster"
        title="Everything you need to improve"
        subtitle="Built for students, typists and exam aspirants"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<GaugeIcon />}
            title="Live speed & accuracy"
            desc="See your WPM, accuracy and error count update in real time as you type."
          />
          <FeatureCard
            icon={<TestIcon />}
            title="Exam-style tests"
            desc="Timed paragraph tests with printout and exam modes that mirror real exams."
          />
          <FeatureCard
            icon={<KeyboardMini />}
            title="On-screen keyboard"
            desc="Highlighted next-key guidance and finger placement to build muscle memory."
          />
          <FeatureCard
            icon={<GlobeIcon />}
            title="English + Hindi"
            desc="Practise QWERTY English, plus KrutiDev/DevLys and Mangal Unicode Hindi."
          />
          <FeatureCard
            icon={<CertIcon />}
            title="Free certificates"
            desc="Earn a shareable result certificate when you complete a test."
          />
          <FeatureCard
            icon={<ChartIcon />}
            title="Track your progress"
            desc="Sign in to save attempts and watch your typing speed climb over time."
          />
        </div>
      </Section>

      {/* ---------------- CTA ---------------- */}
      <section className="relative overflow-hidden rounded-[2rem] bg-slate-900 px-6 py-12 text-center text-white sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-600/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-accent-500/30 blur-3xl" />
        <div className="relative mx-auto max-w-2xl">
          <h2 className="text-2xl font-black sm:text-3xl">Ready to boost your typing speed?</h2>
          <p className="mt-3 text-slate-300">
            Jump into a lesson or take a quick test — no setup needed.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/learn/home-row-1" className="btn-primary px-5 py-2.5">
              Start a lesson
              <ArrowIcon />
            </Link>
            <Link
              to="/test"
              className="btn bg-white/10 px-5 py-2.5 text-white ring-1 ring-white/25 hover:bg-white/20"
            >
              Take a test
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

/* ----------------------------- building blocks ----------------------------- */

function Section({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow?: string
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <section>
      <div className="mb-5">
        {eyebrow && (
          <span className="text-xs font-bold uppercase tracking-widest text-brand-600">
            {eyebrow}
          </span>
        )}
        <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      {children}
    </section>
  )
}

function CardGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
}

function ModuleCard({
  to,
  title,
  desc,
  icon,
  color,
}: {
  to: string
  title: string
  desc: string
  icon: ReactNode
  color: string
}) {
  return (
    <Link
      to={to}
      className="card group relative flex flex-col gap-3 overflow-hidden p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:ring-brand-200"
    >
      <div
        className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${color} text-white shadow-md transition-transform duration-200 group-hover:scale-110`}
      >
        {icon}
      </div>
      <div>
        <div className="text-lg font-bold text-slate-900">{title}</div>
        <p className="mt-1 text-sm text-slate-500">{desc}</p>
      </div>
      <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
        Open
        <ArrowIcon className="transition group-hover:translate-x-1" />
      </span>
    </Link>
  )
}

function FeatureCard({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <div className="card flex gap-4 p-5">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
        {icon}
      </div>
      <div>
        <div className="font-bold text-slate-900">{title}</div>
        <p className="mt-1 text-sm text-slate-500">{desc}</p>
      </div>
    </div>
  )
}

function StatBox({ value, label }: { value: string; label: string }) {
  return (
    <div className="card p-5 text-center">
      <div className="text-2xl font-black text-slate-900 sm:text-3xl">{value}</div>
      <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>
    </div>
  )
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-2.5 text-center ring-1 ring-slate-100">
      <div className={`text-lg font-extrabold ${accent}`}>{value}</div>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
    </div>
  )
}

function LayoutBox({ name, slug }: { name: string; slug: string }) {
  return (
    <div className="card group p-5 transition hover:shadow-md">
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 text-sm font-bold text-white">
          अ
        </span>
        <div className="text-sm font-bold text-slate-800">{name}</div>
      </div>
      <p className="mt-3 text-xs text-slate-400">Real Unicode Devanagari • Mangal font.</p>
      <div className="mt-4 flex gap-2">
        <Link
          to={`/hindi/mangal/${slug}/learn/${slug === 'remington-gail' ? 'rg-1' : 'mg-vowels'}`}
          className="flex-1 rounded-lg bg-fuchsia-50 px-3 py-2 text-center text-xs font-semibold text-fuchsia-700 transition hover:bg-fuchsia-100"
        >
          Learn
        </Link>
        <Link
          to={`/hindi/mangal/${slug}/test`}
          className="flex-1 rounded-lg bg-rose-50 px-3 py-2 text-center text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
        >
          Take Test
        </Link>
      </div>
    </div>
  )
}

function Tick({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-accent-400">
        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {children}
    </span>
  )
}

/* ----------------------------- icons ----------------------------- */

function ArrowIcon({ className = '' }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function AbcIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 16l3-8 3 8M5 13h4M14 8v8h2a3 3 0 0 0 0-6h-2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function HiIcon() {
  return <span className="text-lg font-extrabold leading-none">अ</span>
}
function TestIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" strokeLinecap="round" />
    </svg>
  )
}
function NumIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 6v12M16 6v12M5 10h14M5 14h14" strokeLinecap="round" />
    </svg>
  )
}
function GaugeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 13l3-3M3 17a9 9 0 1 1 18 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function KeyboardMini() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="6" width="20" height="13" rx="2" />
      <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M9 14h6" strokeLinecap="round" />
    </svg>
  )
}
function GlobeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" strokeLinecap="round" />
    </svg>
  )
}
function CertIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="9" r="5" />
      <path d="M9 13.5L8 21l4-2 4 2-1-7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function ChartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19V5M4 19h16M8 16l3-4 3 2 4-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
