import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import DescribeProject from '@/pages/DescribeProject'
import PlanResult from '@/pages/PlanResult'
import CostEstimate from '@/pages/CostEstimate'
import Cart from '@/pages/Cart'
import Login from '@/pages/Login'
import Account from '@/pages/Account'
import Projects from '@/pages/Projects'
import CreateAccount from '@/pages/CreateAccount'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Auth routes */}
        <Route path="/" element={<Login />} />
        <Route path="/create-account" element={<CreateAccount />} />

        {/* Main app */}
        <Route path="/" element={<Layout />}>
          <Route path="plan" element={<DescribeProject />} />
          <Route path="plan/result" element={<PlanResult />} />
          <Route path="cost" element={<CostEstimate />} />
          <Route path="cart" element={<Cart />} />
          <Route path="account" element={<Account />} />
          <Route path="projects" element={<Projects />} />
        </Route>

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  )
}