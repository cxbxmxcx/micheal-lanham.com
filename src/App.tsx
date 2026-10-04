import { Routes, Route } from 'react-router'
import Layout from './components/Layout'
import Home from './pages/Home'
import BookLibrary from './pages/BookLibrary'
import BookDetail from './pages/BookDetail'
import WorkOverview from './pages/WorkOverview'
import ServiceDetail from './pages/ServiceDetail'
import DemoLibrary from './pages/DemoLibrary'
import DemoDetail from './pages/DemoDetail'
import NotFound from './pages/NotFound'

export default function App() {
  return <Layout><Routes>
    <Route path="/" element={<Home />} />
    <Route path="/books/" element={<BookLibrary />} />
    <Route path="/books/:slug/" element={<BookDetail />} />
    <Route path="/work/" element={<WorkOverview />} />
    <Route path="/work/:slug/" element={<ServiceDetail />} />
    <Route path="/demos/" element={<DemoLibrary />} />
    <Route path="/demos/:slug/" element={<DemoDetail />} />
    <Route path="*" element={<NotFound />} />
  </Routes></Layout>
}
