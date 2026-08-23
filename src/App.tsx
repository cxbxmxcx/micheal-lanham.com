import { BrowserRouter, Routes, Route } from 'react-router'
import Layout from './components/Layout'
import Home from './pages/Home'

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
