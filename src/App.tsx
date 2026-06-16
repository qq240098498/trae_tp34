import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Pets from "@/pages/Pets";
import Inventory from "@/pages/Inventory";
import Feedings from "@/pages/Feedings";
import WeightTracking from "@/pages/WeightTracking";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pets" element={<Pets />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/feedings" element={<Feedings />} />
          <Route path="/weight" element={<WeightTracking />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}
