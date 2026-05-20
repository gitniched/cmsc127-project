import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ROUTES } from './constants/routes';
export { buildRoute } from './constants/routes';
import NavBar from './components/ui/NavBar';

import Dashboard      from './pages/Dashboard';
import DriverList     from './pages/DriverList';
import DriverProfile  from './pages/DriverProfile';
import VehicleList    from './pages/VehicleList';
import VehicleDetail  from './pages/VehicleDetail';
import ViolationList  from './pages/ViolationList';
import ViolationDetail from './pages/ViolationDetail';
import Reports        from './pages/Reports';

function AnimatedRoutes() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div key={location.pathname} className="animate-page-enter flex-1 flex flex-col">
      <Routes location={location}>
        {/* Dashboard */}
        <Route path={ROUTES.dashboard}       element={<Dashboard />} />

        {/* Drivers */}
        <Route path={ROUTES.drivers}         element={<DriverList />} />
        <Route path={ROUTES.driverProfile}   element={<DriverProfile />} />

        {/* Vehicles */}
        <Route path={ROUTES.vehicles}        element={<VehicleList />} />
        <Route path={ROUTES.vehicleDetail}   element={<VehicleDetail />} />

        {/* Violations */}
        <Route path={ROUTES.violations}      element={<ViolationList />} />
        <Route path={ROUTES.violationDetail} element={<ViolationDetail />} />

        {/* Reports */}
        <Route path={ROUTES.reports}         element={<Reports />} />

        {/* redirect unknown paths to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <div style={{
          position: 'fixed',
          inset: 0,
          backdropFilter: 'blur(1.5px)', 
          WebkitBackdropFilter: 'blur(1.5px)',
          zIndex: -1,
          pointerEvents: 'none',
        }} />
        <NavBar />
        <main className="flex-1 flex flex-col pt-[72px]">
          <AnimatedRoutes />
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;