import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Assistant from "./pages/Assistant.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Feed from "./pages/Feed.jsx";
import Home from "./pages/Home.jsx";
import MapPage from "./pages/MapPage.jsx";
import Report from "./pages/Report.jsx";
import RouteAnalyzer from "./pages/RouteAnalyzer.jsx";

export default function App() {
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return (
    <Layout darkMode={darkMode} setDarkMode={setDarkMode}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/report" element={<Report />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/route" element={<RouteAnalyzer />} />
        <Route path="/assistant" element={<Assistant />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
