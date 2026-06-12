import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState, type ReactNode } from 'react'
import { getStoredUser, clearStoredUser, getToken, clearToken } from '../api'
import AuthModal from './AuthModal'

const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/learn/home-row-1', label: 'Learn Typing' },
  { to: '/test', label: 'Take Test' },
  { to: '/numbers', label: 'Numbers' },
]

const HINDI = [
  {
    to: '/hindi/krutidev/learn/kd-home-1',
    label: 'KrutiDev & DevLys',
    desc: 'Legacy Devanagari fonts',
  },
  {
    to: '/hindi/remington-gail',
    label: 'Mangal (Unicode)',
    desc: 'Remington, InScript & CBI',
  },
]

export default function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [showAuth, setShowAuth] = useState(false)
  const [authVersion, setAuthVersion] = useState(0)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Allow any page to open the sign-in popup via an `open-auth` event.
  useEffect(() => {
    const open = () => setShowAuth(true)
    window.addEventListener('open-auth', open)
    return () => window.removeEventListener('open-auth', open)
  }, [])

  // Add a shadow once the page is scrolled.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  void authVersion
  const user = getStoredUser()
  const isAdmin = !!getToken()

  function handleAuthed(role: 'admin' | 'user') {
    setShowAuth(false)
    setAuthVersion((v) => v + 1)
    if (role === 'admin') navigate('/admin/dashboard')
  }

  function signOut() {
    clearStoredUser()
    clearToken()
    setAuthVersion((v) => v + 1)
    setMobileOpen(false)
    navigate('/')
  }

  return (
    <div className="flex min-h-full flex-col">
      <header
        className={[
          'sticky top-0 z-30 border-b bg-white/80 backdrop-blur-lg transition-shadow',
          scrolled ? 'border-slate-200 shadow-sm' : 'border-transparent',
        ].join(' ')}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          {/* Logo */}
          <Link to="/" className="flex shrink-0 items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-600/30">
              <KeyboardIcon />
            </div>
            <div className="leading-tight">
              <div className="text-lg font-extrabold tracking-tight text-slate-900">
                Type<span className="gradient-text">Master</span>
              </div>
              <div className="hidden text-[11px] font-medium text-slate-500 sm:block">
                Learn typing &amp; take tests
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  ['nav-link', isActive ? 'nav-link-active' : ''].join(' ')
                }
              >
                {n.label}
              </NavLink>
            ))}

            {/* Hindi dropdown */}
            <div className="group relative">
              <button className="nav-link inline-flex items-center gap-1">
                Hindi Typing
                <ChevronDown />
              </button>
              <div className="invisible absolute left-0 top-full z-40 w-72 pt-2 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <div className="card overflow-hidden p-2">
                  {HINDI.map((h) => (
                    <Link
                      key={h.to}
                      to={h.to}
                      className="flex flex-col rounded-xl px-3 py-2.5 transition hover:bg-brand-50"
                    >
                      <span className="text-sm font-bold text-slate-800">{h.label}</span>
                      <span className="text-xs text-slate-500">{h.desc}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <AuthArea
                isAdmin={isAdmin}
                userName={user?.name}
                onSignIn={() => setShowAuth(true)}
                onSignOut={signOut}
              />
            </div>

            {/* Mobile hamburger */}
            <button
              className="grid h-10 w-10 place-items-center rounded-xl text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 lg:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="animate-fade-in border-t border-slate-200 bg-white lg:hidden">
            <nav className="mx-auto max-w-6xl space-y-1 px-4 py-3">
              {NAV.map((n) => (
                <MobileLink key={n.to} to={n.to} end={n.end}>
                  {n.label}
                </MobileLink>
              ))}
              <div className="px-3 pb-1 pt-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                Hindi Typing
              </div>
              {HINDI.map((h) => (
                <MobileLink key={h.to} to={h.to}>
                  {h.label}
                </MobileLink>
              ))}
              <div className="border-t border-slate-100 pt-3">
                <AuthArea
                  isAdmin={isAdmin}
                  userName={user?.name}
                  onSignIn={() => {
                    setMobileOpen(false)
                    setShowAuth(true)
                  }}
                  onSignOut={signOut}
                  full
                />
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>

      <footer className="mt-8 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-center sm:flex-row sm:text-left">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white">
              <KeyboardIcon small />
            </div>
            <span className="text-sm font-bold text-slate-700">
              Type<span className="gradient-text">Master</span>
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Practise English &amp; Hindi typing, take exam-style tests, and track your speed.
          </p>
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} TypeMaster
          </p>
        </div>
      </footer>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuthed={handleAuthed} />}
    </div>
  )
}

function AuthArea({
  isAdmin,
  userName,
  onSignIn,
  onSignOut,
  full,
}: {
  isAdmin: boolean
  userName?: string
  onSignIn: () => void
  onSignOut: () => void
  full?: boolean
}) {
  if (isAdmin) {
    return (
      <div className={['flex items-center gap-2', full ? 'flex-col items-stretch' : ''].join(' ')}>
        <Link to="/admin/dashboard" className="btn-ghost">
          Admin Dashboard
        </Link>
        <button className="btn-ghost" onClick={onSignOut}>
          Sign out
        </button>
      </div>
    )
  }
  if (userName) {
    return (
      <div className={['flex items-center gap-2', full ? 'flex-col items-stretch' : ''].join(' ')}>
        <span className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">
            {userName.charAt(0).toUpperCase()}
          </span>
          {userName}
        </span>
        <button className="btn-ghost" onClick={onSignOut}>
          Sign out
        </button>
      </div>
    )
  }
  return (
    <button className={['btn-primary', full ? 'w-full' : ''].join(' ')} onClick={onSignIn}>
      Sign in
    </button>
  )
}

function MobileLink({
  to,
  end,
  children,
}: {
  to: string
  end?: boolean
  children: ReactNode
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          'block rounded-xl px-3 py-2.5 text-sm font-semibold transition',
          isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-100',
        ].join(' ')
      }
    >
      {children}
    </NavLink>
  )
}

function KeyboardIcon({ small }: { small?: boolean }) {
  const s = small ? 16 : 20
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="6" width="20" height="13" rx="2" />
      <path
        d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h.01M18 14h.01M9 14h6"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ChevronDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition group-hover:rotate-180">
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  )
}
