export const ROUTES = {
  dashboard:       '/',
  drivers:         '/drivers',
  driverProfile:   '/drivers/:licenseNumber',
  vehicles:        '/vehicles',
  vehicleDetail:   '/vehicles/:plateNumber',
  violations:      '/violations',
  violationDetail: '/violations/:uovrNumber',
  reports:         '/reports',
} as const;

export const buildRoute = {
  driverProfile:   (licenseNumber: string) => `/drivers/${licenseNumber}`,
  vehicleDetail:   (plateNumber: string)   => `/vehicles/${plateNumber}`,
  violationDetail: (uovrNumber: string)    => `/violations/${uovrNumber}`,
};