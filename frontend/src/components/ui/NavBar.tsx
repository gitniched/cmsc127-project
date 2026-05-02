import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';
import { ROUTES } from '../../constants/routes';

interface NavItem {
  label: string;
  to:    string;
  icon:  ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    to:    ROUTES.dashboard,
    icon: (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    label: 'Drivers',
    to:    ROUTES.drivers,
    icon: (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.4" />
        <path
          d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    label: 'Vehicles',
    to:    ROUTES.vehicles,
    icon: (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
        <path
          d="M2 10V7.5L4.5 4h7L14 7.5V10"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="1" y="10" width="14" height="3" rx="1" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="4.5" cy="13" r="1" fill="currentColor" />
        <circle cx="11.5" cy="13" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: 'Violations',
    to:    ROUTES.violations,
    icon: (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
        <path
          d="M8 1.5L14.5 13H1.5L8 1.5Z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path d="M8 6v3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="8" cy="11" r="0.75" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: 'Reports',
    to:    ROUTES.reports,
    icon: (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="1" width="12" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M5 5h6M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function NavBar() {
  return (
    <>
      <style>{`
        .nav-wrapper {
          position: fixed;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          z-index: 50;
          width: 100%;
          max-width: 900px;
          padding: 12px 16px;
        }

        .nav-topbar {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 8px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.45);
          backdrop-filter: blur(16px) saturate(1.6);
          -webkit-backdrop-filter: blur(16px) saturate(1.6);
          border: 1px solid rgba(226, 232, 240, 0.9);
          box-shadow:
            0 2px 8px 0 rgba(0,0,0,0.06),
            0 1px 2px 0 rgba(0,0,0,0.03);
        }

        .nav-logo-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          height: 36px;
          padding: 0 6px 0 3px;
          border-radius: 10px;
          flex-shrink: 0;
          background: none;
          border: none;
          cursor: default;
          margin-right: 4px;
        }

        .nav-logo-icon {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .nav-brand-text {
          font-size: 14px;
          font-weight: 700;
          font-family: 'Syne', sans-serif;
          color: #0f172a;
          letter-spacing: -0.02em;
          white-space: nowrap;
        }

        .nav-divider {
          width: 1px;
          height: 22px;
          background: rgba(226, 232, 240, 0.8);
          margin: 0 4px;
          flex-shrink: 0;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 2px;
          margin-left: auto;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 6px;
          height: 36px;
          padding: 0 10px;
          border-radius: 10px;
          text-decoration: none;
          color: #64748b;
          flex-shrink: 0;
          transition: background 120ms ease, color 120ms ease;
          white-space: nowrap;
        }

        .nav-link:hover {
          background: rgba(241, 245, 249, 0.95);
          color: #0f172a;
        }

        .nav-link.active {
          background: rgba(239, 246, 255, 0.95);
          color: #2563eb;
        }

        .nav-link-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 18px;
          height: 18px;
        }

        .nav-link-label {
          font-size: 13.5px;
          font-weight: 500;
        }
      `}</style>

      <div className="nav-wrapper">
        <nav className="nav-topbar">
          <div className="nav-logo-btn">
            <div className="nav-logo-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 14h18v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4z" fill="white"/>
                <path d="M3 14l2.5-5h13l2.5 5" fill="white"/>
                <path d="M7.5 9l1.5-3h6l1.5 3" fill="white" opacity="0.5"/>
                <rect x="8" y="10" width="3" height="3" rx="0.5" fill="#2563eb" opacity="0.6"/>
                <rect x="13" y="10" width="3" height="3" rx="0.5" fill="#2563eb" opacity="0.6"/>
                <circle cx="7" cy="18" r="2" fill="#2563eb"/>
                <circle cx="7" cy="18" r="0.8" fill="white"/>
                <circle cx="17" cy="18" r="2" fill="#2563eb"/>
                <circle cx="17" cy="18" r="0.8" fill="white"/>
              </svg>
            </div>
            <span className="nav-brand-text">BiyaheDB</span>
          </div>

          <div className="nav-divider" />

          <div className="nav-links">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === ROUTES.dashboard}
                className={({ isActive }) =>
                  ['nav-link', isActive ? 'active' : ''].join(' ').trim()
                }
              >
                <span className="nav-link-icon">{item.icon}</span>
                <span className="nav-link-label">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </>
  );
}