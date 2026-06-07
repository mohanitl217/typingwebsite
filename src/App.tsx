import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import LearnTyping from './pages/LearnTyping'
import TakeTest from './pages/TakeTest'
import NumberTyping from './pages/NumberTyping'
import HindiLearnTyping from './pages/HindiLearnTyping'
import SignIn from './pages/SignIn'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'

const HINDI_FONTS = [
  { id: 'krutidev', label: 'KrutiDev', family: '"KrutiDev", "Kruti Dev 010", sans-serif' },
  { id: 'devlys', label: 'DevLys', family: '"DevLys", "DevLys 010", sans-serif' },
]

export default function App() {
  return (
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

      <Route path="/login" element={<Layout><SignIn /></Layout>} />
      <Route path="/admin" element={<Layout><AdminLogin /></Layout>} />
      <Route path="/admin/dashboard" element={<Layout><AdminDashboard /></Layout>} />
      <Route path="*" element={<Layout><Home /></Layout>} />
    </Routes>
  )
}
