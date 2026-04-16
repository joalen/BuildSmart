import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import DescribeProject from '@/pages/DescribeProject'
import PlanResult from '@/pages/PlanResult'
import CostEstimate from '@/pages/CostEstimate'
//import Home from '@/pages/Home'
//import Cart from '@/pages/Cart'
//import Settings from '@/pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/plan" replace />} />
          <Route path="plan" element={<DescribeProject />} />
          <Route path="plan/result" element={<PlanResult />} />
          <Route path="cost" element={<CostEstimate />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}