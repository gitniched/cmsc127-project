import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <NavBar />
        <main className="flex-1"></main>
          <Routes>
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
    </BrowserRouter>
  );
}

export default App;