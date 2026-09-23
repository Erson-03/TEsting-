import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import { useAuth } from "./context/AuthContext";
import ConstraintCenterPage from "./pages/ConstraintCenterPage";
import DashboardPage from "./pages/DashboardPage";
import DemandPredictionPage from "./pages/DemandPredictionPage";
import ExplainabilityPage from "./pages/ExplainabilityPage";
import FairnessMonitorPage from "./pages/FairnessMonitorPage";
import InventoryPage from "./pages/InventoryPage";
import LoginPage from "./pages/LoginPage";
import ModelMonitoringPage from "./pages/ModelMonitoringPage";
import PriceOptimizationPage from "./pages/PriceOptimizationPage";
import PriceRecommendationPage from "./pages/PriceRecommendationPage";
import PricingHistoryPage from "./pages/PricingHistoryPage";
import ProductsPage from "./pages/ProductsPage";
import SalesDataPage from "./pages/SalesDataPage";
import SensitivityAnalysisPage from "./pages/SensitivityAnalysisPage";
import SettingsPage from "./pages/SettingsPage";

function ProtectedLayout() {
  const { authenticated } = useAuth();
  const location = useLocation();
  if (!authenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <AppShell />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/demand-prediction" element={<DemandPredictionPage />} />
        <Route path="/price-recommendation" element={<PriceRecommendationPage />} />
        <Route path="/price-optimization" element={<PriceOptimizationPage />} />
        <Route path="/constraint-center" element={<ConstraintCenterPage />} />
        <Route path="/sensitivity-analysis" element={<SensitivityAnalysisPage />} />
        <Route path="/fairness-monitor" element={<FairnessMonitorPage />} />
        <Route path="/explainability" element={<ExplainabilityPage />} />
        <Route path="/pricing-history" element={<PricingHistoryPage />} />
        <Route path="/model-monitoring" element={<ModelMonitoringPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/sales-data" element={<SalesDataPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
