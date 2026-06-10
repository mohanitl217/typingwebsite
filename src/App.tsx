import { Routes, Route } from 'react-router-dom'
import { useParams, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Layout from './components/Layout'
import Home from './pages/Home'
import LearnTyping from './pages/LearnTyping'
import TakeTest from './pages/TakeTest'
import NumberTyping from './pages/NumberTyping'
import HindiLearnTyping from './pages/HindiLearnTyping'
import HindiUnicodeLearnTyping from './pages/HindiUnicodeLearnTyping'
import AdminDashboard from './pages/AdminDashboard'
import { getHindiLayout, hindiLayouts } from './lib/hindiLayouts'

const HINDI_FONTS = [
  { id: 'krutidev', label: 'KrutiDev', family: '"KrutiDev", "Kruti Dev 010", sans-serif' },
  { id: 'devlys', label: 'DevLys', family: '"DevLys", "DevLys 010", sans-serif' },
]

/** Route wrapper: Unicode (Mangal) Hindi typing test for the layout in the URL. */
function MangalTestRoute() {
  const { layout: slug } = useParams()
  const layout = getHindiLayout(slug) || hindiLayouts[0]
  return (
    <Layout>
      <TakeTest
        category="hindi-mangal-test"
        moduleName={`hindi-mangal-${layout.id}-test`}
        unicodeLayout={layout}
        heading={`Hindi Typing Test — ${layout.label} (Mangal Unicode)`}
      />
    </Layout>
  )
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
      <Route path="/" element={<Layout><Home /></Layout>} />
      <Route path="/learn/:lessonId" element={<Layout><LearnTyping /></Layout>} />
      <Route path="/test" element={<Layout><TakeTest /></Layout>} />
      <Route path="/numbers" element={<Layout><NumberTyping /></Layout>} />

      {/* Hindi Typing — KrutiDev & DevLys */}
      <Route
        path="/hindi/krutidev/learn/:lessonId"
        element={<Layout><HindiLearnTyping /></Layout>}
      />
      <Route
        path="/hindi/krutidev/test"
        element={
          <Layout>
            <TakeTest
              category="hindi-krutidev-test"
              moduleName="hindi-krutidev-test"
              fontOptions={HINDI_FONTS}
              heading="Hindi Typing Test — KrutiDev & DevLys"
            />
          </Layout>
        }
      />

      {/* Hindi Typing — Mangal Unicode (Remington GAIL / InScript / Remington CBI) */}
      <Route
        path="/hindi/mangal/:layout/learn/:lessonId"
        element={<Layout><HindiUnicodeLearnTyping /></Layout>}
      />
      <Route path="/hindi/mangal/:layout/test" element={<MangalTestRoute />} />

      <Route path="/admin/dashboard" element={<Layout><AdminDashboard /></Layout>} />
      <Route path="*" element={<Layout><Home /></Layout>} />
    </Routes>
    </>
  )
}

/**
 * Resets the window scroll position to the top whenever the route changes.
 * Without this, navigating from a scrolled-down page (e.g. clicking "Take Test"
 * on the Home page) would open the next page already scrolled down.
 */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}
