import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import LearnTyping from './pages/LearnTyping'
import TakeTest from './pages/TakeTest'
import NumberTyping from './pages/NumberTyping'
import SignIn from './pages/SignIn'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout><Home /></Layout>} />
      <Route path="/learn/:lessonId" element={<Layout><LearnTyping /></Layout>} />
      <Route path="/test" element={<Layout><TakeTest /></Layout>} />
      <Route path="/numbers" element={<Layout><NumberTyping /></Layout>} />
      <Route path="/login" element={<Layout><SignIn /></Layout>} />
      <Route path="/admin" element={<Layout><AdminLogin /></Layout>} />
      <Route path="/admin/dashboard" element={<Layout><AdminDashboard /></Layout>} />
      <Route path="*" element={<Layout><Home /></Layout>} />
    </Routes>
  )
}
