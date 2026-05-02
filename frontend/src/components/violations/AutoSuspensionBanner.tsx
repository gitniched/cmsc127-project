import { Link } from 'react-router-dom';
import { buildRoute } from '../../constants/routes';

interface AutoSuspensionBannerProps {
  licenseNumber: string;
  driverName:    string;
}

export default function AutoSuspensionBanner({ licenseNumber, driverName }: AutoSuspensionBannerProps) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 flex gap-3">
      <div className="shrink-0 mt-0.5">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-amber-600"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>
      <div className="flex flex-col gap-1 min-w-0">
        <p className="text-sm font-semibold text-amber-800">Driver Auto-Suspended</p>
        <p className="text-sm text-amber-700">
          Saving this violation triggered an automatic suspension for{' '}
          <Link
            to={buildRoute.driverProfile(licenseNumber)}
            className="font-medium underline underline-offset-2 hover:text-amber-900 transition-colors"
          >
            {driverName}
          </Link>
          . They have accumulated 3 or more pending violations within their current license period.
        </p>
      </div>
    </div>
  );
}