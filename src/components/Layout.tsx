import { Link, NavLink, useNavigate } from 'react-router-dom'
import { type ReactNode } from 'react'
import { getStoredUser, clearStoredUser } from '../api'

export default function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const user = getStoredUser()

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-white shadow">
              <KeyboardIcon />
            </div>
            <div className="leading-tight">
              <div className="text-lg font-extrabold tracking-tight text-slate-900">
                Type<span className="text-brand-600">Master</span>
              </div>
              <div className="text-[11px] font-medium text-slate-500">Learn typing & take tests</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <TopLink to="/">Home</TopLink>
            <TopLink to="/learn/home-row-1">Learn Typing</TopLink>
            <TopLink to="/test">Take Test</TopLink>
            <TopLink to="/numbers">Number Typing</TopLink>
            <TopLink to="/hindi/krutidev/learn/kd-home-1">Hindi (KrutiDev)</TopLink>
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="hidden text-sm text-slate-600 sm:inline">
                  Hi, <b className="text-slate-800">{user.name}</b>
                </span>
                <button
                  className="btn-ghost"
                  onClick={() => {
                    clearStoredUser()
                    navigate('/')
                  }}
                >
                  Sign out
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn-ghost">
                Sign in
              </Link>
            )}
            <Link to="/admin" className="btn-primary">
              Admin
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 text-center text-xs text-slate-500">
          TypeMaster — built for practising English typing, tests, and number drills.
        </div>
      </footer>
    </div>
  )
}

function TopLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        [
          'rounded-lg px-3 py-2 text-sm font-semibold transition',
          isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100',
        ].join(' ')
      }
    >
      {children}
    </NavLink>
  )
}

function KeyboardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="6" width="20" height="13" rx="2" />
      <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h.01M18 14h.01M9 14h6" strokeLinecap="round" />
    </svg>
  )
}
