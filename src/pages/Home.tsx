import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

export default function Home() {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-800 px-6 py-12 text-white shadow-lg sm:px-10">
        <div className="max-w-2xl">
          <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
            Typing practice • Tests • Reports
          </span>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl">
            Master the keyboard. Type faster, with fewer mistakes.
          </h1>
          <p className="mt-3 text-brand-100">
            Step-by-step lessons, real exam-style typing tests, and number drills — with live
            speed, accuracy and error tracking.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/learn/home-row-1" className="btn bg-white text-brand-700 hover:bg-brand-50">
              Start learning
            </Link>
            <Link to="/test" className="btn bg-white/15 text-white hover:bg-white/25">
              Take a test
            </Link>
          </div>
        </div>
      </section>

      {/* English Typing */}
      <Section title="English Typing" subtitle="Latin script • QWERTY keyboard layout">
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

      {/* Hindi KrutiDev & DevLys */}
      <Section
        title="Hindi Typing — KrutiDev & DevLys Font"
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

      <Section title="Hindi Typing — Mangal Unicode Font" subtitle="Unicode Devanagari script">
        <div className="grid gap-4 md:grid-cols-3">
          <LayoutBox name="Remington GAIL Layout" slug="remington-gail" />
          <LayoutBox name="INSCRIPT Layout" slug="inscript" />
          <LayoutBox name="Remington CBI Layout" slug="remington-cbi" />
        </div>
      </Section>
    </div>
  )
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-xl font-extrabold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500">{subtitle}</p>
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
      className="card group flex flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div
        className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${color} text-white shadow`}
      >
        {icon}
      </div>
      <div>
        <div className="text-lg font-bold text-slate-900">{title}</div>
        <p className="mt-1 text-sm text-slate-500">{desc}</p>
      </div>
      <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
        Open
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition group-hover:translate-x-0.5">
          <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </Link>
  )
}

function ComingSoonCard({ title }: { title: string }) {
  return (
    <div className="card flex items-center justify-between gap-3 p-5 opacity-80">
      <div>
        <div className="text-lg font-bold text-slate-700">{title}</div>
        <p className="mt-1 text-sm text-slate-400">Keyboard layout support coming soon.</p>
      </div>
      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
        Soon
      </span>
    </div>
  )
}

function LayoutBox({ name, slug }: { name: string; slug: string }) {
  return (
    <div className="card p-5">
      <div className="text-sm font-bold text-slate-700">{name}</div>
      <div className="mt-3 flex gap-2">
        <Link
          to={`/hindi/mangal/${slug}/learn/mg-vowels`}
          className="rounded-md bg-fuchsia-100 px-3 py-1.5 text-xs font-semibold text-fuchsia-700 hover:bg-fuchsia-200"
        >
          Learn Typing
        </Link>
        <Link
          to={`/hindi/mangal/${slug}/test`}
          className="rounded-md bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-200"
        >
          Take Test
        </Link>
      </div>
      <p className="mt-3 text-xs text-slate-400">Real Unicode Devanagari • Mangal font.</p>
    </div>
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
  return (
    <span className="text-lg font-extrabold leading-none" style={{ fontFamily: 'Inter, sans-serif' }}>
      अ
    </span>
  )
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
